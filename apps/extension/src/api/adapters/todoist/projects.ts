/**
 * Todoist 项目 API
 */
import { request, fetchAllPages } from './client'
import { endpoints } from './endpoints'
import type { TodoistProject } from './TodoistAdapter'

export const projectsApi = {
  /** 获取所有项目（自动分页） */
  async getAll(): Promise<TodoistProject[]> {
    return fetchAllPages<TodoistProject>(endpoints.projects)
  },

  /** 获取单个项目 */
  async getById(projectId: string): Promise<TodoistProject> {
    return request<TodoistProject>(endpoints.projectById(projectId))
  },
}
