/**
 * 滴答清单/TickTick API 请求客户端
 */
import { auth } from '@/services/auth'
import { AuthError } from '@/api/AuthError'
import { DIDA_API_BASE } from './endpoints'

export type RequestFn = <T = void>(
  endpoint: string,
  options?: RequestInit
) => Promise<T>

/** 创建兼容的请求函数 */
export function createDidaCompatRequest(
  apiBase: string,
  getToken: () => Promise<string | null>
): RequestFn {
  return async function request<T = void>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getToken()
    if (!token) {
      throw new Error('未登录')
    }

    const response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg =
        errorData?.errorMessage ||
        errorData?.error ||
        errorData?.message ||
        `请求失败: ${response.status}`

      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 410
      ) {
        throw new AuthError(errorMsg, response.status)
      }

      throw new Error(errorMsg)
    }

    // 204 No Content 或空响应体
    if (response.status === 204) {
      return undefined as unknown as T
    }

    const text = await response.text()
    if (!text) {
      return undefined as unknown as T
    }

    try {
      return JSON.parse(text) as T
    } catch (err) {
      console.error(
        '[API] JSON 解析失败:',
        err,
        'response:',
        text.slice(0, 200)
      )
      throw new Error('服务器返回了无效的响应格式')
    }
  }
}

/** 滴答清单默认请求函数 */
export const request: RequestFn = createDidaCompatRequest(DIDA_API_BASE, () =>
  auth.getValidToken()
)
