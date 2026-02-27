import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { groupTasks } from './group'
import { makeTask, makeProject } from '@/test/factories'

describe('groupTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-27T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const tasks = [
    makeTask({ id: '1', dueDate: '2026-02-27', priority: 5 }),
    makeTask({ id: '2', dueDate: '2026-02-28', priority: 3 }),
    makeTask({ id: '3', dueDate: '2026-02-25', priority: 1 }),
    makeTask({ id: '4', priority: 0 }),
    makeTask({ id: '5', dueDate: '2026-03-10', priority: 5 }),
  ]

  describe('none', () => {
    it('单组返回所有任务', () => {
      const groups = groupTasks(tasks, 'none', [])
      expect(groups).toHaveLength(1)
      expect(groups[0].id).toBe('all')
      expect(groups[0].tasks).toHaveLength(5)
    })
  })

  describe('date', () => {
    it('按日期分桶', () => {
      const groups = groupTasks(tasks, 'date', [])
      const ids = groups.map((g) => g.id)

      expect(ids).toContain('overdue')
      expect(ids).toContain('today')
      expect(ids).toContain('tomorrow')
      expect(ids).toContain('later')
      expect(ids).toContain('nodate')
    })

    it('各桶任务正确', () => {
      const groups = groupTasks(tasks, 'date', [])
      const byId = Object.fromEntries(groups.map((g) => [g.id, g.tasks]))

      expect(byId['overdue'].map((t) => t.id)).toEqual(['3'])
      expect(byId['today'].map((t) => t.id)).toEqual(['1'])
      expect(byId['tomorrow'].map((t) => t.id)).toEqual(['2'])
      expect(byId['later'].map((t) => t.id)).toEqual(['5'])
      expect(byId['nodate'].map((t) => t.id)).toEqual(['4'])
    })

    it('空组被过滤', () => {
      const todayOnly = [makeTask({ dueDate: '2026-02-27' })]
      const groups = groupTasks(todayOnly, 'date', [])
      expect(groups).toHaveLength(1)
      expect(groups[0].id).toBe('today')
    })
  })

  describe('priority', () => {
    it('按优先级分组', () => {
      const groups = groupTasks(tasks, 'priority', [])
      const byId = Object.fromEntries(groups.map((g) => [g.id, g.tasks]))

      // priority >= 5 → high
      expect(byId['high'].map((t) => t.id)).toEqual(['1', '5'])
      // priority 3-4 → medium
      expect(byId['medium'].map((t) => t.id)).toEqual(['2'])
      // priority 1-2 → low
      expect(byId['low'].map((t) => t.id)).toEqual(['3'])
      // priority 0 → none
      expect(byId['none'].map((t) => t.id)).toEqual(['4'])
    })

    it('空组被过滤', () => {
      const highOnly = [makeTask({ priority: 5 })]
      const groups = groupTasks(highOnly, 'priority', [])
      expect(groups).toHaveLength(1)
      expect(groups[0].id).toBe('high')
    })
  })

  describe('project', () => {
    it('按项目分组，inbox 在前', () => {
      const projectTasks = [
        makeTask({ id: '1', projectId: 'inbox-1' }),
        makeTask({ id: '2', projectId: 'proj-a' }),
        makeTask({ id: '3', projectId: 'proj-b' }),
      ]
      const projects = [
        makeProject({ id: 'proj-a', name: 'Project A', sortOrder: 1 }),
        makeProject({ id: 'proj-b', name: 'Project B', sortOrder: 2 }),
      ]

      const groups = groupTasks(projectTasks, 'project', projects)

      expect(groups[0].id).toBe('inbox')
      expect(groups[0].tasks.map((t) => t.id)).toEqual(['1'])
    })

    it('closed 项目不创建组', () => {
      const projectTasks = [makeTask({ id: '1', projectId: 'proj-closed' })]
      const projects = [
        makeProject({ id: 'proj-closed', name: 'Closed', closed: true }),
      ]

      const groups = groupTasks(projectTasks, 'project', projects)
      // closed 项目不会在 projectMap 中，任务被丢弃
      expect(groups).toHaveLength(0)
    })

    it('空组被过滤', () => {
      const projectTasks = [makeTask({ id: '1', projectId: 'proj-a' })]
      const projects = [
        makeProject({ id: 'proj-a', name: 'A' }),
        makeProject({ id: 'proj-b', name: 'B' }),
      ]

      const groups = groupTasks(projectTasks, 'project', projects)
      expect(groups).toHaveLength(1)
      expect(groups[0].title).toBe('A')
    })
  })
})
