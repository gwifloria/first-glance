import { useMemo, useCallback, useState } from 'react'
import {
  filterTasks,
  sortTasks,
  groupTasks,
  getTodayTasks,
  getTodayFocusTasks,
  getInboxTasks,
  getOverdueTasks,
  getTomorrowTasks,
  getWeekTasks,
  getTaskCounts,
  type SortOption,
  type GroupOption,
  type TaskGroup,
  type TaskCounts,
} from '@/utils/taskFilters'
import type { Task, Project } from '@/types'

export type { SortOption, GroupOption, TaskGroup, TaskCounts }

/**
 * 任务视图计算 Hook
 * 负责：计算派生视图、筛选、分组、排序
 */
export function useTaskViews(tasks: Task[], projects: Project[]) {
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [groupBy, setGroupBy] = useState<GroupOption>('none')

  // ============ 计算视图 ============

  const todayTasks = useMemo(() => getTodayTasks(tasks), [tasks])
  const todayFocusTasks = useMemo(() => getTodayFocusTasks(tasks), [tasks])
  const inboxTasks = useMemo(() => getInboxTasks(tasks), [tasks])
  const overdueTasks = useMemo(() => getOverdueTasks(tasks), [tasks])
  const tomorrowTasks = useMemo(() => getTomorrowTasks(tasks), [tasks])
  const weekTasks = useMemo(() => getWeekTasks(tasks), [tasks])
  const counts = useMemo(() => getTaskCounts(tasks), [tasks])

  // ============ 筛选和分组 ============

  const getFilteredTasks = useCallback(
    (filter: string, searchQuery?: string) => {
      const filtered = filterTasks(tasks, filter, searchQuery)
      return sortTasks(filtered, sortBy)
    },
    [tasks, sortBy]
  )

  const getGroupedTasks = useCallback(
    (filter: string, searchQuery?: string): TaskGroup[] => {
      const filtered = filterTasks(tasks, filter, searchQuery)
      const sorted = sortTasks(filtered, sortBy)
      return groupTasks(sorted, groupBy, projects)
    },
    [tasks, sortBy, groupBy, projects]
  )

  return {
    // 计算视图
    todayTasks,
    todayFocusTasks,
    inboxTasks,
    overdueTasks,
    tomorrowTasks,
    weekTasks,
    counts,

    // 筛选和分组
    getFilteredTasks,
    getGroupedTasks,
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
  }
}
