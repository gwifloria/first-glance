import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRelativeDates } from './useRelativeDates'
import { filterTasks, type TaskGroup } from '@/utils/taskFilters'
import { extractDateStr } from '@/utils/date'
import type { Task } from '@/types'

interface UseTaskGroupsOptions {
  tasks: Task[]
  filter: string
  searchQuery?: string
}

export function useTaskGroups({
  tasks,
  filter,
  searchQuery,
}: UseTaskGroupsOptions): TaskGroup[] {
  const { t } = useTranslation('task')
  const { todayStr, tomorrowStr } = useRelativeDates()

  // 过滤任务
  const filteredTasks = useMemo(
    () => filterTasks(tasks, filter, searchQuery),
    [tasks, filter, searchQuery]
  )

  // 按日期分组并排序（单次遍历分类）
  const groups = useMemo<TaskGroup[]>(() => {
    // 预分类容器
    const categorized = {
      pinned: [] as Task[],
      overdue: [] as Task[],
      today: [] as Task[],
      tomorrow: [] as Task[],
      later: [] as Task[],
      nodate: [] as Task[],
    }

    // 单次遍历分类
    for (const task of filteredTasks) {
      if (task.sortOrder > 0) {
        categorized.pinned.push(task)
      } else if (!task.dueDate) {
        categorized.nodate.push(task)
      } else {
        const dateStr = extractDateStr(task.dueDate)
        if (dateStr < todayStr) {
          categorized.overdue.push(task)
        } else if (dateStr === todayStr) {
          categorized.today.push(task)
        } else if (dateStr === tomorrowStr) {
          categorized.tomorrow.push(task)
        } else {
          categorized.later.push(task)
        }
      }
    }

    // 构建结果（保持原有顺序）
    const result: TaskGroup[] = []

    if (categorized.pinned.length > 0) {
      result.push({
        id: 'pinned',
        title: t('group.pinned'),
        tasks: categorized.pinned.sort((a, b) => b.sortOrder - a.sortOrder),
      })
    }
    if (categorized.overdue.length > 0) {
      result.push({
        id: 'overdue',
        title: t('group.overdue'),
        tasks: categorized.overdue.sort((a, b) => b.priority - a.priority),
      })
    }
    if (categorized.today.length > 0) {
      result.push({
        id: 'today',
        title: t('group.today'),
        tasks: categorized.today.sort((a, b) => b.priority - a.priority),
      })
    }
    if (categorized.tomorrow.length > 0) {
      result.push({
        id: 'tomorrow',
        title: t('group.tomorrow'),
        tasks: categorized.tomorrow.sort((a, b) => b.priority - a.priority),
      })
    }
    if (categorized.later.length > 0) {
      result.push({
        id: 'later',
        title: t('group.later'),
        tasks: categorized.later.sort((a, b) => b.priority - a.priority),
      })
    }
    if (categorized.nodate.length > 0) {
      result.push({
        id: 'nodate',
        title: t('group.noDate'),
        tasks: categorized.nodate.sort((a, b) => b.priority - a.priority),
      })
    }

    return result
  }, [filteredTasks, todayStr, tomorrowStr, t])

  return groups
}
