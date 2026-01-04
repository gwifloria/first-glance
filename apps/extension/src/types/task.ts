/**
 * 任务相关类型定义
 */

/** 子任务项 */
export interface ChecklistItem {
  id: string
  title: string
  status: number
  sortOrder: number
}

/** 远程任务（滴答清单） */
export interface Task {
  id: string
  projectId: string
  title: string
  content?: string
  desc?: string
  isAllDay?: boolean
  startDate?: string
  dueDate?: string
  timeZone?: string
  reminders?: string[]
  repeatFlag?: string
  /** 优先级: 0=无, 1=低, 3=中, 5=高 */
  priority: number
  /** 状态: 0=未完成, 2=已完成 */
  status: number
  completedTime?: string
  sortOrder: number
  items?: ChecklistItem[]
  modifiedTime?: string
  createdTime?: string
  tags?: string[]
}

/** 本地任务（访客模式） */
export interface LocalTask {
  id: string
  title: string
  priority: number
  dueDate?: string
  /** 状态: 0=未完成, 2=已完成 */
  status: number
  createdTime: string
  isLocal: true
}

/** 任务优先级 */
export enum TaskPriority {
  None = 0,
  Low = 1,
  Medium = 3,
  High = 5,
}

/** 任务状态 */
export enum TaskStatus {
  Incomplete = 0,
  Completed = 2,
}

/** 类型守卫：判断是否为本地任务 */
export function isLocalTask(task: Task | LocalTask): task is LocalTask {
  return 'isLocal' in task && task.isLocal === true
}
