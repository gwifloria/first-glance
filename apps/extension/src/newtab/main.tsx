import { StrictMode, useState, useEffect, useMemo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { AppModeProvider } from '@/contexts/AppModeProvider'
import { ConnectPromptProvider } from '@/contexts/ConnectPromptProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ErrorBoundary } from '@/components/common'
import { useTheme } from '@/hooks/useTheme'
import { createAntdTheme } from '@/themes/antdTheme'
import '@/i18n'
import App from './App'
import '@/styles/index.css'

// Ant Design 配置包装器，响应主题变化
function AntdConfigProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { theme, themeType } = useTheme()
  const [antdLocale, setAntdLocale] = useState(
    i18n.language.startsWith('zh') ? zhCN : enUS
  )

  // 缓存 Antd 主题配置，仅当 themeType 变化时重新创建
  const antdTheme = useMemo(() => createAntdTheme(theme), [themeType])

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setAntdLocale(lng.startsWith('zh') ? zhCN : enUS)
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  return (
    <ConfigProvider locale={antdLocale} theme={antdTheme}>
      {children}
    </ConfigProvider>
  )
}

export function Root() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AppModeProvider>
          <ThemeProvider>
            <AntdConfigProvider>
              <ConnectPromptProvider>
                <App />
              </ConnectPromptProvider>
            </AntdConfigProvider>
          </ThemeProvider>
        </AppModeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
