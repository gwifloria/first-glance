import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { computeTaskViews, getFocusTasks } from './views'
import { makeTask } from '@/test/factories'

describe('views', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-27T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('computeTaskViews', () => {
    it('计数正确', () => {
      const tasks = [
        makeTask({
          id: '1',
          dueDate: '2026-02-27',
          projectId: 'inbox-1',
          isInbox: true,
        }), // today + inbox + week
        makeTask({ id: '2', dueDate: '2026-02-28', projectId: 'proj-1' }), // tomorrow + week
        makeTask({ id: '3', dueDate: '2026-02-25', projectId: 'proj-1' }), // overdue
        makeTask({ id: '4', dueDate: '2026-03-02', projectId: 'proj-2' }), // week (not today/tomorrow)
        makeTask({ id: '5', projectId: 'inbox-1', isInbox: true }), // inbox + nodate
      ]

      const views = computeTaskViews(tasks)

      expect(views.counts.today).toBe(1)
      expect(views.counts.tomorrow).toBe(1)
      expect(views.counts.overdue).toBe(1)
      expect(views.counts.inbox).toBe(2)
      expect(views.counts.week).toBe(3) // today + tomorrow + 3月2日
    })

    it('projectCounts Map 正确', () => {
      const tasks = [
        makeTask({ id: '1', projectId: 'proj-a' }),
        makeTask({ id: '2', projectId: 'proj-a' }),
        makeTask({ id: '3', projectId: 'proj-b' }),
      ]

      const views = computeTaskViews(tasks)

      expect(views.projectCounts.get('proj-a')).toBe(2)
      expect(views.projectCounts.get('proj-b')).toBe(1)
    })

    it('pinned 任务出现在 pinned 列表', () => {
      const tasks = [
        makeTask({ id: '1', isPinned: true, dueDate: '2026-02-27' }),
        makeTask({ id: '2', isPinned: false, dueDate: '2026-02-27' }),
      ]

      const views = computeTaskViews(tasks)

      expect(views.byDate.pinned.map((t) => t.id)).toEqual(['1'])
      expect(views.byDate.today.map((t) => t.id)).toEqual(['2'])
    })

    it('pinned 任务也计入日期分组的 count', () => {
      const tasks = [
        makeTask({ id: '1', isPinned: true, dueDate: '2026-02-27' }), // pinned today
      ]

      const views = computeTaskViews(tasks)

      expect(views.counts.today).toBe(1)
      expect(views.counts.week).toBe(1)
      expect(views.byDate.pinned).toHaveLength(1)
    })

    it('pinned 过期任务计入 overdue count', () => {
      const tasks = [
        makeTask({ id: '1', isPinned: true, dueDate: '2026-02-25' }),
      ]

      const views = computeTaskViews(tasks)

      expect(views.counts.overdue).toBe(1)
      expect(views.byDate.pinned).toHaveLength(1)
    })

    it('byDate 各组按优先级排序', () => {
      const tasks = [
        makeTask({ id: '1', dueDate: '2026-02-27', priority: 1 }),
        makeTask({ id: '2', dueDate: '2026-02-27', priority: 5 }),
        makeTask({ id: '3', dueDate: '2026-02-27', priority: 3 }),
      ]

      const views = computeTaskViews(tasks)

      expect(views.byDate.today.map((t) => t.id)).toEqual(['2', '3', '1'])
    })

    it('pinned 组按 sortOrder 排序', () => {
      const tasks = [
        makeTask({
          id: '1',
          isPinned: true,
          sortOrder: 5,
          dueDate: '2026-02-27',
        }),
        makeTask({
          id: '2',
          isPinned: true,
          sortOrder: 20,
          dueDate: '2026-02-27',
        }),
        makeTask({
          id: '3',
          isPinned: true,
          sortOrder: 10,
          dueDate: '2026-02-27',
        }),
      ]

      const views = computeTaskViews(tasks)

      expect(views.byDate.pinned.map((t) => t.id)).toEqual(['2', '3', '1'])
    })

    it('空任务列表', () => {
      const views = computeTaskViews([])

      expect(views.counts).toEqual({
        inbox: 0,
        today: 0,
        tomorrow: 0,
        week: 0,
        overdue: 0,
      })
      expect(views.byDate.pinned).toHaveLength(0)
      expect(views.inbox).toHaveLength(0)
    })
  })

  describe('getFocusTasks', () => {
    it('默认限制 3 个', () => {
      const tasks = [
        makeTask({ id: '1', dueDate: '2026-02-27' }),
        makeTask({ id: '2', dueDate: '2026-02-27' }),
        makeTask({ id: '3', dueDate: '2026-02-27' }),
        makeTask({ id: '4', dueDate: '2026-02-27' }),
      ]
      const views = computeTaskViews(tasks)
      const focus = getFocusTasks(views)

      expect(focus).toHaveLength(3)
    })

    it('自定义限制数量', () => {
      const tasks = [
        makeTask({ id: '1', dueDate: '2026-02-27' }),
        makeTask({ id: '2', dueDate: '2026-02-27' }),
      ]
      const views = computeTaskViews(tasks)

      expect(getFocusTasks(views, 1)).toHaveLength(1)
      expect(getFocusTasks(views, 5)).toHaveLength(2)
    })

    it('pinnedFocus 优先显示', () => {
      const tasks = [
        makeTask({ id: 'pinned', isPinned: true, dueDate: '2026-02-27' }),
        makeTask({
          id: 'normal',
          isPinned: false,
          dueDate: '2026-02-27',
          priority: 5,
        }),
      ]
      const views = computeTaskViews(tasks)
      const focus = getFocusTasks(views, 3)

      expect(focus[0].id).toBe('pinned')
    })

    it('today + overdue 混合', () => {
      const tasks = [
        makeTask({ id: 'today', dueDate: '2026-02-27' }),
        makeTask({ id: 'overdue', dueDate: '2026-02-25' }),
      ]
      const views = computeTaskViews(tasks)
      const focus = getFocusTasks(views, 3)

      expect(focus.map((t) => t.id)).toContain('today')
      expect(focus.map((t) => t.id)).toContain('overdue')
    })

    it('未来日期的 pinned 不出现', () => {
      const tasks = [
        makeTask({
          id: 'future-pinned',
          isPinned: true,
          dueDate: '2026-04-01',
        }),
        makeTask({ id: 'today', dueDate: '2026-02-27' }),
      ]
      const views = computeTaskViews(tasks)
      const focus = getFocusTasks(views, 3)

      expect(focus.map((t) => t.id)).not.toContain('future-pinned')
      expect(focus.map((t) => t.id)).toContain('today')
    })

    it('pinned 过期任务出现在 focus 中', () => {
      const tasks = [
        makeTask({
          id: 'pinned-overdue',
          isPinned: true,
          dueDate: '2026-02-25',
        }),
      ]
      const views = computeTaskViews(tasks)
      const focus = getFocusTasks(views, 3)

      expect(focus.map((t) => t.id)).toContain('pinned-overdue')
    })
  })
})
