/**
 * 滴答清单适配器
 */
import { tasksApi } from './tasks'
import { projectsApi } from './projects'
import type { Task, Project } from '@/types'
import type {
  ITaskAdapter,
  CreateTaskInput,
  UpdateTaskInput,
  GetAllTasksResult,
} from '../types'

export class DidaListAdapter implements ITaskAdapter {
  readonly name = 'didaList'

  async getProjects(): Promise<Project[]> {
    return projectsApi.getAll()
  }

  async getAllTasks(): Promise<GetAllTasksResult> {
    return projectsApi.getAllTasks()
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    return tasksApi.create({
      title: input.title,
      projectId: input.projectId,
      content: input.content,
      priority: input.priority ?? 0,
      dueDate: input.dueDate,
      parentId: input.parentId,
    })
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    return tasksApi.update(taskId, input)
  }

  async completeTask(task: Task): Promise<void> {
    return tasksApi.complete(task.projectId, task.id)
  }

  async deleteTask(task: Task): Promise<void> {
    return tasksApi.delete(task.projectId, task.id)
  }
}

/** 单例实例 */
export const didaListAdapter = new DidaListAdapter()
