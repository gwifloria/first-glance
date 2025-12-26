import { useMemo } from 'react'
import { extractDateStr } from '@/utils/date'
import { useRelativeDates } from './useRelativeDates'
import type { Task } from '@/types'

/**
 * 任务过滤 Hook
 * 根据 filter 和 searchQuery 过滤任务
 */
export function useFilteredTasks(
  tasks: Task[],
  filter: string,
  searchQuery?: string
): Task[] {
  const { todayStr, tomorrowStr, nextWeekStr } = useRelativeDates()

  // 根据 filter 过滤
  const filteredTasks = useMemo(() => {
    if (filter.startsWith('project:')) {
      const projectId = filter.replace('project:', '')
      return tasks.filter((t) => t.projectId === projectId)
    }

    switch (filter) {
      case 'inbox':
        return tasks.filter((t) => t.projectId.startsWith('inbox'))
      case 'today':
        return tasks.filter((t) => {
          if (!t.dueDate) return false
          const taskDateStr = extractDateStr(t.dueDate)
          return taskDateStr === todayStr
        })
      case 'tomorrow':
        return tasks.filter((t) => {
          if (!t.dueDate) return false
          const taskDateStr = extractDateStr(t.dueDate)
          return taskDateStr === tomorrowStr
        })
      case 'week':
        return tasks.filter((t) => {
          if (!t.dueDate) return false
          const taskDateStr = extractDateStr(t.dueDate)
          return taskDateStr >= todayStr && taskDateStr < nextWeekStr
        })
      case 'overdue':
        return tasks.filter((t) => {
          if (!t.dueDate) return false
          const taskDateStr = extractDateStr(t.dueDate)
          return taskDateStr < todayStr
        })
      case 'nodate':
        return tasks.filter((t) => !t.dueDate)
      default:
        return tasks
    }
  }, [tasks, filter, todayStr, tomorrowStr, nextWeekStr])

  // 搜索过滤
  const searchedTasks = useMemo(() => {
    if (!searchQuery?.trim()) {
      return filteredTasks
    }
    const query = searchQuery.toLowerCase()
    return filteredTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.content?.toLowerCase().includes(query)
    )
  }, [filteredTasks, searchQuery])

  return searchedTasks
}
