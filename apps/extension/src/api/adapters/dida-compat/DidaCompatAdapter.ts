/**
 * 滴答清单/TickTick 共用适配器
 * 两者使用相同的 API 格式，仅域名和认证不同
 */
import type { TasksApi } from './tasks'
import type { ProjectsApi } from './projects'
import type { Task, Project } from '@/types'
import type {
  ITaskAdapter,
  CreateTaskInput,
  UpdateTaskInput,
  GetAllTasksResult,
} from '../types'

export class DidaCompatAdapter implements ITaskAdapter {
  readonly name: string
  private tasksApi: TasksApi
  private projectsApi: ProjectsApi

  constructor(name: string, tasksApi: TasksApi, projectsApi: ProjectsApi) {
    this.name = name
    this.tasksApi = tasksApi
    this.projectsApi = projectsApi
  }

  async getProjects(): Promise<Project[]> {
    return this.projectsApi.getAll()
  }

  async getAllTasks(): Promise<GetAllTasksResult> {
    return this.projectsApi.getAllTasks()
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    return this.tasksApi.create({
      title: input.title,
      projectId: input.projectId,
      content: input.content,
      priority: input.priority ?? 0,
      dueDate: input.dueDate,
      parentId: input.parentId,
    })
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    return this.tasksApi.update(taskId, input)
  }

  async completeTask(task: Task): Promise<void> {
    return this.tasksApi.complete(task.projectId, task.id)
  }

  async deleteTask(task: Task): Promise<void> {
    return this.tasksApi.delete(task.projectId, task.id)
  }
}
