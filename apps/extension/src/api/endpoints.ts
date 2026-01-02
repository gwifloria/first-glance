/**
 * API 端点配置
 */
export const API_BASE = 'https://api.dida365.com/open/v1'

export const endpoints = {
  // 项目相关
  projects: '/project',
  projectData: (projectId: string) => `/project/${projectId}/data`,

  // 任务相关
  task: '/task',
  taskById: (taskId: string) => `/task/${taskId}`,
  completeTask: (projectId: string, taskId: string) =>
    `/project/${projectId}/task/${taskId}/complete`,
  deleteTask: (projectId: string, taskId: string) =>
    `/project/${projectId}/task/${taskId}`,
}
