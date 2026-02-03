/**
 * 应用模式 Provider
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { authManager, type ServiceProvider } from '@/services/authManager'
import { storage } from '@/services/storage'
import type { AppMode } from '@/types'
import { AppModeContext } from './AppModeContext'

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('guest')
  const [loading, setLoading] = useState(true)
  const [currentProvider, setCurrentProvider] =
    useState<ServiceProvider | null>(null)

  // 检查连接状态
  useEffect(() => {
    const checkMode = async () => {
      try {
        const isConnected = await authManager.isConnected()
        if (isConnected) {
          const provider = await authManager.getCurrentProvider()
          setCurrentProvider(provider)
          setMode('connected')
        } else {
          // 检查是否有遗留的滴答清单 token（兼容旧版本）
          const didaToken = await storage.getToken()
          if (didaToken) {
            await storage.setAdapterType('didaList')
            setCurrentProvider('didaList')
            setMode('connected')
          } else {
            setCurrentProvider(null)
            setMode('guest')
          }
        }
      } catch {
        setCurrentProvider(null)
        setMode('guest')
      } finally {
        setLoading(false)
      }
    }
    checkMode()
  }, [])

  const connect = useCallback(async (provider: ServiceProvider) => {
    setLoading(true)
    try {
      await authManager.connect(provider)
      setCurrentProvider(provider)
      setMode('connected')
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    await authManager.disconnect()
    setCurrentProvider(null)
    setMode('guest')
  }, [])

  return (
    <AppModeContext.Provider
      value={{
        mode,
        loading,
        isGuest: mode === 'guest',
        isConnected: mode === 'connected',
        currentProvider,
        connect,
        disconnect,
      }}
    >
      {children}
    </AppModeContext.Provider>
  )
}
