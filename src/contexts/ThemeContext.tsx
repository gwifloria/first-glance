import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { type Theme, type ThemeType, journalTheme, techTheme } from '@/themes'

const themes: Record<ThemeType, Theme> = {
  journal: journalTheme,
  tech: techTheme,
}

interface ThemeContextValue {
  theme: Theme
  themeType: ThemeType
  setThemeType: (type: ThemeType) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'theme_preference'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeType, setThemeTypeState] = useState<ThemeType>('journal')

  useEffect(() => {
    // 从 storage 读取主题偏好
    chrome.storage.local.get(STORAGE_KEY).then((result) => {
      if (result[STORAGE_KEY]) {
        setThemeTypeState(result[STORAGE_KEY] as ThemeType)
      }
    })
  }, [])

  const setThemeType = useCallback((type: ThemeType) => {
    setThemeTypeState(type)
    chrome.storage.local.set({ [STORAGE_KEY]: type })
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeType(themeType === 'journal' ? 'tech' : 'journal')
  }, [themeType, setThemeType])

  const theme = themes[themeType]

  // 应用 CSS 变量
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bg-primary', theme.colors.bgPrimary)
    root.style.setProperty('--bg-secondary', theme.colors.bgSecondary)
    root.style.setProperty('--bg-card', theme.colors.bgCard)
    root.style.setProperty('--text-primary', theme.colors.textPrimary)
    root.style.setProperty('--text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--accent', theme.colors.accent)
    root.style.setProperty('--accent-light', theme.colors.accentLight)
    root.style.setProperty('--border', theme.colors.border)
    root.style.setProperty('--success', theme.colors.success)
    root.style.setProperty('--warning', theme.colors.warning)
    root.style.setProperty('--danger', theme.colors.danger)
    root.style.setProperty('--priority-high', theme.colors.priorityHigh)
    root.style.setProperty('--priority-medium', theme.colors.priorityMedium)
    root.style.setProperty('--priority-low', theme.colors.priorityLow)
    root.style.setProperty('--radius-small', theme.borderRadius.small)
    root.style.setProperty('--radius-medium', theme.borderRadius.medium)
    root.style.setProperty('--radius-large', theme.borderRadius.large)
    root.style.setProperty('--shadow-small', theme.shadow.small)
    root.style.setProperty('--shadow-medium', theme.shadow.medium)
    root.style.setProperty('--shadow-large', theme.shadow.large)
    root.style.setProperty('--font-primary', theme.font.primary)
    root.style.setProperty('--font-secondary', theme.font.secondary)
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{ theme, themeType, setThemeType, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
