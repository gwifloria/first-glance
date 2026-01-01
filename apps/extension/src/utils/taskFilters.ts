import {
  extractDateStr,
  getTodayStr,
  getTomorrowStr,
  getNextWeekStr,
} from './date'
import type { Task, Project } from '@/types'

// ============ 类型定义 ============

export type SortOption = 'priority' | 'dueDate' | 'createdTime' | 'sortOrder'
export type GroupOption = 'date' | 'priority' | 'project' | 'none'

export interface TaskGroup {
  id: string
  title: string
  tasks: Task[]
}

// ============ 日期判断 ============

export function isToday(dueDate?: string): boolean {
  if (!dueDate) return false
  return extractDateStr(dueDate) === getTodayStr()
}

export function isTomorrow(dueDate?: string): boolean {
  if (!dueDate) return false
  return extractDateStr(dueDate) === getTomorrowStr()
}

export function isThisWeek(dueDate?: string): boolean {
  if (!dueDate) return false
  const dateStr = extractDateStr(dueDate)
  const todayStr = getTodayStr()
  const nextWeekStr = getNextWeekStr()
  return dateStr >= todayStr && dateStr < nextWeekStr
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false
  return extractDateStr(dueDate) < getTodayStr()
}

// ============ 筛选器 ============

export function filterTasks(
  tasks: Task[],
  filter: string,
  searchQuery?: string
): Task[] {
  let filtered = tasks

  // 按 filter 筛选
  if (filter.startsWith('project:')) {
    const projectId = filter.replace('project:', '')
    filtered = filtered.filter((t) => t.projectId === projectId)
  } else {
    switch (filter) {
      case 'inbox':
        filtered = filtered.filter((t) => t.projectId.startsWith('inbox'))
        break
      case 'today':
        filtered = filtered.filter((t) => isToday(t.dueDate))
        break
      case 'tomorrow':
        filtered = filtered.filter((t) => isTomorrow(t.dueDate))
        break
      case 'week':
        filtered = filtered.filter((t) => isThisWeek(t.dueDate))
        break
      case 'overdue':
        filtered = filtered.filter((t) => isOverdue(t.dueDate))
        break
      case 'nodate':
        filtered = filtered.filter((t) => !t.dueDate)
        break
    }
  }

  // 搜索过滤
  if (searchQuery?.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.content?.toLowerCase().includes(query)
    )
  }

  return filtered
}

// ============ 排序器 ============

export function sortTasks(tasks: Task[], by: SortOption): Task[] {
  const sorted = [...tasks]

  switch (by) {
    case 'priority':
      // 高优先级在前
      sorted.sort((a, b) => b.priority - a.priority)
      break
    case 'dueDate':
      // 早截止在前，无日期在后
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      })
      break
    case 'createdTime':
      // 新创建在前
      sorted.sort((a, b) => {
        const aTime = a.createdTime || ''
        const bTime = b.createdTime || ''
        return bTime.localeCompare(aTime)
      })
      break
    case 'sortOrder':
      // 按滴答清单原排序
      sorted.sort((a, b) => a.sortOrder - b.sortOrder)
      break
  }

  return sorted
}

// ============ 分组器 ============

export function groupTasks(
  tasks: Task[],
  groupBy: GroupOption,
  projects: Project[]
): TaskGroup[] {
  if (groupBy === 'none') {
    return [{ id: 'all', title: '所有任务', tasks }]
  }

  switch (groupBy) {
    case 'date':
      return groupByDate(tasks)
    case 'priority':
      return groupByPriority(tasks)
    case 'project':
      return groupByProject(tasks, projects)
    default:
      return [{ id: 'all', title: '所有任务', tasks }]
  }
}

function groupByDate(tasks: Task[]): TaskGroup[] {
  const todayStr = getTodayStr()
  const tomorrowStr = getTomorrowStr()
  const nextWeekStr = getNextWeekStr()

  const groups: TaskGroup[] = [
    { id: 'overdue', title: '已过期', tasks: [] },
    { id: 'today', title: '今天', tasks: [] },
    { id: 'tomorrow', title: '明天', tasks: [] },
    { id: 'week', title: '最近7天', tasks: [] },
    { id: 'later', title: '更晚', tasks: [] },
    { id: 'nodate', title: '无日期', tasks: [] },
  ]

  for (const task of tasks) {
    if (!task.dueDate) {
      groups[5].tasks.push(task)
    } else {
      const dateStr = extractDateStr(task.dueDate)
      if (dateStr < todayStr) {
        groups[0].tasks.push(task)
      } else if (dateStr === todayStr) {
        groups[1].tasks.push(task)
      } else if (dateStr === tomorrowStr) {
        groups[2].tasks.push(task)
      } else if (dateStr < nextWeekStr) {
        groups[3].tasks.push(task)
      } else {
        groups[4].tasks.push(task)
      }
    }
  }

  // 过滤掉空分组
  return groups.filter((g) => g.tasks.length > 0)
}

function groupByPriority(tasks: Task[]): TaskGroup[] {
  const groups: TaskGroup[] = [
    { id: 'high', title: '高优先级', tasks: [] },
    { id: 'medium', title: '中优先级', tasks: [] },
    { id: 'low', title: '低优先级', tasks: [] },
    { id: 'none', title: '无优先级', tasks: [] },
  ]

  for (const task of tasks) {
    if (task.priority >= 5) {
      groups[0].tasks.push(task)
    } else if (task.priority >= 3) {
      groups[1].tasks.push(task)
    } else if (task.priority >= 1) {
      groups[2].tasks.push(task)
    } else {
      groups[3].tasks.push(task)
    }
  }

  return groups.filter((g) => g.tasks.length > 0)
}

function groupByProject(tasks: Task[], projects: Project[]): TaskGroup[] {
  const projectMap = new Map<string, TaskGroup>()

  // 初始化收集箱
  projectMap.set('inbox', { id: 'inbox', title: '收集箱', tasks: [] })

  // 初始化其他项目
  for (const project of projects) {
    if (!project.closed) {
      projectMap.set(project.id, {
        id: project.id,
        title: project.name,
        tasks: [],
      })
    }
  }

  // 分配任务
  for (const task of tasks) {
    if (task.projectId.startsWith('inbox')) {
      projectMap.get('inbox')?.tasks.push(task)
    } else if (projectMap.has(task.projectId)) {
      projectMap.get(task.projectId)?.tasks.push(task)
    }
  }

  // 过滤空分组，收集箱放第一个
  const result: TaskGroup[] = []
  const inbox = projectMap.get('inbox')
  if (inbox && inbox.tasks.length > 0) {
    result.push(inbox)
  }

  for (const [id, group] of projectMap) {
    if (id !== 'inbox' && group.tasks.length > 0) {
      result.push(group)
    }
  }

  return result
}

// ============ 计算视图 ============

export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => isToday(t.dueDate))
}

/**
 * 获取今日专注任务
 * 逻辑：
 * 1. 优先显示今日任务（按优先级排序）
 * 2. 不足则用过期任务补足（按优先级排序）
 * 3. 最多显示 3 个
 */
export function getTodayFocusTasks(tasks: Task[], limit = 3): Task[] {
  // 今日任务，按优先级排序
  const todayTasks = tasks
    .filter((t) => isToday(t.dueDate))
    .sort((a, b) => b.priority - a.priority)

  if (todayTasks.length >= limit) {
    return todayTasks.slice(0, limit)
  }

  // 不足则用过期任务补足
  const overdueTasks = tasks
    .filter((t) => isOverdue(t.dueDate))
    .sort((a, b) => b.priority - a.priority)

  const combined = [...todayTasks, ...overdueTasks]
  return combined.slice(0, limit)
}

export function getInboxTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.projectId.startsWith('inbox'))
}

export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => isOverdue(t.dueDate))
}

export function getTomorrowTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => isTomorrow(t.dueDate))
}

export function getWeekTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => isThisWeek(t.dueDate))
}

// ============ 统计 ============

export interface TaskCounts {
  inbox: number
  today: number
  tomorrow: number
  week: number
  overdue: number
}

export function getTaskCounts(tasks: Task[]): TaskCounts {
  return {
    inbox: getInboxTasks(tasks).length,
    today: getTodayTasks(tasks).length,
    tomorrow: getTomorrowTasks(tasks).length,
    week: getWeekTasks(tasks).length,
    overdue: getOverdueTasks(tasks).length,
  }
}
