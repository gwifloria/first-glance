/**
 * 认证相关类型定义
 */

/** OAuth Token */
export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  refresh_token?: string
  expires_at?: number
}

/** API 错误响应 */
export interface ApiError {
  errorCode: string
  errorMessage: string
}

/** 应用模式 */
export type AppMode = 'guest' | 'connected'
