/**
 * 统一认证管理器
 * 管理多个服务商的认证状态
 */
import { storage } from './storage'
import { auth as didaAuth } from './auth'
import { todoistAuth } from './todoistAuth'

export type ServiceProvider = 'didaList' | 'todoist'

export interface AuthManager {
  /** 获取当前连接的服务商类型 */
  getCurrentProvider(): Promise<ServiceProvider | null>

  /** 检查是否已连接任何服务 */
  isConnected(): Promise<boolean>

  /** 连接到指定服务商 */
  connect(provider: ServiceProvider): Promise<void>

  /** 断开当前连接 */
  disconnect(): Promise<void>

  /** 获取当前服务的有效 token */
  getValidToken(): Promise<string | null>
}

class AuthManagerImpl implements AuthManager {
  async getCurrentProvider(): Promise<ServiceProvider | null> {
    const adapterType = await storage.getAdapterType()
    if (adapterType === 'didaList' || adapterType === 'todoist') {
      return adapterType
    }
    return null
  }

  async isConnected(): Promise<boolean> {
    const provider = await this.getCurrentProvider()
    if (!provider) return false

    if (provider === 'didaList') {
      return storage.isTokenValid()
    }

    if (provider === 'todoist') {
      return todoistAuth.isLoggedIn()
    }

    return false
  }

  async connect(provider: ServiceProvider): Promise<void> {
    console.log('[AuthManager] 开始连接:', provider)
    if (provider === 'didaList') {
      await didaAuth.login()
      await storage.setAdapterType('didaList')
    } else if (provider === 'todoist') {
      console.log('[AuthManager] 调用 todoistAuth.login()')
      await todoistAuth.login()
      console.log('[AuthManager] todoistAuth.login() 完成')
      // todoistAuth.login 已经设置了 adapter_type
    }
  }

  async disconnect(): Promise<void> {
    const provider = await this.getCurrentProvider()

    if (provider === 'didaList') {
      await didaAuth.logout()
    } else if (provider === 'todoist') {
      await todoistAuth.logout()
    }

    await storage.clearAllAuth()
  }

  async getValidToken(): Promise<string | null> {
    const provider = await this.getCurrentProvider()

    if (provider === 'didaList') {
      return didaAuth.getValidToken()
    }

    if (provider === 'todoist') {
      return todoistAuth.getToken()
    }

    return null
  }
}

export const authManager = new AuthManagerImpl()

/** 获取可用的服务商列表（已配置凭证的） */
export function getAvailableProviders(): ServiceProvider[] {
  const providers: ServiceProvider[] = []

  // 检查滴答清单是否已配置
  const didaConfigured = Boolean(
    import.meta.env.VITE_DIDA_CLIENT_ID &&
    import.meta.env.VITE_DIDA_CLIENT_SECRET
  )
  if (didaConfigured) {
    providers.push('didaList')
  }

  // 检查 Todoist 是否已配置
  if (todoistAuth.isConfigured()) {
    providers.push('todoist')
  }

  return providers
}

/** 获取服务商显示名称 */
export function getProviderDisplayName(provider: ServiceProvider): string {
  switch (provider) {
    case 'didaList':
      return '滴答清单'
    case 'todoist':
      return 'Todoist'
  }
}
