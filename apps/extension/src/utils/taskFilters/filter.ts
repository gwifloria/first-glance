/**
 * 任务筛选函数
 */
import type { Task } from '@/types'
import { isToday, isTomorrow, isThisWeek, isOverdue } from './predicates'

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
        // inbox 归属由 adapter 层统一标记（各服务用各自规则），这里只读标记
        filtered = filtered.filter((t) => t.isInbox)
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
