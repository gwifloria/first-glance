/**
 * API 请求客户端
 */
import { auth } from '@/services/auth'
import { API_BASE } from './endpoints'

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await auth.getValidToken()
  if (!token) {
    throw new Error('未登录')
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.errorMessage || `请求失败: ${response.status}`)
  }

  // 204 No Content 或空响应体
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text)
}
