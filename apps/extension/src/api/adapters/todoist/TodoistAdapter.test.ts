import { describe, it, expect } from 'vitest'
import {
  transformTaskFromTodoist,
  transformCreateTaskToTodoist,
  transformUpdateTaskToTodoist,
  transformProjectFromTodoist,
  type TodoistTask,
  type TodoistProject,
} from './TodoistAdapter'

describe('Todoist transforms', () => {
  describe('transformTaskFromTodoist', () => {
    it('应该正确转换基本任务', () => {
      const todoistTask: TodoistTask = {
        id: '123',
        projectId: 'proj-1',
        content: '测试任务',
        description: '任务描述',
        checked: false,
        priority: 1,
        childOrder: 1,
        addedAt: '2024-01-01T00:00:00Z',
        labels: ['work'],
      }

      const result = transformTaskFromTodoist(todoistTask)

      expect(result).toEqual({
        id: '123',
        projectId: 'proj-1',
        title: '测试任务',
        content: '任务描述',
        dueDate: undefined,
        isAllDay: true,
        priority: 0, // 1 -> 0 (无)
        status: 0,
        sortOrder: 1,
        createdTime: '2024-01-01T00:00:00Z',
        tags: ['work'],
      })
    })

    it('应该正确转换优先级', () => {
      const baseTask: TodoistTask = {
        id: '1',
        projectId: 'p1',
        content: 'test',
        description: '',
        checked: false,
        priority: 1,
        childOrder: 1,
        addedAt: '',
        labels: [],
      }

      // Todoist 4 -> 内部 5 (高)
      expect(
        transformTaskFromTodoist({ ...baseTask, priority: 4 }).priority
      ).toBe(5)
      // Todoist 3 -> 内部 3 (中)
      expect(
        transformTaskFromTodoist({ ...baseTask, priority: 3 }).priority
      ).toBe(3)
      // Todoist 2 -> 内部 1 (低)
      expect(
        transformTaskFromTodoist({ ...baseTask, priority: 2 }).priority
      ).toBe(1)
      // Todoist 1 -> 内部 0 (无)
      expect(
        transformTaskFromTodoist({ ...baseTask, priority: 1 }).priority
      ).toBe(0)
    })

    it('应该正确转换完成状态', () => {
      const baseTask: TodoistTask = {
        id: '1',
        projectId: 'p1',
        content: 'test',
        description: '',
        checked: false,
        priority: 1,
        childOrder: 1,
        addedAt: '',
        labels: [],
      }

      expect(
        transformTaskFromTodoist({ ...baseTask, checked: false }).status
      ).toBe(0)
      expect(
        transformTaskFromTodoist({ ...baseTask, checked: true }).status
      ).toBe(2)
    })

    it('应该正确转换全天任务日期', () => {
      const task: TodoistTask = {
        id: '1',
        projectId: 'p1',
        content: 'test',
        description: '',
        checked: false,
        priority: 1,
        childOrder: 1,
        addedAt: '',
        labels: [],
        due: {
          date: '2024-01-15',
          string: 'Jan 15',
          isRecurring: false,
        },
      }

      const result = transformTaskFromTodoist(task)
      expect(result.dueDate).toBe('2024-01-15')
      expect(result.isAllDay).toBe(true)
    })

    it('应该正确转换带时间的日期（v1 格式：datetime 独立字段）', () => {
      const task: TodoistTask = {
        id: '1',
        projectId: 'p1',
        content: 'test',
        description: '',
        checked: false,
        priority: 1,
        childOrder: 1,
        addedAt: '',
        labels: [],
        due: {
          date: '2024-01-15',
          datetime: '2024-01-15T06:30:00Z',
          string: 'Jan 15 2:30pm',
          timezone: 'Asia/Shanghai',
          isRecurring: false,
        },
      }

      const result = transformTaskFromTodoist(task)
      expect(result.dueDate).toBe('2024-01-15T06:30:00Z')
      expect(result.isAllDay).toBe(false)
    })

    it('全天任务 datetime 为 null 时 isAllDay 为 true', () => {
      const task: TodoistTask = {
        id: '1',
        projectId: 'p1',
        content: 'test',
        description: '',
        checked: false,
        priority: 1,
        childOrder: 1,
        addedAt: '',
        labels: [],
        due: {
          date: '2024-01-15',
          datetime: null,
          string: 'Jan 15',
          isRecurring: false,
        },
      }

      const result = transformTaskFromTodoist(task)
      expect(result.dueDate).toBe('2024-01-15')
      expect(result.isAllDay).toBe(true)
    })

    it('全天任务 datetime 缺失时 isAllDay 为 true', () => {
      const task: TodoistTask = {
        id: '1',
        projectId: 'p1',
        content: 'test',
        description: '',
        checked: false,
        priority: 1,
        childOrder: 1,
        addedAt: '',
        labels: [],
        due: {
          date: '2024-01-15',
          string: 'Jan 15',
          isRecurring: false,
        },
      }

      const result = transformTaskFromTodoist(task)
      expect(result.dueDate).toBe('2024-01-15')
      expect(result.isAllDay).toBe(true)
    })

    it('应该处理空描述', () => {
      const task: TodoistTask = {
        id: '1',
        projectId: 'p1',
        content: 'test',
        description: '',
        checked: false,
        priority: 1,
        childOrder: 1,
        addedAt: '',
        labels: [],
      }

      expect(transformTaskFromTodoist(task).content).toBeUndefined()
    })
  })

  describe('transformCreateTaskToTodoist', () => {
    it('应该转换基本创建请求', () => {
      const result = transformCreateTaskToTodoist({
        title: '新任务',
      })

      expect(result).toEqual({
        content: '新任务',
      })
    })

    it('应该包含所有可选字段（全天日期 → dueDate）', () => {
      const result = transformCreateTaskToTodoist({
        title: '新任务',
        projectId: 'proj-1',
        content: '描述',
        priority: 5,
        dueDate: '2024-01-15',
      })

      expect(result).toEqual({
        content: '新任务',
        projectId: 'proj-1',
        description: '描述',
        priority: 4, // 5 -> 4 (高)
        dueDate: '2024-01-15',
      })
    })

    it('应该正确处理带时间的日期（→ dueDatetime UTC）', () => {
      const result = transformCreateTaskToTodoist({
        title: '任务',
        dueDate: '2024-01-15T14:30:00Z',
      })

      expect(result.dueDatetime).toBe('2024-01-15T14:30:00.000Z')
      expect(result.dueDate).toBeUndefined()
    })

    it('应该正确处理带偏移量的日期（转 UTC）', () => {
      const result = transformCreateTaskToTodoist({
        title: '任务',
        dueDate: '2024-01-15T00:00:00.000+08:00',
      })

      // +08:00 的 00:00 转 UTC = 前一天 16:00
      expect(result.dueDatetime).toBe('2024-01-14T16:00:00.000Z')
      expect(result.dueDate).toBeUndefined()
    })

    it('应该正确转换优先级到 Todoist 格式', () => {
      // 内部 5+ -> Todoist 4
      expect(
        transformCreateTaskToTodoist({ title: 't', priority: 5 }).priority
      ).toBe(4)
      expect(
        transformCreateTaskToTodoist({ title: 't', priority: 6 }).priority
      ).toBe(4)
      // 内部 3-4 -> Todoist 3
      expect(
        transformCreateTaskToTodoist({ title: 't', priority: 3 }).priority
      ).toBe(3)
      expect(
        transformCreateTaskToTodoist({ title: 't', priority: 4 }).priority
      ).toBe(3)
      // 内部 1-2 -> Todoist 2
      expect(
        transformCreateTaskToTodoist({ title: 't', priority: 1 }).priority
      ).toBe(2)
      expect(
        transformCreateTaskToTodoist({ title: 't', priority: 2 }).priority
      ).toBe(2)
      // 内部 0 -> Todoist 1
      expect(
        transformCreateTaskToTodoist({ title: 't', priority: 0 }).priority
      ).toBe(1)
    })
  })

  describe('transformUpdateTaskToTodoist', () => {
    it('应该只包含提供的字段', () => {
      expect(transformUpdateTaskToTodoist({})).toEqual({})

      expect(transformUpdateTaskToTodoist({ title: '新标题' })).toEqual({
        content: '新标题',
      })

      expect(transformUpdateTaskToTodoist({ priority: 3 })).toEqual({
        priority: 3,
      })
    })

    it('应该正确处理全天日期更新', () => {
      const result = transformUpdateTaskToTodoist({ dueDate: '2024-01-15' })
      expect(result.dueDate).toBe('2024-01-15')
      expect(result.dueDatetime).toBeUndefined()
    })

    it('应该正确处理带时间的日期更新（转 UTC）', () => {
      const result = transformUpdateTaskToTodoist({
        dueDate: '2024-01-15T10:00:00Z',
      })
      expect(result.dueDatetime).toBe('2024-01-15T10:00:00.000Z')
      expect(result.dueDate).toBeUndefined()
    })

    it('清除日期时两个字段都置 null', () => {
      const result = transformUpdateTaskToTodoist({ dueDate: '' })
      expect(result.dueDate).toBeNull()
      expect(result.dueDatetime).toBeNull()
    })
  })

  describe('transformProjectFromTodoist', () => {
    it('应该正确转换普通项目', () => {
      const project: TodoistProject = {
        id: 'proj-1',
        name: '工作',
        color: 'blue',
        childOrder: 1,
        inboxProject: false,
        isFavorite: false,
        viewStyle: 'list',
      }

      expect(transformProjectFromTodoist(project)).toEqual({
        id: 'proj-1',
        name: '工作',
        sortOrder: 1,
        kind: undefined,
        color: '#4073ff', // 'blue' → hex
      })
    })

    it('应该正确标记收件箱项目', () => {
      const inbox: TodoistProject = {
        id: 'inbox-1',
        name: 'Inbox',
        color: 'grey',
        childOrder: 0,
        inboxProject: true,
        isFavorite: false,
        viewStyle: 'list',
      }

      expect(transformProjectFromTodoist(inbox).kind).toBe('INBOX')
    })
  })

  describe('due 字段映射（v1 API 扁平字段）', () => {
    it('全天日期 → dueDate 字段', () => {
      const result = transformCreateTaskToTodoist({
        title: 'test',
        dueDate: '2026-02-27',
      })

      expect(result.dueDate).toBe('2026-02-27')
      expect(result.dueDatetime).toBeUndefined()
    })

    it('带时间日期 → dueDatetime 字段（UTC ISO 格式）', () => {
      const result = transformCreateTaskToTodoist({
        title: 'test',
        dueDate: '2026-02-27T00:00:00Z',
      })

      expect(result.dueDatetime).toBe('2026-02-27T00:00:00.000Z')
      expect(result.dueDate).toBeUndefined()
    })

    it('带偏移量的日期转为 UTC', () => {
      const result = transformCreateTaskToTodoist({
        title: 'test',
        dueDate: '2026-02-27T00:00:00.000+08:00',
      })

      // +08:00 00:00 → UTC 前一天 16:00
      expect(result.dueDatetime).toBe('2026-02-26T16:00:00.000Z')
    })

    it('FocusView 完整链路：formatDateStr → dueDate 全天', () => {
      // FocusView 现在只传纯日期，不带 T00:00:00
      const today = new Date(2026, 1, 27)
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const d = String(today.getDate()).padStart(2, '0')
      const dueDate = `${y}-${m}-${d}` // formatDateStr 输出

      const result = transformCreateTaskToTodoist({
        title: 'Focus task',
        dueDate,
      })

      expect(result.dueDate).toBe('2026-02-27')
      expect(result.dueDatetime).toBeUndefined()
    })
  })
})
