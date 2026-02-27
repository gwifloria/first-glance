import { describe, it, expect, beforeEach } from 'vitest'
import { DidaListAdapter } from './DidaListAdapter'

vi.mock('./tasks', () => ({
  tasksApi: {
    create: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('./projects', () => ({
  projectsApi: {
    getAll: vi.fn(),
    getAllTasks: vi.fn(),
  },
}))

import { tasksApi } from './tasks'
import { makeTask } from '@/test/factories'

describe('DidaListAdapter', () => {
  let adapter: DidaListAdapter

  beforeEach(() => {
    adapter = new DidaListAdapter()
    vi.clearAllMocks()
  })

  describe('createTask', () => {
    it('dueDate 透传', async () => {
      const mockResult = makeTask({ id: 'new-1' })
      vi.mocked(tasksApi.create).mockResolvedValue(mockResult)

      await adapter.createTask({
        title: 'Test',
        dueDate: '2026-02-27T00:00:00',
      })

      expect(tasksApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: '2026-02-27T00:00:00',
        })
      )
    })

    it('priority 默认 0', async () => {
      vi.mocked(tasksApi.create).mockResolvedValue(makeTask())

      await adapter.createTask({ title: 'Test' })

      expect(tasksApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 0,
        })
      )
    })

    it('可选字段透传', async () => {
      vi.mocked(tasksApi.create).mockResolvedValue(makeTask())

      await adapter.createTask({
        title: 'Test',
        projectId: 'proj-1',
        content: '详细描述',
        priority: 5,
      })

      expect(tasksApi.create).toHaveBeenCalledWith({
        title: 'Test',
        projectId: 'proj-1',
        content: '详细描述',
        priority: 5,
        dueDate: undefined,
      })
    })
  })

  describe('completeTask', () => {
    it('传递 projectId 和 id', async () => {
      vi.mocked(tasksApi.complete).mockResolvedValue(undefined)

      const task = makeTask({ id: 'task-1', projectId: 'proj-1' })
      await adapter.completeTask(task)

      expect(tasksApi.complete).toHaveBeenCalledWith('proj-1', 'task-1')
    })
  })

  describe('deleteTask', () => {
    it('传递 projectId 和 id', async () => {
      vi.mocked(tasksApi.delete).mockResolvedValue(undefined)

      const task = makeTask({ id: 'task-2', projectId: 'proj-2' })
      await adapter.deleteTask(task)

      expect(tasksApi.delete).toHaveBeenCalledWith('proj-2', 'task-2')
    })
  })
})
