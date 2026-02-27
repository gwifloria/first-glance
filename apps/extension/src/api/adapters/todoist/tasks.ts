/**
 * Todoist 任务 API
 */
import { request, fetchAllPages } from './client'
import { endpoints } from './endpoints'
import type {
  TodoistTask,
  TodoistCreateTaskRequest,
  TodoistUpdateTaskRequest,
} from './TodoistAdapter'

export const tasksApi = {
  /** 获取所有活跃任务（自动分页） */
  async getAll(): Promise<TodoistTask[]> {
    return fetchAllPages<TodoistTask>(endpoints.tasks)
  },

  /** 创建任务 */
  async create(input: TodoistCreateTaskRequest): Promise<TodoistTask> {
    return request<TodoistTask>(endpoints.tasks, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  /** 更新任务 */
  async update(
    taskId: string,
    input: TodoistUpdateTaskRequest
  ): Promise<TodoistTask> {
    return request<TodoistTask>(endpoints.taskById(taskId), {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  /** 完成任务 */
  async close(taskId: string): Promise<void> {
    return request(endpoints.closeTask(taskId), { method: 'POST' })
  },

  /** 删除任务 */
  async delete(taskId: string): Promise<void> {
    return request(endpoints.taskById(taskId), { method: 'DELETE' })
  },
}
