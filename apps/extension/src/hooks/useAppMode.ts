import { useState, useEffect, useCallback } from 'react'
import { auth } from '@/services/auth'
import { storage } from '@/services/storage'
import type { AppMode } from '@/types'

export function useAppMode() {
  const [mode, setMode] = useState<AppMode>('guest')
  const [loading, setLoading] = useState(true)

  // Check if user is connected to DidaList
  const checkMode = useCallback(async () => {
    try {
      const token = await storage.getToken()
      setMode(token ? 'connected' : 'guest')
    } catch {
      // 存储读取失败时默认为访客模式
      setMode('guest')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkMode()
  }, [checkMode])

  const connect = useCallback(async () => {
    setLoading(true)
    try {
      await auth.login()
      setMode('connected')
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    await auth.logout()
    setMode('guest')
  }, [])

  return {
    mode,
    loading,
    connect,
    disconnect,
    isGuest: mode === 'guest',
    isConnected: mode === 'connected',
  }
}
