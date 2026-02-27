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
    /** 全天: "YYYY-MM-DD"；带时间: "YYYY-MM-DDTHH:MM:SSZ" (UTC) */
    date: string
    string: string
    timezone?: string | null
    isRecurring: boolean
  }
  childOrder: number
  addedAt: string
  labels: string[]
  parentId?: string
}

/** Todoist 项目（API 响应，经 camelCase 转换后） */
export interface TodoistProject {
  id: string
  name: string
  color: string
  childOrder: number
  inboxProject: boolean
  isFavorite: boolean
  parentId?: string
  viewStyle: string
}

/** due 对象（用于创建/更新请求） */
interface TodoistDueInput {
  /** 本地时间: "YYYY-MM-DD" 或 "YYYY-MM-DDTHH:MM:SS" */
  date: string
  /** IANA 时区名，带时间时必填 */
  timezone?: string
}

/** 创建任务请求体 */
export interface TodoistCreateTaskRequest {
  content: string
  description?: string
  projectId?: string
  priority?: number
  due?: TodoistDueInput
}

/** 更新任务请求体 */
export interface TodoistUpdateTaskRequest {
  content?: string
  description?: string
  priority?: number
  due?: TodoistDueInput | null
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
    dueDate: raw.due?.date,
    isAllDay: raw.due?.date ? !raw.due.date.includes('T') : true,
    priority: priorityFromTodoist(raw.priority),
    status: raw.checked ? 2 : 0,
    sortOrder: raw.childOrder,
    createdTime: raw.addedAt,
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
 * 将 dueDate 字符串转为 Todoist due 对象
 * - "YYYY-MM-DD" → 全天任务
 * - "YYYY-MM-DDTHH:MM:SS..." → 带时间任务（附加浏览器时区）
 */
function buildDueObject(dueDate: string): TodoistDueInput {
  if (dueDate.includes('T')) {
    // 提取本地时间部分（去除毫秒、偏移量、Z 后缀）
    const localDateTime = dueDate
      .replace(/\.\d{3}/, '')
      .replace(/[+-]\d{2}:\d{2}$/, '')
      .replace(/Z$/, '')
    return {
      date: localDateTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }
  return { date: dueDate }
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
  if (input.dueDate) req.due = buildDueObject(input.dueDate)

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
    req.due = input.dueDate ? buildDueObject(input.dueDate) : null
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
    const [todoistTasks, projects] = await Promise.all([
      tasksApi.getAll(),
      this.getProjects(),
    ])

    const tasks = todoistTasks
      .map(transformTaskFromTodoist)
      .filter((task) => task.status === 0)

    await storage.setCachedTasks(tasks)
    return { tasks, projects }
  }

  async getInboxTasks(): Promise<Task[]> {
    const todoistProjects = await projectsApi.getAll()
    const inbox = todoistProjects.find((p) => p.inboxProject)
    if (!inbox) return []

    const todoistTasks = await tasksApi.getByProject(inbox.id)
    return todoistTasks
      .map(transformTaskFromTodoist)
      .filter((task) => task.status === 0)
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
