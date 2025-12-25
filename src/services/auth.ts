import { storage } from './storage'
import type { AuthToken } from '@/types'

// 这些值需要从环境变量或配置中获取
const CLIENT_ID = import.meta.env.VITE_DIDA_CLIENT_ID || ''
const CLIENT_SECRET = import.meta.env.VITE_DIDA_CLIENT_SECRET || ''
const REDIRECT_URI = chrome.identity.getRedirectURL()

const AUTH_URL = 'https://dida365.com/oauth/authorize'
const TOKEN_URL = 'https://dida365.com/oauth/token'

export const auth = {
  async login(): Promise<AuthToken> {
    const authUrl = new URL(AUTH_URL)
    authUrl.searchParams.set('client_id', CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'tasks:read tasks:write')

    // 调试信息
    console.log('OAuth Config:', {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      auth_url: authUrl.toString(),
    })

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
  },

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
      throw new Error('Token 获取失败')
    }

    return response.json()
  },

  async refreshToken(): Promise<AuthToken | null> {
    const currentToken = await storage.getToken()
    if (!currentToken?.refresh_token) {
      return null
    }

    try {
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: currentToken.refresh_token,
        }),
      })

      if (!response.ok) {
        await storage.clearToken()
        return null
      }

      const token: AuthToken = await response.json()
      await storage.setToken(token)
      return token
    } catch {
      await storage.clearToken()
      return null
    }
  },

  async logout(): Promise<void> {
    await storage.clearToken()
  },

  async getValidToken(): Promise<string | null> {
    const isValid = await storage.isTokenValid()
    if (isValid) {
      const token = await storage.getToken()
      return token?.access_token || null
    }

    const refreshed = await this.refreshToken()
    return refreshed?.access_token || null
  },
}
