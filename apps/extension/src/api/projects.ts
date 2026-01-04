/**
 * 项目相关 API
 */
import { request } from './client'
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

export const projectsApi = {
  /** 获取所有项目 */
  async getAll(): Promise<Project[]> {
    const projects = await request<Project[]>(endpoints.projects)
    await storage.setCachedProjects(projects)
    return projects
  },

  /** 获取项目数据（包括任务） */
  getData(projectId: string): Promise<{ tasks: Task[] }> {
    return request(endpoints.projectData(projectId))
  },

  /** 获取收集箱任务 */
  async getInboxTasks(): Promise<Task[]> {
    const data = await this.getData('inbox')
    return (data.tasks || []).filter((task) => task.status === 0)
  },

  /** 获取所有任务 */
  async getAllTasks(): Promise<{ tasks: Task[]; projects: Project[] }> {
    const projects = await this.getAll()

    // 并行获取所有项目的任务（带重试）
    const projectDataPromises = projects
      .filter((p) => !p.closed)
      .map((p) =>
        withRetry(() => this.getData(p.id))
          .then((data) => data.tasks || [])
          .catch((err) => {
            const errorMsg = err instanceof Error ? err.message : '未知错误'
            console.error(`获取项目 ${p.name} 的任务失败:`, errorMsg)
            return [] as Task[]
          })
      )

    // 并行获取收集箱任务（带重试）
    const inboxPromise = withRetry(() => this.getData('inbox'))
      .then((data) => data.tasks || [])
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : '未知错误'
        console.error('获取收集箱任务失败:', errorMsg)
        return [] as Task[]
      })

    // 等待所有请求完成
    const taskArrays = await Promise.all([...projectDataPromises, inboxPromise])
    const allTasks = taskArrays.flat()

    // 只返回未完成的任务
    const incompleteTasks = allTasks.filter((task) => task.status === 0)
    await storage.setCachedTasks(incompleteTasks)

    return { tasks: incompleteTasks, projects }
  },
}
