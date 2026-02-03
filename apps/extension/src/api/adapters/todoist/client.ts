/**
 * Todoist API 请求客户端
 */
import { storage } from '@/services/storage'
import { TODOIST_API_BASE } from './endpoints'

export async function request<T = void>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await storage.getTodoistToken()
  if (!token) {
    throw new Error('未登录 Todoist')
  }

  const response = await fetch(`${TODOIST_API_BASE}${endpoint}`, {
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
      errorData?.error || errorData?.message || `请求失败: ${response.status}`
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
  } catch {
    throw new Error('服务器返回了无效的响应格式')
  }
}
