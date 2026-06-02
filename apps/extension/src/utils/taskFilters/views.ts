/**
 * 任务视图计算函数
 * 核心：computeTaskViews 单次遍历计算所有派生数据
 */
import type { Task } from '@/types'
import type { ComputedViews } from './types'
import {
  extractDateStr,
  getTodayStr,
  getTomorrowStr,
  getNextWeekStr,
} from '../date'

/** 单个任务按 dueDate 落入的日期类别（与 byDate 桶/各 count 一一对应） */
type DateLabel = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'nodate'

/**
 * 把 dueDate 的日期串归一为单一类别。入桶与计数都从这个类别派生，
 * 避免 pinned / 非 pinned 两条分支各写一份日期阶梯而漂移。
 */
function classifyDueDate(
  dateStr: string | null,
  todayStr: string,
  tomorrowStr: string,
  nextWeekStr: string
): DateLabel {
  if (!dateStr) return 'nodate'
  if (dateStr < todayStr) return 'overdue'
  if (dateStr === todayStr) return 'today'
  if (dateStr === tomorrowStr) return 'tomorrow'
  if (dateStr < nextWeekStr) return 'week'
  return 'later'
}

/** 按日期类别累加各 count（pinned 与非 pinned 共用同一规则） */
function bumpDateCounts(
  counts: ComputedViews['counts'],
  label: DateLabel
): void {
  switch (label) {
    case 'overdue':
      counts.overdue++
      break
    case 'today':
      counts.today++
      counts.week++
      break
    case 'tomorrow':
      counts.tomorrow++
      counts.week++
      break
    case 'week':
      counts.week++
      break
    // later / nodate 不计入任何日期 count
  }
}

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

    // 3. 按日期分组：先归一为单一类别，计数对 pinned/非 pinned 一视同仁，
    //    仅「落哪个桶」不同（置顶任务统一进 pinned 桶）。
    const dateStr = task.dueDate ? extractDateStr(task.dueDate) : null
    const label = classifyDueDate(dateStr, todayStr, tomorrowStr, nextWeekStr)
    bumpDateCounts(result.counts, label)

    if (task.sortOrder > 0) {
      result.byDate.pinned.push(task)
    } else {
      // 'week' 类别没有独立桶，并入 later；其余类别名即桶名
      const bucket = label === 'week' ? 'later' : label
      result.byDate[bucket].push(task)
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
