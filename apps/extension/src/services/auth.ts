import { storage } from './storage'
import { didaConfig, refreshDidaCompatToken } from './didaCompatConfig'
import type { DidaCompatProviderConfig } from './didaCompatConfig'
import type { AuthToken } from '@/types'

export type AuthEventType = 'token_invalid' | 'token_refreshed' | 'logged_out'
type AuthEventListener = (event: AuthEventType) => void

class AuthService {
  private refreshPromise: Promise<AuthToken | null> | null = null
  private listeners: Set<AuthEventListener> = new Set()
  private config: DidaCompatProviderConfig

  constructor(config: DidaCompatProviderConfig) {
    this.config = config
  }

  /** 订阅认证事件 */
  onAuthEvent(listener: AuthEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: AuthEventType): void {
    this.listeners.forEach((listener) => listener(event))
  }

  async login(): Promise<AuthToken> {
    const { clientId, clientSecret, authUrl } = this.config
    if (!clientId || !clientSecret) {
      throw new Error('认证配置缺失，请检查环境变量')
    }

    const redirectUri = chrome.identity.getRedirectURL()
    const url = new URL(authUrl)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'tasks:read tasks:write')

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: url.toString(),
          interactive: true,
        },
        async (responseUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
            return
          }

          if (!responseUrl) {
            reject(new Error('未获取到授权响应'))
            return
          }

          try {
            const parsed = new URL(responseUrl)
            const code = parsed.searchParams.get('code')

            if (!code) {
              reject(new Error('未获取到授权码'))
              return
            }

            const token = await this.exchangeCodeForToken(code, redirectUri)
            await storage.setToken(token)
            resolve(token)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  private async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<AuthToken> {
    const { clientId, clientSecret, tokenUrl } = this.config
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        scope: 'tasks:read tasks:write',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.error_description || errorData.error || 'Token 获取失败'
      throw new Error(`认证失败 (${response.status}): ${errorMessage}`)
    }

    return response.json()
  }

  async refreshToken(): Promise<AuthToken | null> {
    // 如果已有刷新操作正在进行，等待其完成
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const currentToken = await storage.getToken()
    if (!currentToken?.refresh_token) {
      return null
    }

    const refreshToken = currentToken.refresh_token

    // 创建刷新 Promise，并在完成后清理（refreshPromise 充当并发互斥）
    this.refreshPromise = (async () => {
      try {
        const token = await refreshDidaCompatToken(this.config, refreshToken)
        if (!token) {
          console.error('[Auth] Token 刷新失败，清除本地 token')
          await storage.clearToken()
          this.emit('token_invalid')
          return null
        }
        await storage.setToken(token)
        this.emit('token_refreshed')
        return token
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async logout(): Promise<void> {
    await storage.clearToken()
    this.emit('logged_out')
  }

  async getValidToken(): Promise<string | null> {
    const isValid = await storage.isTokenValid()
    if (isValid) {
      const token = await storage.getToken()
      return token?.access_token || null
    }

    const refreshed = await this.refreshToken()
    return refreshed?.access_token || null
  }
}

/** 创建滴答清单兼容的认证服务实例 */
export function createDidaCompatAuth(
  config: DidaCompatProviderConfig
): AuthService {
  return new AuthService(config)
}

export const auth = new AuthService(didaConfig)
