/**
 * 滴答清单/TickTick 兼容适配器
 * 支持所有使用相同 API 格式的服务（滴答清单、TickTick）
 */
import { tasksApi as didaTasksApi, type TasksApi } from './tasks'
import { projectsApi as didaProjectsApi, type ProjectsApi } from './projects'
import type { Task, Project } from '@/types'
import type {
  ITaskAdapter,
  CreateTaskInput,
  UpdateTaskInput,
  GetAllTasksResult,
} from '../types'

export class DidaListAdapter implements ITaskAdapter {
  readonly name: string
  private tasksApi: TasksApi
  private projectsApi: ProjectsApi

  constructor(
    name = 'didaList',
    tasksApi: TasksApi = didaTasksApi,
    projectsApi: ProjectsApi = didaProjectsApi
  ) {
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

/** 单例实例 */
export const didaListAdapter = new DidaListAdapter()
