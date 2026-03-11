/**
 * 滴答清单/TickTick 共用任务 API
 */
import type { RequestFn } from './client'
import { endpoints } from './endpoints'
import type { Task } from '@/types'

export interface TasksApi {
  create(task: Partial<Task>): Promise<Task>
  update(taskId: string, updates: Partial<Task>): Promise<Task>
  complete(projectId: string, taskId: string): Promise<void>
  delete(projectId: string, taskId: string): Promise<void>
}

export function createTasksApi(req: RequestFn): TasksApi {
  return {
    create(task: Partial<Task>): Promise<Task> {
      return req(endpoints.task, {
        method: 'POST',
        body: JSON.stringify(task),
      })
    },

    update(taskId: string, updates: Partial<Task>): Promise<Task> {
      return req(endpoints.taskById(taskId), {
        method: 'POST',
        body: JSON.stringify(updates),
      })
    },

    complete(projectId: string, taskId: string): Promise<void> {
      return req(endpoints.completeTask(projectId, taskId), {
        method: 'POST',
      })
    },

    delete(projectId: string, taskId: string): Promise<void> {
      return req(endpoints.deleteTask(projectId, taskId), {
        method: 'DELETE',
      })
    },
  }
}
