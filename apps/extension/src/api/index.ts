/**
 * API 层统一导出
 */
export { API_BASE, endpoints } from './endpoints'
export { request } from './client'
export { tasksApi } from './tasks'
export { projectsApi } from './projects'

// 兼容旧 API 接口
import { tasksApi } from './tasks'
import { projectsApi } from './projects'

export const api = {
  // 项目
  getProjects: projectsApi.getAll.bind(projectsApi),
  getProjectData: projectsApi.getData.bind(projectsApi),
  getInboxTasks: projectsApi.getInboxTasks.bind(projectsApi),
  getAllTasks: projectsApi.getAllTasks.bind(projectsApi),

  // 任务
  createTask: tasksApi.create,
  updateTask: tasksApi.update,
  completeTask: tasksApi.complete,
  deleteTask: tasksApi.delete,
}
