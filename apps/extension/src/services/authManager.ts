/**
 * 统一认证管理器
 * 管理多个服务商的认证状态
 */
import { storage } from './storage'
import { auth as didaAuth } from './auth'
import { ticktickAuth } from './ticktickAuth'
import { todoistAuth } from './todoistAuth'
import { setSettings } from './settingsStorage'
import {
  isDidaCompatConfigured,
  didaConfig,
  ticktickConfig,
} from './didaCompatConfig'

export type ServiceProvider = 'didaList' | 'ticktick' | 'todoist'

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
    if (
      adapterType === 'didaList' ||
      adapterType === 'ticktick' ||
      adapterType === 'todoist'
    ) {
      return adapterType
    }
    return null
  }

  async isConnected(): Promise<boolean> {
    const provider = await this.getCurrentProvider()
    if (!provider) return false

    if (provider === 'didaList' || provider === 'ticktick') {
      return storage.isTokenValid()
    }

    if (provider === 'todoist') {
      return todoistAuth.isLoggedIn()
    }

    return false
  }

  async connect(provider: ServiceProvider): Promise<void> {
    if (provider === 'didaList') {
      await didaAuth.login()
    } else if (provider === 'ticktick') {
      await ticktickAuth.login()
    } else if (provider === 'todoist') {
      await todoistAuth.login()
    }
    await storage.setAdapterType(provider)
  }

  async disconnect(): Promise<void> {
    await storage.clearAllAuth()
    // 清除服务相关的设置（如 defaultProjectId），避免切换服务后残留
    await setSettings({ defaultProjectId: null })
  }

  async getValidToken(): Promise<string | null> {
    const provider = await this.getCurrentProvider()

    if (provider === 'didaList') {
      return didaAuth.getValidToken()
    }

    if (provider === 'ticktick') {
      return ticktickAuth.getValidToken()
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

  if (isDidaCompatConfigured(didaConfig)) {
    providers.push('didaList')
  }

  if (isDidaCompatConfigured(ticktickConfig)) {
    providers.push('ticktick')
  }

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
    case 'ticktick':
      return 'TickTick'
    case 'todoist':
      return 'Todoist'
  }
}
