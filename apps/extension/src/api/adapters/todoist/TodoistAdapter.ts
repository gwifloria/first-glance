/**
 * Todoist 适配器实现
 */
import type { Task, Project } from '@/types'
import type {
  ITaskAdapter,
  CreateTaskInput,
  UpdateTaskInput,
  GetAllTasksResult,
} from '../types'
import { storage } from '@/services/storage'
import { tasksApi } from './tasks'
import { projectsApi } from './projects'
import {
  transformTaskFromTodoist,
  transformProjectFromTodoist,
  transformCreateTaskToTodoist,
  transformUpdateTaskToTodoist,
} from './transforms'

export class TodoistAdapter implements ITaskAdapter {
  readonly name = 'todoist'

  /**
   * 获取所有项目
   */
  async getProjects(): Promise<Project[]> {
    const todoistProjects = await projectsApi.getAll()
    const projects = todoistProjects.map(transformProjectFromTodoist)

    // 按 sortOrder 排序，inbox 在最前
    projects.sort((a, b) => {
      if (a.kind === 'INBOX') return -1
      if (b.kind === 'INBOX') return 1
      return a.sortOrder - b.sortOrder
    })

    await storage.setCachedProjects(projects)
    return projects
  }

  /**
   * 获取所有任务和项目
   */
  async getAllTasks(): Promise<GetAllTasksResult> {
    // 并行获取任务和项目
    const [todoistTasks, projects] = await Promise.all([
      tasksApi.getAll(),
      this.getProjects(),
    ])

    // 转换任务并过滤已完成的
    const tasks = todoistTasks
      .map(transformTaskFromTodoist)
      .filter((task) => task.status === 0)

    await storage.setCachedTasks(tasks)

    return { tasks, projects }
  }

  /**
   * 获取收集箱任务
   */
  async getInboxTasks(): Promise<Task[]> {
    // 获取项目列表找到 inbox
    const todoistProjects = await projectsApi.getAll()
    const inboxProject = todoistProjects.find((p) => p.is_inbox_project)

    if (!inboxProject) {
      return []
    }

    const todoistTasks = await tasksApi.getByProject(inboxProject.id)
    return todoistTasks
      .map(transformTaskFromTodoist)
      .filter((task) => task.status === 0)
  }

  /**
   * 创建任务
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    const todoistInput = transformCreateTaskToTodoist(input)
    const todoistTask = await tasksApi.create(todoistInput)
    return transformTaskFromTodoist(todoistTask)
  }

  /**
   * 更新任务
   */
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const todoistInput = transformUpdateTaskToTodoist(input)
    const todoistTask = await tasksApi.update(taskId, todoistInput)
    return transformTaskFromTodoist(todoistTask)
  }

  /**
   * 完成任务
   */
  async completeTask(task: Task): Promise<void> {
    await tasksApi.close(task.id)
  }

  /**
   * 删除任务
   */
  async deleteTask(task: Task): Promise<void> {
    await tasksApi.delete(task.id)
  }
}

export const todoistAdapter = new TodoistAdapter()
