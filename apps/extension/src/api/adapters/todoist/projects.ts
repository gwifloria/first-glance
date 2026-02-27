/**
 * Todoist 项目 API
 */
import { fetchAllPages } from './client'
import { endpoints } from './endpoints'
import type { TodoistProject } from './TodoistAdapter'

export const projectsApi = {
  /** 获取所有项目（自动分页） */
  async getAll(): Promise<TodoistProject[]> {
    return fetchAllPages<TodoistProject>(endpoints.projects)
  },
}
