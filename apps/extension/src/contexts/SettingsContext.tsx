import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  getSettings,
  setSettings,
  subscribeSettings,
} from '@/services/settingsStorage'
import { defaultSettings, type AppSettings } from '@/types/settings'

interface SettingsContextValue {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
  isLoading: boolean
  error: string | null
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 初始加载
  useEffect(() => {
    getSettings()
      .then(setSettingsState)
      .catch((e) => setError((e as Error).message))
      .finally(() => setIsLoading(false))
  }, [])

  // 监听跨 context 变化（其他 tab/popup 修改设置时同步）
  useEffect(() => {
    return subscribeSettings(setSettingsState)
  }, [])

  // 更新设置
  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>): Promise<void> => {
      try {
        setError(null)
        await setSettings(updates)
        // 注意：不需要手动 setSettingsState
        // subscribeSettings 会在 storage 变化时自动触发更新
      } catch (e) {
        const message = (e as Error).message
        setError(message)
        throw e
      }
    },
    []
  )

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, isLoading, error }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// 导出类型供外部使用
export type { AppSettings } from '@/types/settings'
