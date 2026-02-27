/**
 * Todoist API 端点配置
 * 文档: https://developer.todoist.com/api/v1/
 */
export const TODOIST_API_BASE = 'https://api.todoist.com/api/v1'

export const endpoints = {
  // 项目相关
  projects: '/projects',
  projectById: (projectId: string) => `/projects/${projectId}`,

  // 任务相关
  tasks: '/tasks',
  taskById: (taskId: string) => `/tasks/${taskId}`,
  closeTask: (taskId: string) => `/tasks/${taskId}/close`,
  reopenTask: (taskId: string) => `/tasks/${taskId}/reopen`,
}
