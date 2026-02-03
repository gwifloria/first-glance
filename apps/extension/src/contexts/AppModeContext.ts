/**
 * 应用模式 Context 定义
 */
import { createContext } from 'react'
import type { AppMode } from '@/types'
import type { ServiceProvider } from '@/services/authManager'

export interface AppModeContextValue {
  mode: AppMode
  loading: boolean
  isGuest: boolean
  isConnected: boolean
  /** 当前连接的服务商 */
  currentProvider: ServiceProvider | null
  /** 连接到指定服务商 */
  connect: (provider: ServiceProvider) => Promise<void>
  disconnect: () => Promise<void>
}

export const AppModeContext = createContext<AppModeContextValue | null>(null)
