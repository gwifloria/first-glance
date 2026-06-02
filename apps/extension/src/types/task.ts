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
  /** 截止日（独立于 dueDate 的硬约束）。仅 Todoist 开放 API 提供 */
  deadline?: string
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
  /** 父任务 ID（子任务才有） */
  parentId?: string
  /**
   * 是否属于收集箱。由 adapter 层统一标记（各服务用各自规则：
   * Todoist 比对真实 inbox 项目 id，滴答用 id 前缀），通用层只读此标记。
   */
  isInbox?: boolean
  /**
   * 是否置顶。由 adapter 层统一标记：滴答用 sortOrder>0，Todoist/本地无置顶概念恒 false。
   * 不能在通用层用 sortOrder 猜——Todoist 的 sortOrder 来自 childOrder（位置序号，恒>0）。
   */
  isPinned?: boolean
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

/** 类型守卫：判断是否为本地任务 */
export function isLocalTask(task: Task | LocalTask): task is LocalTask {
  return 'isLocal' in task && task.isLocal === true
}
