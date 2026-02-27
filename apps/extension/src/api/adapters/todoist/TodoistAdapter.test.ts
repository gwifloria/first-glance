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

    it('应该正确转换带时间的日期（v1 格式：date 含 UTC datetime）', () => {
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
          date: '2024-01-15T06:30:00Z',
          string: 'Jan 15 2:30pm',
          timezone: 'Asia/Shanghai',
          isRecurring: false,
        },
      }

      const result = transformTaskFromTodoist(task)
      expect(result.dueDate).toBe('2024-01-15T06:30:00Z')
      expect(result.isAllDay).toBe(false)
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

    it('应该包含所有可选字段（全天日期）', () => {
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
        due: { date: '2024-01-15' },
      })
    })

    it('应该正确处理带时间的日期（due 对象 + 时区）', () => {
      const result = transformCreateTaskToTodoist({
        title: '任务',
        dueDate: '2024-01-15T14:30:00',
      })

      expect(result.due).toEqual({
        date: '2024-01-15T14:30:00',
        timezone: expect.any(String),
      })
    })

    it('应该正确处理带偏移量的日期（去除偏移量）', () => {
      const result = transformCreateTaskToTodoist({
        title: '任务',
        dueDate: '2024-01-15T00:00:00.000+08:00',
      })

      expect(result.due).toEqual({
        date: '2024-01-15T00:00:00',
        timezone: expect.any(String),
      })
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

    it('应该正确处理日期更新', () => {
      // 全天日期
      expect(transformUpdateTaskToTodoist({ dueDate: '2024-01-15' })).toEqual({
        due: { date: '2024-01-15' },
      })

      // 带时间的日期
      const result = transformUpdateTaskToTodoist({
        dueDate: '2024-01-15T10:00:00',
      })
      expect(result.due).toEqual({
        date: '2024-01-15T10:00:00',
        timezone: expect.any(String),
      })

      // 清除日期
      expect(transformUpdateTaskToTodoist({ dueDate: '' })).toEqual({
        due: null,
      })
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
})
