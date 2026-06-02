import { useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  computeTaskViews,
  getFocusTasks,
  filterTasks,
  sortTasks,
  groupTasks,
  type SortOption,
  type GroupOption,
  type TaskGroup,
  type TaskCounts,
  type ComputedViews,
} from '@/utils/taskFilters'
import { usePersistedState } from './usePersistedState'
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
  /** 获取指定筛选器的分组任务（用于 TaskList 显示） */
  getTaskGroups: (filter: string, searchQuery?: string) => TaskGroup[]
}

/**
 * 日期分组：复用 computed.byDate（含置顶组、已按优先级预排序）与筛选结果求交。
 * 默认 sortBy='priority' 时直接沿用预排序；选其它 sortBy 时对各桶重排（pinned 保持置顶序）。
 */
function buildDateGroups(
  computed: ComputedViews,
  filtered: Task[],
  sortBy: SortOption,
  t: (key: string) => string
): TaskGroup[] {
  const filteredSet = new Set(filtered.map((task) => task.id))
  const pick = (bucket: Task[]) =>
    bucket.filter((task) => filteredSet.has(task.id))

  const configs = [
    {
      id: 'pinned',
      titleKey: 'group.pinned',
      tasks: pick(computed.byDate.pinned),
    },
    {
      id: 'overdue',
      titleKey: 'group.overdue',
      tasks: pick(computed.byDate.overdue),
    },
    {
      id: 'today',
      titleKey: 'group.today',
      tasks: pick(computed.byDate.today),
    },
    {
      id: 'tomorrow',
      titleKey: 'group.tomorrow',
      tasks: pick(computed.byDate.tomorrow),
    },
    {
      id: 'later',
      titleKey: 'group.later',
      tasks: pick(computed.byDate.later),
    },
    {
      id: 'nodate',
      titleKey: 'group.noDate',
      tasks: pick(computed.byDate.nodate),
    },
  ]

  return configs
    .filter((cfg) => cfg.tasks.length > 0)
    .map((cfg) => ({
      id: cfg.id,
      title: t(cfg.titleKey),
      tasks:
        sortBy === 'priority' || cfg.id === 'pinned'
          ? cfg.tasks
          : sortTasks(cfg.tasks, sortBy),
    }))
}

/**
 * 上下文子任务补全（Todoist 风格）：
 * 日期视图（today/week/overdue…）按 dueDate 一视同仁地筛任务，子任务若自身无日期
 * 会在分组前被剔除，导致命中的父任务「光杆」展示。这里在分组之后，把已入选父任务
 * 那些尚未展示的子孙任务补进父任务所在的组——TaskDateGroup 的同组嵌套逻辑会自动把
 * 它们挂到父任务下作上下文。已自行命中筛选（在自己日期桶里）的子任务不重复补入。
 */
function attachContextSubtasks(
  groups: TaskGroup[],
  allTasks: Task[]
): TaskGroup[] {
  // parentId → 直接子任务
  const childrenByParent = new Map<string, Task[]>()
  for (const task of allTasks) {
    if (!task.parentId) continue
    const siblings = childrenByParent.get(task.parentId)
    if (siblings) siblings.push(task)
    else childrenByParent.set(task.parentId, [task])
  }
  if (childrenByParent.size === 0) return groups

  // 已展示的任务 id（跨所有组），用于去重，避免同一子任务被补进多个组
  const includedIds = new Set<string>()
  for (const group of groups) {
    for (const task of group.tasks) includedIds.add(task.id)
  }

  return groups.map((group) => {
    const extras: Task[] = []
    // BFS：从组内每个任务出发，补全尚未展示的子孙
    const queue = group.tasks.map((task) => task.id)
    while (queue.length > 0) {
      const id = queue.shift() as string
      const children = childrenByParent.get(id)
      if (!children) continue
      for (const child of children) {
        if (includedIds.has(child.id)) continue
        includedIds.add(child.id)
        extras.push(child)
        queue.push(child.id)
      }
    }
    return extras.length > 0
      ? { ...group, tasks: [...group.tasks, ...extras] }
      : group
  })
}

/**
 * 任务视图计算 Hook
 * 核心：单次遍历计算所有派生数据
 */
export function useTaskViews(tasks: Task[]) {
  const { t } = useTranslation('task')
  // 持久化排序/分组偏好。默认 priority + date 保持现有「按日期分组、组内按优先级」观感
  const [sortBy, setSortBy] = usePersistedState<SortOption>(
    'list_sort_by',
    'priority'
  )
  const [groupBy, setGroupBy] = usePersistedState<GroupOption>(
    'list_group_by',
    'date'
  )

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

  // ============ 分组函数（带缓存，缓存键含 groupBy/sortBy）============
  const getTaskGroups = useCallback(
    (filter: string, searchQuery?: string): TaskGroup[] => {
      // 检查缓存
      const cacheKey = `${filter}-${searchQuery || ''}-${groupBy}-${sortBy}`
      const cache = groupCacheRef.current
      if (cache && cache.key === cacheKey && cache.tasksHash === tasksHash) {
        return cache.result
      }

      const filtered = filterTasks(tasks, filter, searchQuery)

      let result: TaskGroup[]
      if (groupBy === 'date') {
        // 日期分组：复用 computed.byDate（含置顶/已排序），仅在非默认 sortBy 时重排各桶
        result = buildDateGroups(computed, filtered, sortBy, t)
      } else {
        // 其它分组：先按 sortBy 排序，再分组（标题由 TaskDateGroup 按 id 翻译/直接显示）
        const sorted = sortTasks(filtered, sortBy)
        result = groupTasks(sorted, groupBy, [])
      }

      // 搜索时保持严格匹配；否则把命中父任务被筛掉的子任务带出来作上下文
      if (!searchQuery?.trim()) {
        result = attachContextSubtasks(result, tasks)
      }

      groupCacheRef.current = { key: cacheKey, tasksHash, result }
      return result
    },
    [tasks, computed, tasksHash, t, groupBy, sortBy]
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
    getTaskGroups,
  }

  return { views, filters }
}
