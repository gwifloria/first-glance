/**
 * Todoist API 请求客户端
 *
 * Todoist API v1 使用 snake_case 字段名，内部使用 camelCase。
 * 本模块在网络边界自动做双向转换，调用方无需关心。
 */
import { storage } from '@/services/storage'
import { AuthError } from '@/api/AuthError'
import { TODOIST_API_BASE } from './endpoints'

// ==================== Case Conversion ====================

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function convertKeys(
  obj: unknown,
  converter: (key: string) => string
): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeys(item, converter))
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        converter(key),
        convertKeys(value, converter),
      ])
    )
  }
  return obj
}

/** API 响应 snake_case → 内部 camelCase */
function camelCaseKeys<T>(obj: unknown): T {
  return convertKeys(obj, snakeToCamel) as T
}

/** 内部 camelCase → API 请求 snake_case */
function snakeCaseKeys(obj: unknown): unknown {
  return convertKeys(obj, camelToSnake)
}

// ==================== HTTP Client ====================

export async function request<T = void>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await storage.getTodoistToken()
  if (!token) {
    throw new Error('未登录 Todoist')
  }

  // 请求体 camelCase → snake_case
  if (typeof options.body === 'string') {
    try {
      const parsed = JSON.parse(options.body)
      options = {
        ...options,
        body: JSON.stringify(snakeCaseKeys(parsed)),
      }
    } catch {
      // 非 JSON body，原样发送
    }
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
    // 响应 snake_case → camelCase
    return camelCaseKeys<T>(JSON.parse(text))
  } catch {
    throw new Error('服务器返回了无效的响应格式')
  }
}

/** 分页响应格式 */
interface PaginatedResponse<T> {
  results: T[]
  nextCursor: string | null
}

/**
 * 自动分页获取所有数据
 * 遍历 nextCursor 直到没有更多页
 */
export async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const allResults: T[] = []
  let cursor: string | null = null

  do {
    const separator = endpoint.includes('?') ? '&' : '?'
    const url: string = cursor
      ? `${endpoint}${separator}cursor=${cursor}`
      : endpoint
    const response: PaginatedResponse<T> =
      await request<PaginatedResponse<T>>(url)
    allResults.push(...response.results)
    cursor = response.nextCursor
  } while (cursor)

  return allResults
}
