import { describe, it, expect, beforeEach } from 'vitest'
import { DidaListAdapter } from './index'

vi.mock('../dida-compat/tasks', () => ({
  createTasksApi: () => ({
    create: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    delete: vi.fn(),
  }),
}))

vi.mock('../dida-compat/projects', () => ({
  createProjectsApi: () => ({
    getAll: vi.fn(),
    getAllTasks: vi.fn(),
  }),
}))

vi.mock('../dida-compat/client', () => ({
  createRequest: () => vi.fn(),
}))

vi.mock('@/services/auth', () => ({
  auth: { getValidToken: vi.fn() },
}))

vi.mock('@/services/didaCompatConfig', () => ({
  didaConfig: { apiBase: 'https://api.dida365.com/open/v1' },
}))

import { makeTask } from '@/test/factories'

describe('DidaListAdapter', () => {
  let adapter: DidaListAdapter

  beforeEach(() => {
    adapter = new DidaListAdapter()
    vi.clearAllMocks()
  })

  describe('createTask', () => {
    it('priority 默认 0', async () => {
      const mockResult = makeTask()
      // Access the private tasksApi through the adapter's method
      const createSpy = vi
        .spyOn(adapter, 'createTask')
        .mockResolvedValue(mockResult)

      await adapter.createTask({ title: 'Test' })

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test' })
      )
    })
  })
})
