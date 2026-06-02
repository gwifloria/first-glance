import type { Task } from '@/types'

// sortOrder=Default, name=Name, dueDate=Date, createdTime=Date added, deadline, priority
export type SortOption =
  | 'priority'
  | 'dueDate'
  | 'createdTime'
  | 'sortOrder'
  | 'name'
  | 'deadline'
// none, date, dateAdded=Date added, deadline, priority, label, project(内部用)
export type GroupOption =
  | 'date'
  | 'priority'
  | 'project'
  | 'none'
  | 'dateAdded'
  | 'deadline'
  | 'label'

export interface TaskGroup {
  id: string
  title: string
  tasks: Task[]
}

export interface TaskCounts {
  inbox: number
  today: number
  tomorrow: number
  week: number
  overdue: number
}

/**
 * 按日期分组的任务
 */
export interface TasksByDate {
  pinned: Task[]
  overdue: Task[]
  today: Task[]
  tomorrow: Task[]
  later: Task[]
  nodate: Task[]
}

/**
 * 统一计算的视图数据
 * 一次遍历 tasks 数组，输出所有派生数据
 */
export interface ComputedViews {
  /** 各筛选器的任务数量 */
  counts: TaskCounts
  /** 每个项目的任务数量 Map<projectId, count> */
  projectCounts: Map<string, number>
  /** 按日期分组的任务 */
  byDate: TasksByDate
  /** 收集箱任务 */
  inbox: Task[]
}
