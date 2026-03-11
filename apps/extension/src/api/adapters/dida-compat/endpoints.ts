/**
 * 滴答清单/TickTick 共用 API 端点路径
 */
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
