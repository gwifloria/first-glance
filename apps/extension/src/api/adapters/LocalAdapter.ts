/**
 * 本地存储适配器
 * 用于访客模式，数据存储在 chrome.storage.local
 */
import { localTaskStorage } from '@/services/localTaskStorage'
import type { Task, Project, LocalTask } from '@/types'
import type {
  ITaskAdapter,
  CreateTaskInput,
  UpdateTaskInput,
  GetAllTasksResult,
} from './types'

const LOCAL_PROJECT_ID = 'local-inbox'

export class LocalAdapter implements ITaskAdapter {
  readonly name = 'local'

  /**
   * 将 LocalTask 转换为 Task 格式
   */
  private toTask(local: LocalTask): Task {
    return {
      id: local.id,
      projectId: LOCAL_PROJECT_ID,
      title: local.title,
      priority: local.priority,
      dueDate: local.dueDate,
      status: local.status,
      createdTime: local.createdTime,
      sortOrder: 0,
      // 本地模式只有收集箱一个项目，全部任务即收集箱任务
      isInbox: true,
    }
  }

  async getProjects(): Promise<Project[]> {
    return [
      {
        id: LOCAL_PROJECT_ID,
        name: '收集箱',
        sortOrder: 0,
      },
    ]
  }

  async getAllTasks(): Promise<GetAllTasksResult> {
    const localTasks = await localTaskStorage.getPendingTasks()
    return {
      tasks: localTasks.map((t) => this.toTask(t)),
      projects: await this.getProjects(),
    }
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const local = await localTaskStorage.createQuickTask(input.title)
    if (!local) {
      throw new Error('任务数量已达上限（最多 3 个）')
    }
    return this.toTask(local)
  }

  async updateTask(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _taskId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _input: UpdateTaskInput
  ): Promise<Task> {
    // 访客模式不支持更新任务
    throw new Error('访客模式不支持编辑任务')
  }

  async completeTask(task: Task): Promise<void> {
    await localTaskStorage.completeTask(task.id)
  }

  async deleteTask(task: Task): Promise<void> {
    await localTaskStorage.deleteTask(task.id)
  }
}

/** 单例实例 */
export const localAdapter = new LocalAdapter()
