/**
 * Todoist 数据转换层
 * 负责 Todoist API 格式与内部 Task/Project 格式的双向转换
 */
import type { Task, Project } from '@/types'

/**
 * Todoist 原始任务格式
 * 参考: https://developer.todoist.com/rest/v2/#tasks
 */
export interface TodoistTask {
  id: string
  project_id: string
  content: string
  description: string
  is_completed: boolean
  priority: number // 1=普通, 2=低优先级, 3=中优先级, 4=高优先级 (注意：与显示相反)
  due?: {
    date: string // YYYY-MM-DD 或 YYYY-MM-DDTHH:MM:SS
    datetime?: string
    string: string
    timezone?: string
    is_recurring: boolean
  }
  order: number
  created_at: string
  labels: string[]
  parent_id?: string
}

/**
 * Todoist 原始项目格式
 */
export interface TodoistProject {
  id: string
  name: string
  color: string
  order: number
  is_inbox_project: boolean
  is_favorite: boolean
  parent_id?: string
  view_style: string
}

/**
 * 创建任务请求体
 */
export interface TodoistCreateTaskRequest {
  content: string
  description?: string
  project_id?: string
  priority?: number
  due_date?: string
  due_datetime?: string
}

/**
 * 更新任务请求体
 */
export interface TodoistUpdateTaskRequest {
  content?: string
  description?: string
  priority?: number
  due_date?: string
  due_datetime?: string
}

/**
 * 优先级转换：Todoist → 内部格式
 * Todoist: 1=普通, 2=低, 3=中, 4=高 (数字越大优先级越高)
 * 内部: 0=无, 1=低, 3=中, 5=高
 */
function transformPriorityFromTodoist(todoistPriority: number): number {
  switch (todoistPriority) {
    case 4:
      return 5 // 高
    case 3:
      return 3 // 中
    case 2:
      return 1 // 低
    default:
      return 0 // 无
  }
}

/**
 * 优先级转换：内部格式 → Todoist
 */
function transformPriorityToTodoist(internalPriority: number): number {
  if (internalPriority >= 5) return 4 // 高
  if (internalPriority >= 3) return 3 // 中
  if (internalPriority >= 1) return 2 // 低
  return 1 // 普通
}

/**
 * 日期转换：Todoist due → 内部 dueDate
 */
function transformDueDateFromTodoist(
  due?: TodoistTask['due']
): string | undefined {
  if (!due) return undefined
  // 优先使用 datetime，否则使用 date
  return due.datetime || due.date
}

/**
 * 转换 Todoist 任务到内部格式
 */
export function transformTaskFromTodoist(todoistTask: TodoistTask): Task {
  return {
    id: todoistTask.id,
    projectId: todoistTask.project_id,
    title: todoistTask.content,
    content: todoistTask.description || undefined,
    dueDate: transformDueDateFromTodoist(todoistTask.due),
    isAllDay: todoistTask.due?.datetime ? false : true,
    priority: transformPriorityFromTodoist(todoistTask.priority),
    status: todoistTask.is_completed ? 2 : 0,
    sortOrder: todoistTask.order,
    createdTime: todoistTask.created_at,
    tags: todoistTask.labels,
  }
}

/**
 * 转换内部任务输入到 Todoist 创建请求格式
 */
export function transformCreateTaskToTodoist(input: {
  title: string
  projectId?: string
  content?: string
  priority?: number
  dueDate?: string
}): TodoistCreateTaskRequest {
  const request: TodoistCreateTaskRequest = {
    content: input.title,
  }

  if (input.projectId) {
    request.project_id = input.projectId
  }

  if (input.content) {
    request.description = input.content
  }

  if (input.priority !== undefined) {
    request.priority = transformPriorityToTodoist(input.priority)
  }

  if (input.dueDate) {
    // 判断是否包含时间
    if (input.dueDate.includes('T')) {
      request.due_datetime = input.dueDate
    } else {
      request.due_date = input.dueDate
    }
  }

  return request
}

/**
 * 转换内部更新输入到 Todoist 更新请求格式
 */
export function transformUpdateTaskToTodoist(input: {
  title?: string
  content?: string
  priority?: number
  dueDate?: string
}): TodoistUpdateTaskRequest {
  const request: TodoistUpdateTaskRequest = {}

  if (input.title !== undefined) {
    request.content = input.title
  }

  if (input.content !== undefined) {
    request.description = input.content
  }

  if (input.priority !== undefined) {
    request.priority = transformPriorityToTodoist(input.priority)
  }

  if (input.dueDate !== undefined) {
    // 判断是否包含时间
    if (input.dueDate && input.dueDate.includes('T')) {
      request.due_datetime = input.dueDate
    } else {
      request.due_date = input.dueDate || undefined
    }
  }

  return request
}

/**
 * 转换 Todoist 项目到内部格式
 */
export function transformProjectFromTodoist(
  todoistProject: TodoistProject
): Project {
  return {
    id: todoistProject.id,
    name: todoistProject.name,
    sortOrder: todoistProject.order,
    kind: todoistProject.is_inbox_project ? 'INBOX' : undefined,
  }
}
