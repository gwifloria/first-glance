/**
 * 任务分组函数
 */
import type { Task, Project } from '@/types'
import type { GroupOption, TaskGroup } from './types'
import {
  extractDateStr,
  getTodayStr,
  getTomorrowStr,
  getNextWeekStr,
} from '../date'

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
    if (task.projectId?.startsWith('inbox')) {
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
