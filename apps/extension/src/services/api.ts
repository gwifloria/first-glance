import { auth } from './auth'
import { storage } from './storage'
import type { Task, Project } from '@/types'

const API_BASE = 'https://api.dida365.com/open/v1'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await auth.getValidToken()
  if (!token) {
    throw new Error('未登录')
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.errorMessage || `请求失败: ${response.status}`)
  }

  // 204 No Content 或空响应体
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text)
}

export const api = {
  // 获取所有项目
  async getProjects(): Promise<Project[]> {
    const projects = await request<Project[]>('/project')
    await storage.setCachedProjects(projects)
    return projects
  },

  // 获取项目下的所有数据（包括任务）
  async getProjectData(projectId: string): Promise<{ tasks: Task[] }> {
    return request(`/project/${projectId}/data`)
  },

  // 获取收集箱任务
  async getInboxTasks(): Promise<Task[]> {
    const data = await this.getProjectData('inbox')
    return (data.tasks || []).filter((task) => task.status === 0)
  },

  // 获取所有任务
  async getAllTasks(): Promise<{ tasks: Task[]; projects: Project[] }> {
    const projects = await this.getProjects()

    // 并行获取所有项目的任务
    const projectDataPromises = projects
      .filter((p) => !p.closed)
      .map((p) =>
        this.getProjectData(p.id)
          .then((data) => data.tasks || [])
          .catch((err) => {
            const errorMsg = err instanceof Error ? err.message : '未知错误'
            console.error(`获取项目 ${p.name} 的任务失败:`, errorMsg)
            return [] as Task[]
          })
      )

    // 并行获取收集箱任务
    const inboxPromise = this.getProjectData('inbox')
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

  // 创建任务
  async createTask(task: Partial<Task>): Promise<Task> {
    return request('/task', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  },

  // 更新任务
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    return request(`/task/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    })
  },

  // 完成任务
  async completeTask(projectId: string, taskId: string): Promise<void> {
    return request(`/project/${projectId}/task/${taskId}/complete`, {
      method: 'POST',
    })
  },

  // 删除任务
  async deleteTask(projectId: string, taskId: string): Promise<void> {
    return request(`/project/${projectId}/task/${taskId}`, {
      method: 'DELETE',
    })
  },
}
