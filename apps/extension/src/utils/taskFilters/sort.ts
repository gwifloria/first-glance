/**
 * 任务排序函数
 */
import type { Task } from '@/types'
import type { SortOption } from './types'

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
    case 'name':
      // 按标题字母/拼音序
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'deadline':
      // 早截止在前，无截止日在后
      sorted.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return a.deadline.localeCompare(b.deadline)
      })
      break
  }

  return sorted
}
