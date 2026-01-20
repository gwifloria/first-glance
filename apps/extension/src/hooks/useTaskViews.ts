import { useMemo, useCallback, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  computeTaskViews,
  getFocusTasks,
  filterTasks,
  sortTasks,
  type SortOption,
  type GroupOption,
  type TaskGroup,
  type TaskCounts,
  type ComputedViews,
} from '@/utils/taskFilters'
import type { Task } from '@/types'

export type { SortOption, GroupOption, TaskGroup, TaskCounts, ComputedViews }

export interface TaskViews {
  /** 今日任务 */
  todayTasks: Task[]
  /** 今日专注任务（最多3个） */
  todayFocusTasks: Task[]
  /** 收集箱任务 */
  inboxTasks: Task[]
  /** 过期任务 */
  overdueTasks: Task[]
  /** 明日任务 */
  tomorrowTasks: Task[]
  /** 本周任务 */
  weekTasks: Task[]
  /** 各筛选器的任务数量 */
  counts: TaskCounts
  /** 每个项目的任务数量 */
  projectCounts: Map<string, number>
}

export interface TaskFilters {
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  groupBy: GroupOption
  setGroupBy: (group: GroupOption) => void
  /** 获取指定筛选器的任务列表 */
  getFilteredTasks: (filter: string, searchQuery?: string) => Task[]
  /** 获取指定筛选器的分组任务（用于 TaskList 显示） */
  getTaskGroups: (filter: string, searchQuery?: string) => TaskGroup[]
}

/**
 * 任务视图计算 Hook
 * 核心：单次遍历计算所有派生数据
 */
export function useTaskViews(tasks: Task[]) {
  const { t } = useTranslation('task')
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [groupBy, setGroupBy] = useState<GroupOption>('none')

  // 分组结果缓存
  const groupCacheRef = useRef<{
    key: string
    tasksHash: number
    result: TaskGroup[]
  } | null>(null)

  // ============ 核心计算（单次遍历）============
  const computed = useMemo(() => computeTaskViews(tasks), [tasks])

  // 任务列表的简单哈希值（用于缓存失效判断）
  const tasksHash = useMemo(
    () => tasks.reduce((acc, t) => acc + t.id.charCodeAt(0), tasks.length),
    [tasks]
  )

  // ============ 派生视图 ============
  const todayFocusTasks = useMemo(() => getFocusTasks(computed, 3), [computed])

  // 本周任务（合并 today + tomorrow + later 中本周的）
  const weekTasks = useMemo(
    () => [
      ...computed.byDate.today,
      ...computed.byDate.tomorrow,
      ...computed.byDate.later,
    ],
    [computed]
  )

  // ============ 筛选函数 ============
  const getFilteredTasks = useCallback(
    (filter: string, searchQuery?: string) => {
      const filtered = filterTasks(tasks, filter, searchQuery)
      return sortTasks(filtered, sortBy)
    },
    [tasks, sortBy]
  )

  // ============ 分组函数（基于 computed.byDate，带缓存）============
  const getTaskGroups = useCallback(
    (filter: string, searchQuery?: string): TaskGroup[] => {
      // 检查缓存
      const cacheKey = `${filter}-${searchQuery || ''}`
      const cache = groupCacheRef.current
      if (cache && cache.key === cacheKey && cache.tasksHash === tasksHash) {
        return cache.result
      }

      // 先筛选
      const filtered = filterTasks(tasks, filter, searchQuery)

      // 基于筛选结果重新分组（复用 computed 的日期字符串缓存）
      const categorized = {
        pinned: [] as Task[],
        overdue: [] as Task[],
        today: [] as Task[],
        tomorrow: [] as Task[],
        later: [] as Task[],
        nodate: [] as Task[],
      }

      // 创建快速查找集合
      const filteredSet = new Set(filtered.map((t) => t.id))

      // 从 computed.byDate 中筛选
      for (const task of computed.byDate.pinned) {
        if (filteredSet.has(task.id)) categorized.pinned.push(task)
      }
      for (const task of computed.byDate.overdue) {
        if (filteredSet.has(task.id)) categorized.overdue.push(task)
      }
      for (const task of computed.byDate.today) {
        if (filteredSet.has(task.id)) categorized.today.push(task)
      }
      for (const task of computed.byDate.tomorrow) {
        if (filteredSet.has(task.id)) categorized.tomorrow.push(task)
      }
      for (const task of computed.byDate.later) {
        if (filteredSet.has(task.id)) categorized.later.push(task)
      }
      for (const task of computed.byDate.nodate) {
        if (filteredSet.has(task.id)) categorized.nodate.push(task)
      }

      // 分组配置
      const groupConfigs: { id: keyof typeof categorized; titleKey: string }[] =
        [
          { id: 'pinned', titleKey: 'group.pinned' },
          { id: 'overdue', titleKey: 'group.overdue' },
          { id: 'today', titleKey: 'group.today' },
          { id: 'tomorrow', titleKey: 'group.tomorrow' },
          { id: 'later', titleKey: 'group.later' },
          { id: 'nodate', titleKey: 'group.noDate' },
        ]

      // 构建结果（已排序，因为 computed.byDate 中已排序）
      const result = groupConfigs
        .filter((cfg) => categorized[cfg.id].length > 0)
        .map((cfg) => ({
          id: cfg.id,
          title: t(cfg.titleKey),
          tasks: categorized[cfg.id],
        }))

      // 更新缓存
      groupCacheRef.current = { key: cacheKey, tasksHash, result }

      return result
    },
    [tasks, computed, tasksHash, t]
  )

  // ============ 结构化返回 ============
  const views: TaskViews = {
    todayTasks: computed.byDate.today,
    todayFocusTasks,
    inboxTasks: computed.inbox,
    overdueTasks: computed.byDate.overdue,
    tomorrowTasks: computed.byDate.tomorrow,
    weekTasks,
    counts: computed.counts,
    projectCounts: computed.projectCounts,
  }

  const filters: TaskFilters = {
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
    getFilteredTasks,
    getTaskGroups,
  }

  return { views, filters }
}
