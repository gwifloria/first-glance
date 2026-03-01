/**
 * Todoist 适配器
 *
 * 包含：API 类型定义、数据转换、适配器实现
 * client.ts 已在网络边界做 snake_case ↔ camelCase 自动转换，
 * 因此这里的类型字段名统一使用 camelCase。
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

// ==================== Todoist API 类型 ====================

/** Todoist 任务（API 响应，经 camelCase 转换后） */
export interface TodoistTask {
  id: string
  projectId: string
  content: string
  description: string
  checked: boolean
  /** 1=普通, 2=低, 3=中, 4=高（数字越大优先级越高） */
  priority: number
  due?: {
    /** v1 API 中始终为纯日期 YYYY-MM-DD */
    date: string
    /** 带时间任务的 RFC3339 UTC datetime（如 "2024-01-15T06:30:00Z"），全天任务为 null */
    datetime?: string | null
    string: string
    timezone?: string | null
    lang?: string | null
    isRecurring: boolean
  }
  childOrder: number
  addedAt: string | null
  labels: string[]
  parentId?: string
}

/** Todoist 项目（API 响应，经 camelCase 转换后） */
export interface TodoistProject {
  id: string
  name: string
  color: string
  childOrder: number
  inboxProject?: boolean
  isFavorite: boolean
  parentId?: string
  viewStyle: string
}

/**
 * 创建任务请求体
 * Todoist v1 API 使用扁平 due_date / due_datetime 字段（非嵌套 due 对象）
 */
export interface TodoistCreateTaskRequest {
  content: string
  description?: string
  projectId?: string
  priority?: number
  /** 全天日期 YYYY-MM-DD */
  dueDate?: string
  /** 带时间的日期 RFC3339 UTC，如 2026-02-27T06:30:00Z */
  dueDatetime?: string
  /** 父任务 ID（创建子任务时使用） */
  parentId?: string
}

/** 更新任务请求体 */
export interface TodoistUpdateTaskRequest {
  content?: string
  description?: string
  priority?: number
  dueDate?: string | null
  dueDatetime?: string | null
}

// ==================== 数据转换 ====================

/**
 * 优先级：Todoist → 内部
 * Todoist: 1=普通, 2=低, 3=中, 4=高
 * 内部: 0=无, 1=低, 3=中, 5=高
 */
function priorityFromTodoist(p: number): number {
  switch (p) {
    case 4:
      return 5
    case 3:
      return 3
    case 2:
      return 1
    default:
      return 0
  }
}

/** 优先级：内部 → Todoist */
function priorityToTodoist(p: number): number {
  if (p >= 5) return 4
  if (p >= 3) return 3
  if (p >= 1) return 2
  return 1
}

/** Todoist 任务 → 内部 Task */
export function transformTaskFromTodoist(raw: TodoistTask): Task {
  return {
    id: raw.id,
    projectId: raw.projectId,
    title: raw.content,
    content: raw.description || undefined,
    dueDate: raw.due?.datetime ?? raw.due?.date,
    isAllDay: raw.due ? !raw.due.datetime : true,
    priority: priorityFromTodoist(raw.priority),
    status: raw.checked ? 2 : 0,
    sortOrder: raw.childOrder,
    createdTime: raw.addedAt ?? '',
    tags: raw.labels,
    parentId: raw.parentId || undefined,
  }
}

/** Todoist 项目 → 内部 Project */
export function transformProjectFromTodoist(raw: TodoistProject): Project {
  return {
    id: raw.id,
    name: raw.name,
    sortOrder: raw.childOrder,
    kind: raw.inboxProject ? 'INBOX' : undefined,
  }
}

/**
 * 将内部 dueDate 字符串映射到 Todoist v1 API 的扁平字段
 * - "YYYY-MM-DD" → dueDate（全天）
 * - 含 "T" 的 datetime → dueDatetime（带时间，需 UTC 格式）
 */
function applyDueFields(
  req: { dueDate?: string | null; dueDatetime?: string | null },
  dueDate: string
): void {
  if (dueDate.includes('T')) {
    // 确保是 UTC 格式（带 Z 后缀）
    // 输入可能是：本地 "2026-02-27T14:30:00"、UTC "2026-02-27T06:30:00Z"、带偏移 "...+08:00"
    const d = new Date(dueDate)
    req.dueDatetime = d.toISOString()
  } else {
    req.dueDate = dueDate
  }
}

/** 创建任务输入 → Todoist 请求体 */
export function transformCreateTaskToTodoist(
  input: CreateTaskInput
): TodoistCreateTaskRequest {
  const req: TodoistCreateTaskRequest = { content: input.title }

  if (input.projectId) req.projectId = input.projectId
  if (input.content) req.description = input.content
  if (input.priority !== undefined)
    req.priority = priorityToTodoist(input.priority)
  if (input.dueDate) applyDueFields(req, input.dueDate)
  if (input.parentId) req.parentId = input.parentId

  return req
}

/** 更新任务输入 → Todoist 请求体 */
export function transformUpdateTaskToTodoist(
  input: UpdateTaskInput
): TodoistUpdateTaskRequest {
  const req: TodoistUpdateTaskRequest = {}

  if (input.title !== undefined) req.content = input.title
  if (input.content !== undefined) req.description = input.content
  if (input.priority !== undefined)
    req.priority = priorityToTodoist(input.priority)

  if (input.dueDate !== undefined) {
    if (input.dueDate) {
      applyDueFields(req, input.dueDate)
    } else {
      // 清除日期：两个字段都置 null
      req.dueDate = null
      req.dueDatetime = null
    }
  }

  return req
}

// ==================== 适配器 ====================

export class TodoistAdapter implements ITaskAdapter {
  readonly name = 'todoist'

  async getProjects(): Promise<Project[]> {
    const todoistProjects = await projectsApi.getAll()
    const projects = todoistProjects.map(transformProjectFromTodoist)

    projects.sort((a, b) => {
      if (a.kind === 'INBOX') return -1
      if (b.kind === 'INBOX') return 1
      return a.sortOrder - b.sortOrder
    })

    await storage.setCachedProjects(projects)
    return projects
  }

  async getAllTasks(): Promise<GetAllTasksResult> {
    const [todoistTasks, todoistProjects] = await Promise.all([
      tasksApi.getAll(),
      projectsApi.getAll(),
    ])

    const projects = todoistProjects.map(transformProjectFromTodoist)
    projects.sort((a, b) => {
      if (a.kind === 'INBOX') return -1
      if (b.kind === 'INBOX') return 1
      return a.sortOrder - b.sortOrder
    })

    const tasks = todoistTasks
      .map(transformTaskFromTodoist)
      .filter((task) => task.status === 0)

    await Promise.all([
      storage.setCachedTasks(tasks),
      storage.setCachedProjects(projects),
    ])

    return { tasks, projects }
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const todoistInput = transformCreateTaskToTodoist(input)
    const todoistTask = await tasksApi.create(todoistInput)
    return transformTaskFromTodoist(todoistTask)
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const todoistInput = transformUpdateTaskToTodoist(input)
    const todoistTask = await tasksApi.update(taskId, todoistInput)
    return transformTaskFromTodoist(todoistTask)
  }

  async completeTask(task: Task): Promise<void> {
    await tasksApi.close(task.id)
  }

  async deleteTask(task: Task): Promise<void> {
    await tasksApi.delete(task.id)
  }
}

export const todoistAdapter = new TodoistAdapter()
