import { StrictMode, useState, useEffect, useMemo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { AppModeProvider } from '@/contexts/AppModeProvider'
import { ConnectPromptProvider } from '@/contexts/ConnectPromptProvider'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { FontProvider } from '@/contexts/FontProvider'
import { PremiumProvider } from '@/contexts/PremiumProvider'
import { ErrorBoundary } from '@/components/common'
import { useTheme } from '@/hooks/useTheme'
import { createAntdTheme } from '@/themes/antdTheme'
import '@/i18n'
import App from './App'
import '@/styles/index.css'

// Ant Design 配置包装器，响应主题变化
function AntdConfigProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { theme } = useTheme()
  const [antdLocale, setAntdLocale] = useState(
    i18n.language.startsWith('zh') ? zhCN : enUS
  )

  // 缓存 Antd 主题配置，仅当 theme 变化时重新创建
  const antdTheme = useMemo(() => createAntdTheme(theme), [theme])

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
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}

export function Root() {
  return (
    <ErrorBoundary>
      <AppModeProvider>
        <PremiumProvider>
          <ThemeProvider>
            <FontProvider>
              <AntdConfigProvider>
                <ConnectPromptProvider>
                  <App />
                </ConnectPromptProvider>
              </AntdConfigProvider>
            </FontProvider>
          </ThemeProvider>
        </PremiumProvider>
      </AppModeProvider>
    </ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
