/**
 * 任务视图计算函数
 * 核心：computeTaskViews 单次遍历计算所有派生数据
 */
import type { Task } from '@/types'
import type { TaskCounts, ComputedViews } from './types'
import {
  extractDateStr,
  getTodayStr,
  getTomorrowStr,
  getNextWeekStr,
} from '../date'

/**
 * 单次遍历计算所有任务视图数据
 * 替代之前的多次 filter 调用
 */
export function computeTaskViews(tasks: Task[]): ComputedViews {
  const todayStr = getTodayStr()
  const tomorrowStr = getTomorrowStr()
  const nextWeekStr = getNextWeekStr()

  const result: ComputedViews = {
    counts: { inbox: 0, today: 0, tomorrow: 0, week: 0, overdue: 0 },
    projectCounts: new Map(),
    byDate: {
      pinned: [],
      overdue: [],
      today: [],
      tomorrow: [],
      later: [],
      nodate: [],
    },
    inbox: [],
  }

  for (const task of tasks) {
    // 1. 项目计数（所有任务都算）
    const pid = task.projectId ?? ''
    result.projectCounts.set(pid, (result.projectCounts.get(pid) ?? 0) + 1)

    // 2. Inbox 任务（归属由 adapter 层统一标记，各服务用各自规则）
    if (task.isInbox) {
      result.inbox.push(task)
      result.counts.inbox++
    }

    // 3. 按日期分组
    const dateStr = task.dueDate ? extractDateStr(task.dueDate) : null

    // 置顶任务（sortOrder > 0）
    if (task.sortOrder > 0) {
      result.byDate.pinned.push(task)
      // 置顶任务也计入对应日期的 count
      if (dateStr === todayStr) {
        result.counts.today++
        result.counts.week++
      } else if (dateStr === tomorrowStr) {
        result.counts.tomorrow++
        result.counts.week++
      } else if (dateStr && dateStr < todayStr) {
        result.counts.overdue++
      } else if (dateStr && dateStr < nextWeekStr) {
        result.counts.week++
      }
    } else if (!dateStr) {
      // 无日期任务
      result.byDate.nodate.push(task)
    } else if (dateStr < todayStr) {
      // 过期任务
      result.byDate.overdue.push(task)
      result.counts.overdue++
    } else if (dateStr === todayStr) {
      // 今日任务
      result.byDate.today.push(task)
      result.counts.today++
      result.counts.week++
    } else if (dateStr === tomorrowStr) {
      // 明日任务
      result.byDate.tomorrow.push(task)
      result.counts.tomorrow++
      result.counts.week++
    } else if (dateStr < nextWeekStr) {
      // 本周稍后（不含今日明日）
      result.byDate.later.push(task)
      result.counts.week++
    } else {
      // 更远的未来
      result.byDate.later.push(task)
    }
  }

  // 按优先级排序各分组
  const byPriority = (a: Task, b: Task) => b.priority - a.priority
  const bySortOrder = (a: Task, b: Task) => b.sortOrder - a.sortOrder

  result.byDate.pinned.sort(bySortOrder)
  result.byDate.overdue.sort(byPriority)
  result.byDate.today.sort(byPriority)
  result.byDate.tomorrow.sort(byPriority)
  result.byDate.later.sort(byPriority)
  result.byDate.nodate.sort(byPriority)

  return result
}

/**
 * 获取今日专注任务（最多 limit 个）
 * 逻辑：今日任务 + 过期任务补足
 */
export function getFocusTasks(views: ComputedViews, limit = 3): Task[] {
  const { today, overdue, pinned } = views.byDate

  // 优先显示置顶的今日/过期任务
  const pinnedFocus = pinned.filter((t) => {
    if (!t.dueDate) return false
    const dateStr = extractDateStr(t.dueDate)
    const todayStr = getTodayStr()
    return dateStr <= todayStr
  })

  const combined = [...pinnedFocus, ...today, ...overdue]
  return combined.slice(0, limit)
}

// ============ 兼容性函数（供旧代码过渡使用）============

/** @deprecated 使用 computeTaskViews 替代 */
export function getTaskCounts(tasks: Task[]): TaskCounts {
  return computeTaskViews(tasks).counts
}
