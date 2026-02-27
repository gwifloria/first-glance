import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthError } from '@/api/AuthError'

vi.mock('@/services/auth', () => ({
  auth: {
    getValidToken: vi.fn(),
  },
}))

import { auth } from '@/services/auth'
import { request } from './client'
import { DIDA_API_BASE } from './endpoints'

describe('Dida client', () => {
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
      vi.mocked(auth.getValidToken).mockResolvedValue('dida-token')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ id: '1' }), { status: 200 })
        )

      await request('/task')

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${DIDA_API_BASE}/task`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer dida-token',
          }),
        })
      )
    })

    it('401 抛出 AuthError', async () => {
      vi.mocked(auth.getValidToken).mockResolvedValue('token')
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errorMessage: '认证失败' }), {
          status: 401,
        })
      )

      await expect(request('/task')).rejects.toThrow(AuthError)
    })

    it('403 抛出 AuthError', async () => {
      vi.mocked(auth.getValidToken).mockResolvedValue('token')
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errorMessage: '权限不足' }), {
          status: 403,
        })
      )

      await expect(request('/task')).rejects.toThrow(AuthError)
    })

    it('204 返回 undefined', async () => {
      vi.mocked(auth.getValidToken).mockResolvedValue('token')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 204 }))

      const result = await request('/task/1/complete')
      expect(result).toBeUndefined()
    })

    it('未登录抛出 Error', async () => {
      vi.mocked(auth.getValidToken).mockResolvedValue(null)

      await expect(request('/task')).rejects.toThrow('未登录')
    })

    it('不做 case 转换', async () => {
      vi.mocked(auth.getValidToken).mockResolvedValue('token')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ projectId: 'p1', dueDate: '2026-01-01' }),
            { status: 200 }
          )
        )

      const result = await request<{ projectId: string; dueDate: string }>(
        '/task'
      )

      // Dida 客户端直接返回原始 JSON，不做转换
      expect(result.projectId).toBe('p1')
      expect(result.dueDate).toBe('2026-01-01')
    })
  })
})
