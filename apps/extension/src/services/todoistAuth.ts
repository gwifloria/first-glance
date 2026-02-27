/**
 * Todoist OAuth 认证服务
 * 文档: https://developer.todoist.com/api/v1/
 *
 * 特点：
 * - Token 永久有效，无需 refresh
 * - Scope: data:read_write,data:delete
 */
import { storage } from './storage'

const CLIENT_ID = import.meta.env.VITE_TODOIST_CLIENT_ID || ''
const CLIENT_SECRET = import.meta.env.VITE_TODOIST_CLIENT_SECRET || ''

const AUTH_URL = 'https://todoist.com/oauth/authorize'
const TOKEN_URL = 'https://todoist.com/oauth/access_token'

// 开发环境下校验配置
if (import.meta.env.DEV && (!CLIENT_ID || !CLIENT_SECRET)) {
  console.warn(
    '[TodoistAuth] 缺少环境变量 VITE_TODOIST_CLIENT_ID 或 VITE_TODOIST_CLIENT_SECRET，Todoist 认证功能将不可用'
  )
}

class TodoistAuthService {
  /** 检查是否已配置 Todoist 凭证 */
  isConfigured(): boolean {
    return Boolean(CLIENT_ID && CLIENT_SECRET)
  }

  async login(): Promise<string> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Todoist 认证配置缺失，请检查环境变量')
    }

    // 生成随机 state 用于防止 CSRF
    const state = Math.random().toString(36).substring(2, 15)

    // Chrome 扩展的 redirect URI
    const redirectUri = chrome.identity.getRedirectURL()

    const authUrl = new URL(AUTH_URL)
    authUrl.searchParams.set('client_id', CLIENT_ID)
    authUrl.searchParams.set('scope', 'data:read_write,data:delete')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('redirect_uri', redirectUri)

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
            const returnedState = url.searchParams.get('state')
            const error = url.searchParams.get('error')

            if (error) {
              reject(new Error(`授权失败: ${error}`))
              return
            }

            if (returnedState !== state) {
              reject(new Error('授权状态不匹配，可能存在安全风险'))
              return
            }

            if (!code) {
              reject(new Error('未获取到授权码'))
              return
            }

            const token = await this.exchangeCodeForToken(code)
            await storage.setTodoistToken(token)
            resolve(token)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || 'Token 获取失败'
      throw new Error(`认证失败 (${response.status}): ${errorMessage}`)
    }

    const data = await response.json()
    return data.access_token
  }

  async logout(): Promise<void> {
    await storage.clearTodoistToken()
  }

  async isLoggedIn(): Promise<boolean> {
    const token = await storage.getTodoistToken()
    return Boolean(token)
  }

  async getToken(): Promise<string | null> {
    return storage.getTodoistToken()
  }
}

export const todoistAuth = new TodoistAuthService()
