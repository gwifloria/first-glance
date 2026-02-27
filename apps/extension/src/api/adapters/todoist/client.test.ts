import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthError } from '@/api/AuthError'

vi.mock('@/services/storage', () => ({
  storage: {
    getTodoistToken: vi.fn(),
  },
}))

import { storage } from '@/services/storage'
import { request, fetchAllPages } from './client'
import { TODOIST_API_BASE } from './endpoints'

describe('Todoist client', () => {
  let originalFetch: typeof fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    vi.clearAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('request', () => {
    it('发送带 Bearer token 的请求', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue('test-token')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ id: '1' }), { status: 200 })
        )

      await request('/tasks')

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${TODOIST_API_BASE}/tasks`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('body 自动 camelCase → snake_case', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue('token')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))

      await request('/tasks', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'p1', dueDate: '2026-01-01' }),
      })

      const callArgs = vi.mocked(globalThis.fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)
      expect(body).toEqual({ project_id: 'p1', due_date: '2026-01-01' })
    })

    it('响应自动 snake_case → camelCase', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue('token')
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ project_id: 'p1', child_order: 1 }), {
          status: 200,
        })
      )

      const result = await request<{ projectId: string; childOrder: number }>(
        '/tasks'
      )

      expect(result.projectId).toBe('p1')
      expect(result.childOrder).toBe(1)
    })

    it('401 抛出 AuthError', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue('token')
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
        })
      )

      await expect(request('/tasks')).rejects.toThrow(AuthError)
    })

    it('403 抛出 AuthError', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue('token')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
        )

      await expect(request('/tasks')).rejects.toThrow(AuthError)
    })

    it('204 返回 undefined', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue('token')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 204 }))

      const result = await request('/tasks/1/close')
      expect(result).toBeUndefined()
    })

    it('未登录抛出 Error', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue(null)

      await expect(request('/tasks')).rejects.toThrow('未登录 Todoist')
    })
  })

  describe('fetchAllPages', () => {
    it('收集多页', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue('token')

      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                results: [{ id: '1' }],
                next_cursor: 'cursor-2',
              }),
              { status: 200 }
            )
          )
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              results: [{ id: '2' }],
              next_cursor: null,
            }),
            { status: 200 }
          )
        )
      })

      const result = await fetchAllPages<{ id: string }>('/tasks')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
    })

    it('单页直接返回', async () => {
      vi.mocked(storage.getTodoistToken).mockResolvedValue('token')
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [{ id: '1' }, { id: '2' }],
            next_cursor: null,
          }),
          { status: 200 }
        )
      )

      const result = await fetchAllPages<{ id: string }>('/tasks')

      expect(result).toHaveLength(2)
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
