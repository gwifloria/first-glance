/**
 * 任务分组函数
 */
import type { Task, Project } from '@/types'
import type { GroupOption, TaskGroup } from './types'
import {
  extractDateStr,
  formatDateStr,
  getTodayStr,
  getTomorrowStr,
  getNextWeekStr,
} from '../date'

/**
 * 通用分组入口。注意：`groupBy==='date'` 在生产中并不走这里——
 * useTaskViews.getTaskGroups 对日期分组改用 buildDateGroups（复用 computed.byDate
 * 的置顶/已排序/缓存）。这里的 groupByDate 仅供单元测试与非 date 分组路径复用。
 */
export function groupTasks(
  tasks: Task[],
  groupBy: GroupOption,
  projects: Project[]
): TaskGroup[] {
  switch (groupBy) {
    case 'date':
      return groupByDate(tasks)
    case 'deadline':
      return groupByDeadline(tasks)
    case 'dateAdded':
      return groupByDateAdded(tasks)
    case 'priority':
      return groupByPriority(tasks)
    case 'project':
      return groupByProject(tasks, projects)
    case 'label':
      return groupByLabel(tasks)
    case 'none':
    default:
      return [{ id: 'all', title: '所有任务', tasks }]
  }
}

/**
 * 按未来向日期字段分桶（已过期/今天/明天/最近7天/更晚/无）。
 * dueDate 与 deadline 共用此逻辑，仅取值字段与「无」桶标识不同。
 */
function bucketByFutureDate(
  tasks: Task[],
  getDate: (t: Task) => string | undefined,
  noneId: string,
  noneTitle: string
): TaskGroup[] {
  const todayStr = getTodayStr()
  const tomorrowStr = getTomorrowStr()
  const nextWeekStr = getNextWeekStr()

  const overdue: Task[] = []
  const today: Task[] = []
  const tomorrow: Task[] = []
  const week: Task[] = []
  const later: Task[] = []
  const none: Task[] = []

  for (const task of tasks) {
    const raw = getDate(task)
    if (!raw) {
      none.push(task)
      continue
    }
    const dateStr = extractDateStr(raw)
    if (dateStr < todayStr) overdue.push(task)
    else if (dateStr === todayStr) today.push(task)
    else if (dateStr === tomorrowStr) tomorrow.push(task)
    else if (dateStr < nextWeekStr) week.push(task)
    else later.push(task)
  }

  return [
    { id: 'overdue', title: '已过期', tasks: overdue },
    { id: 'today', title: '今天', tasks: today },
    { id: 'tomorrow', title: '明天', tasks: tomorrow },
    { id: 'week', title: '最近7天', tasks: week },
    { id: 'later', title: '更晚', tasks: later },
    { id: noneId, title: noneTitle, tasks: none },
  ].filter((g) => g.tasks.length > 0)
}

function groupByDate(tasks: Task[]): TaskGroup[] {
  return bucketByFutureDate(tasks, (t) => t.dueDate, 'nodate', '无日期')
}

function groupByDeadline(tasks: Task[]): TaskGroup[] {
  return bucketByFutureDate(tasks, (t) => t.deadline, 'nodeadline', '无截止日')
}

/** 按创建时间分桶（过去向：今天添加 / 本周添加 / 更早 / 无） */
function groupByDateAdded(tasks: Task[]): TaskGroup[] {
  const todayStr = getTodayStr()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = formatDateStr(weekAgo)

  const today: Task[] = []
  const week: Task[] = []
  const earlier: Task[] = []
  const none: Task[] = []

  for (const task of tasks) {
    if (!task.createdTime) {
      none.push(task)
      continue
    }
    const dateStr = extractDateStr(task.createdTime)
    if (dateStr >= todayStr) today.push(task)
    else if (dateStr >= weekAgoStr) week.push(task)
    else earlier.push(task)
  }

  return [
    { id: 'today', title: '今天添加', tasks: today },
    { id: 'addedWeek', title: '本周添加', tasks: week },
    { id: 'addedEarlier', title: '更早', tasks: earlier },
    { id: 'nodate', title: '无日期', tasks: none },
  ].filter((g) => g.tasks.length > 0)
}

/** 按标签分组：多标签任务会出现在多个组；无标签归「无标签」。组标题即标签名 */
function groupByLabel(tasks: Task[]): TaskGroup[] {
  const byTag = new Map<string, Task[]>()
  const noLabel: Task[] = []

  for (const task of tasks) {
    const tags = task.tags ?? []
    if (tags.length === 0) {
      noLabel.push(task)
      continue
    }
    for (const tag of tags) {
      const list = byTag.get(tag) ?? []
      list.push(task)
      byTag.set(tag, list)
    }
  }

  const result: TaskGroup[] = [...byTag.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tag, tasks]) => ({ id: tag, title: tag, tasks }))

  if (noLabel.length > 0) {
    result.push({ id: 'nolabel', title: '无标签', tasks: noLabel })
  }

  return result
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
