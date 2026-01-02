import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { antdTheme } from '@/themes/antdTheme'
import '@/i18n'
import App from './App'
import '@/styles/index.css'

export function Root() {
  const { i18n } = useTranslation()
  const [antdLocale, setAntdLocale] = useState(
    i18n.language.startsWith('zh') ? zhCN : enUS
  )

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
      <SettingsProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SettingsProvider>
    </ConfigProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
