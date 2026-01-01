import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  type Theme,
  type ThemeType,
  milkTheme,
  beigeTheme,
  pinkTheme,
  blueTheme,
  darkTheme,
} from '@/themes'
import { useSettings } from './SettingsContext'

const themes: Record<ThemeType, Theme> = {
  milk: milkTheme,
  beige: beigeTheme,
  pink: pinkTheme,
  blue: blueTheme,
  dark: darkTheme,
}

// 旧主题名 -> 新主题名的映射
const themeMigration: Record<string, ThemeType> = {
  journal: 'beige',
  ocean: 'blue',
  tech: 'dark',
  rose: 'milk',
}

interface ThemeContextValue {
  theme: Theme
  themeType: ThemeType
  setThemeType: (type: ThemeType) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings()

  // 处理旧主题名迁移
  const rawTheme = settings.theme as string
  const themeType: ThemeType =
    rawTheme in themeMigration
      ? themeMigration[rawTheme]
      : (rawTheme as ThemeType) in themes
        ? (rawTheme as ThemeType)
        : 'pink'

  const setThemeType = useCallback(
    (type: ThemeType) => {
      updateSettings({ theme: type })
    },
    [updateSettings]
  )

  const toggleTheme = useCallback(() => {
    setThemeType(themeType === 'milk' ? 'dark' : 'milk')
  }, [themeType, setThemeType])

  const theme = themes[themeType]

  // 应用 CSS 变量
  useEffect(() => {
    const root = document.documentElement
    // 背景色
    root.style.setProperty('--bg-primary', theme.colors.bgPrimary)
    root.style.setProperty('--bg-secondary', theme.colors.bgSecondary)
    root.style.setProperty('--bg-sidebar', theme.colors.bgSidebar)
    root.style.setProperty('--bg-content', theme.colors.bgContent)
    root.style.setProperty('--bg-card', theme.colors.bgCard)
    // 文字色
    root.style.setProperty('--text-primary', theme.colors.textPrimary)
    root.style.setProperty('--text-secondary', theme.colors.textSecondary)
    // 强调色
    root.style.setProperty('--accent', theme.colors.accent)
    root.style.setProperty('--accent-light', theme.colors.accentLight)
    root.style.setProperty('--border', theme.colors.border)
    // 侧边栏色
    root.style.setProperty('--sidebar-text', theme.colors.sidebarText)
    root.style.setProperty('--sidebar-hover', theme.colors.sidebarHover)
    root.style.setProperty('--sidebar-active', theme.colors.sidebarActive)
    root.style.setProperty(
      '--sidebar-active-text',
      theme.colors.sidebarActiveText
    )
    // 状态色
    root.style.setProperty('--success', theme.colors.success)
    root.style.setProperty('--warning', theme.colors.warning)
    root.style.setProperty('--danger', theme.colors.danger)
    root.style.setProperty('--priority-high', theme.colors.priorityHigh)
    root.style.setProperty('--priority-medium', theme.colors.priorityMedium)
    root.style.setProperty('--priority-low', theme.colors.priorityLow)
    // 圆角
    root.style.setProperty('--radius-small', theme.borderRadius.small)
    root.style.setProperty('--radius-medium', theme.borderRadius.medium)
    root.style.setProperty('--radius-large', theme.borderRadius.large)
    // 阴影
    root.style.setProperty('--shadow-small', theme.shadow.small)
    root.style.setProperty('--shadow-medium', theme.shadow.medium)
    root.style.setProperty('--shadow-large', theme.shadow.large)
    // 字体
    root.style.setProperty('--font-primary', theme.font.primary)
    root.style.setProperty('--font-secondary', theme.font.secondary)
    root.style.setProperty('--font-heading', theme.font.heading)
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
