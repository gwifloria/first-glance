/**
 * 任务后端适配器接口
 * 定义统一的 API 接口，支持多种后端（滴答清单、Notion、Todoist 等）
 */
import type { Task, Project } from '@/types'

/** 创建任务的输入 */
export interface CreateTaskInput {
  title: string
  projectId?: string
  content?: string
  priority?: number
  dueDate?: string
  parentId?: string
}

/** 更新任务的输入 */
export interface UpdateTaskInput {
  title?: string
  content?: string
  priority?: number
  dueDate?: string
  projectId?: string
}

/** 获取任务的返回结果 */
export interface GetAllTasksResult {
  tasks: Task[]
  projects: Project[]
}

/**
 * 任务后端适配器接口
 */
export interface ITaskAdapter {
  /** 适配器名称 */
  readonly name: string

  // ========== 项目操作 ==========

  /** 获取所有项目 */
  getProjects(): Promise<Project[]>

  // ========== 任务操作 ==========

  /** 获取所有任务和项目 */
  getAllTasks(): Promise<GetAllTasksResult>

  /** 创建任务 */
  createTask(input: CreateTaskInput): Promise<Task>

  /** 更新任务 */
  updateTask(taskId: string, input: UpdateTaskInput): Promise<Task>

  /** 完成任务 */
  completeTask(task: Task): Promise<void>

  /** 删除任务 */
  deleteTask(task: Task): Promise<void>
}

/** 适配器类型 */
export type AdapterType = 'didaList' | 'notion' | 'todoist' | 'local'

/** 适配器配置 */
export interface AdapterConfig {
  type: AdapterType
}
