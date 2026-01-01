import { storage } from './storage'
import type { AuthToken } from '@/types'

// 这些值需要从环境变量或配置中获取
const CLIENT_ID = import.meta.env.VITE_DIDA_CLIENT_ID || ''
const CLIENT_SECRET = import.meta.env.VITE_DIDA_CLIENT_SECRET || ''
const REDIRECT_URI = chrome.identity.getRedirectURL()

const AUTH_URL = 'https://dida365.com/oauth/authorize'
const TOKEN_URL = 'https://dida365.com/oauth/token'

// Debug: 检查配置
console.log('[Auth Debug] CLIENT_ID:', CLIENT_ID ? '已配置' : '未配置')
console.log('[Auth Debug] REDIRECT_URI:', REDIRECT_URI)

class AuthService {
  private refreshPromise: Promise<AuthToken | null> | null = null

  async login(): Promise<AuthToken> {
    const authUrl = new URL(AUTH_URL)
    authUrl.searchParams.set('client_id', CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'tasks:read tasks:write')

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.toString(),
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
            const url = new URL(responseUrl)
            const code = url.searchParams.get('code')

            if (!code) {
              reject(new Error('未获取到授权码'))
              return
            }

            const token = await this.exchangeCodeForToken(code)
            await storage.setToken(token)
            resolve(token)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  async exchangeCodeForToken(code: string): Promise<AuthToken> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
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

    // 创建刷新 Promise，并在完成后清理
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage =
            errorData.error_description || errorData.error || 'Token 刷新失败'
          console.error(`Token 刷新失败 (${response.status}):`, errorMessage)
          await storage.clearToken()
          return null
        }

        const token: AuthToken = await response.json()
        await storage.setToken(token)
        return token
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '未知错误'
        console.error('Token 刷新异常:', errorMsg)
        await storage.clearToken()
        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async logout(): Promise<void> {
    await storage.clearToken()
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

export const auth = new AuthService()
