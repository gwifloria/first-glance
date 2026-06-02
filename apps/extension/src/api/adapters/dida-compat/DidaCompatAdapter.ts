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
  // 滴答/TickTick 开放 API 不支持真实子任务、独立 deadline，也不暴露 tags
  readonly capabilities = { subtasks: false, deadline: false, labels: false }
  private tasksApi: TasksApi
  private projectsApi: ProjectsApi

  constructor(name: string, tasksApi: TasksApi, projectsApi: ProjectsApi) {
    this.name = name
    this.tasksApi = tasksApi
    this.projectsApi = projectsApi
  }

  // 滴答/TickTick 的 inbox 项目真实 id 以 'inbox' 开头，用作 isInbox 判定
  private stamp(task: Task): Task {
    return { ...task, isInbox: !!task.projectId?.startsWith('inbox') }
  }

  async getProjects(): Promise<Project[]> {
    return this.projectsApi.getAll()
  }

  async getAllTasks(): Promise<GetAllTasksResult> {
    const { tasks, projects } = await this.projectsApi.getAllTasks()
    return { tasks: tasks.map((t) => this.stamp(t)), projects }
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const task = await this.tasksApi.create({
      title: input.title,
      projectId: input.projectId,
      content: input.content,
      priority: input.priority ?? 0,
      dueDate: input.dueDate,
      parentId: input.parentId,
      tags: input.tags,
    })
    return this.stamp(task)
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const task = await this.tasksApi.update(taskId, input)
    return this.stamp(task)
  }

  async completeTask(task: Task): Promise<void> {
    return this.tasksApi.complete(task.projectId, task.id)
  }

  async deleteTask(task: Task): Promise<void> {
    return this.tasksApi.delete(task.projectId, task.id)
  }
}
