/**
 * 滴答清单/TickTick 共用项目 API
 */
import type { RequestFn } from './client'
import { endpoints } from './endpoints'
import { storage } from '@/services/storage'
import type { Task, Project } from '@/types'

/** 简单重试函数 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 500
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries) throw err
      await new Promise((r) => setTimeout(r, delay * (i + 1)))
    }
  }
  throw new Error('Retry exhausted')
}

/** 并发限制器：限制同时进行的请求数量 */
async function withConcurrencyLimit<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit = 5
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++
      results[currentIndex] = await fn(items[currentIndex])
    }
  }

  // 创建 limit 个 worker 并行执行
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker)
  await Promise.all(workers)

  return results
}

export interface ProjectsApi {
  getAll(): Promise<Project[]>
  // /project/{id}/data 响应含 project 对象，即使该清单当前没有任务也会返回
  getData(projectId: string): Promise<{ project?: Project; tasks: Task[] }>
  getInboxTasks(): Promise<Task[]>
  getAllTasks(): Promise<{ tasks: Task[]; projects: Project[] }>
}

export function createProjectsApi(req: RequestFn): ProjectsApi {
  const api: ProjectsApi = {
    async getAll(): Promise<Project[]> {
      const projects = await req<Project[]>(endpoints.projects)
      await storage.setCachedProjects(projects)
      return projects
    },

    getData(projectId: string): Promise<{ tasks: Task[] }> {
      return req(endpoints.projectData(projectId))
    },

    async getInboxTasks(): Promise<Task[]> {
      const data = await api.getData('inbox')
      return (data.tasks || []).filter((task) => task.status === 0)
    },

    async getAllTasks(): Promise<{ tasks: Task[]; projects: Project[] }> {
      const projects = await api.getAll()

      // 过滤未关闭的项目
      const activeProjects = projects.filter(
        (p) => !p.closed && p.kind !== 'FOLDER'
      )

      // 使用并发限制器获取任务（最多 5 个并发请求）
      const fetchProjectTasks = async (project: Project): Promise<Task[]> => {
        try {
          const data = await withRetry(() => api.getData(project.id))
          return data.tasks || []
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : '未知错误'
          console.error(`[API] 获取项目 ${project.name} 的任务失败:`, errorMsg)
          return []
        }
      }

      // 先获取收集箱数据（含 project 对象 + 任务）
      const inboxData = await withRetry(() => api.getData('inbox')).catch(
        (err) => {
          const errorMsg = err instanceof Error ? err.message : '未知错误'
          console.error('[API] 获取收集箱数据失败:', errorMsg)
          return { project: undefined, tasks: [] as Task[] }
        }
      )
      const inboxTasks = inboxData.tasks || []

      // 真实 inbox id：优先用接口返回的 project（收集箱为空也会返回），
      // 退而从任意收集箱任务推断。即使收集箱为空也尽量构造 inbox project，
      // 否则 projects 缺收集箱会让 resolveDefaultProjectId 把 inbox id 误当普通清单。
      const realInboxId = inboxData.project?.id ?? inboxTasks[0]?.projectId
      const inboxProject: Project | null = realInboxId
        ? {
            id: realInboxId,
            name: '收集箱', // Inbox 名称会在 UI 层通过 i18n 处理
            sortOrder: -1, // 确保排在最前面
            kind: 'INBOX',
          }
        : null

      // 使用并发限制获取项目任务
      const projectTaskArrays = await withConcurrencyLimit(
        activeProjects,
        fetchProjectTasks,
        5
      )

      // 合并所有任务
      const allTasks = [inboxTasks, ...projectTaskArrays].flat()

      // 只返回未完成的任务
      const incompleteTasks = allTasks.filter((task) => task.status === 0)
      await storage.setCachedTasks(incompleteTasks)

      // 将 inbox 添加到 projects 列表最前面
      const allProjects = inboxProject ? [inboxProject, ...projects] : projects
      await storage.setCachedProjects(allProjects)

      return { tasks: incompleteTasks, projects: allProjects }
    },
  }

  return api
}
