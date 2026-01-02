/**
 * 任务相关 API
 */
import { request } from './client'
import { endpoints } from './endpoints'
import type { Task } from '@/types'

export const tasksApi = {
  /** 创建任务 */
  create(task: Partial<Task>): Promise<Task> {
    return request(endpoints.task, {
      method: 'POST',
      body: JSON.stringify(task),
    })
  },

  /** 更新任务 */
  update(taskId: string, updates: Partial<Task>): Promise<Task> {
    return request(endpoints.taskById(taskId), {
      method: 'POST',
      body: JSON.stringify(updates),
    })
  },

  /** 完成任务 */
  complete(projectId: string, taskId: string): Promise<void> {
    return request(endpoints.completeTask(projectId, taskId), {
      method: 'POST',
    })
  },

  /** 删除任务 */
  delete(projectId: string, taskId: string): Promise<void> {
    return request(endpoints.deleteTask(projectId, taskId), {
      method: 'DELETE',
    })
  },
}
