import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { filterTasks } from './filter'
import { makeTask } from '@/test/factories'

describe('filterTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-27T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const tasks = [
    makeTask({
      id: '1',
      dueDate: '2026-02-27',
      projectId: 'inbox-1',
      isInbox: true,
      title: '今天',
    }),
    makeTask({
      id: '2',
      dueDate: '2026-02-28',
      projectId: 'proj-1',
      title: '明天',
    }),
    makeTask({
      id: '3',
      dueDate: '2026-02-25',
      projectId: 'proj-2',
      title: '过期',
    }),
    makeTask({ id: '4', projectId: 'proj-1', title: '无日期' }),
    makeTask({
      id: '5',
      dueDate: '2026-03-02',
      projectId: 'proj-1',
      title: '本周',
    }),
    makeTask({
      id: '6',
      dueDate: '2026-04-01',
      projectId: 'proj-2',
      title: '以后',
      content: '详细内容',
    }),
  ]

  it('today 返回今天到期 + 已过期的任务', () => {
    const result = filterTasks(tasks, 'today')
    // 1=今天, 3=过期，都纳入 Today 视图
    expect(result.map((t) => t.id).sort()).toEqual(['1', '3'])
  })

  it('tomorrow 只返回明天的任务', () => {
    const result = filterTasks(tasks, 'tomorrow')
    expect(result.map((t) => t.id)).toEqual(['2'])
  })

  it('overdue 只返回过期任务', () => {
    const result = filterTasks(tasks, 'overdue')
    expect(result.map((t) => t.id)).toEqual(['3'])
  })

  it('nodate 只返回无日期的任务', () => {
    const result = filterTasks(tasks, 'nodate')
    expect(result.map((t) => t.id)).toEqual(['4'])
  })

  it('week 返回本周内的任务', () => {
    const result = filterTasks(tasks, 'week')
    // 今天(27) + 明天(28) + 3月2日 都在 [2/27, 3/6) 范围内
    expect(result.map((t) => t.id)).toEqual(['1', '2', '5'])
  })

  it('inbox 按 task.isInbox 标记筛选', () => {
    const result = filterTasks(tasks, 'inbox')
    expect(result.map((t) => t.id)).toEqual(['1'])
  })

  it('project:xxx 按 projectId 匹配', () => {
    const result = filterTasks(tasks, 'project:proj-1')
    expect(result.map((t) => t.id)).toEqual(['2', '4', '5'])
  })

  it('搜索关键字不区分大小写，匹配 title', () => {
    const result = filterTasks(tasks, 'today', '今天')
    expect(result.map((t) => t.id)).toEqual(['1'])
  })

  it('搜索关键字匹配 content', () => {
    const allTasks = filterTasks(tasks, 'project:proj-2')
    const result = filterTasks(allTasks, 'project:proj-2', '详细')
    expect(result.map((t) => t.id)).toEqual(['6'])
  })

  it('空搜索不过滤', () => {
    const result = filterTasks(tasks, 'today', '')
    expect(result.map((t) => t.id).sort()).toEqual(['1', '3'])
  })

  it('空格搜索不过滤', () => {
    const result = filterTasks(tasks, 'today', '   ')
    expect(result.map((t) => t.id).sort()).toEqual(['1', '3'])
  })
})
