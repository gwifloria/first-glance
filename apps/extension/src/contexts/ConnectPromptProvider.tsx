/**
 * 连接弹窗 Provider
 */
import { ConnectPrompt } from '@/components/ConnectPrompt'
import { message } from 'antd'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppMode } from './useAppMode'
import { ConnectPromptContext } from './ConnectPromptContext'
import type { ServiceProvider } from '@/services/authManager'

export function ConnectPromptProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  const { connect } = useAppMode()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const mountedRef = useRef(true)
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const openConnectPrompt = useCallback(() => {
    setOpen(true)
  }, [])

  const handleConnect = useCallback(
    async (provider: ServiceProvider) => {
      setLoading(true)
      try {
        await connect(provider)
        if (!mountedRef.current) return
        setOpen(false)
      } catch (error) {
        console.error('[ConnectPrompt] 连接失败:', error)
        if (!mountedRef.current) return
        message.error(t('message.failedToConnect'))
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [connect, t]
  )

  const handleCancel = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <ConnectPromptContext.Provider value={{ openConnectPrompt }}>
      {children}
      <ConnectPrompt
        open={open}
        loading={loading}
        onConnect={handleConnect}
        onCancel={handleCancel}
      />
    </ConnectPromptContext.Provider>
  )
}
