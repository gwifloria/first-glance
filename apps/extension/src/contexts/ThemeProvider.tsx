import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  type Theme,
  type ThemeType,
  milkTheme,
  beigeTheme,
  pinkTheme,
  blueTheme,
  darkTheme,
  twilightTheme,
} from '@/themes'
import { getTheme, setTheme, subscribeTheme } from '@/services/themeStorage'
import { contrastText } from '@/utils/color'
import { ThemeContext } from './ThemeContext'

const themes: Record<ThemeType, Theme> = {
  milk: milkTheme,
  beige: beigeTheme,
  pink: pinkTheme,
  blue: blueTheme,
  dark: darkTheme,
  twilight: twilightTheme,
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeType, setThemeTypeState] = useState<ThemeType>('pink')

  // 初始加载
  useEffect(() => {
    getTheme().then(setThemeTypeState)
  }, [])

  // 监听 storage 变化
  useEffect(() => {
    return subscribeTheme(setThemeTypeState)
  }, [])

  const setThemeType = useCallback((type: ThemeType) => {
    setTheme(type)
  }, [])

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
    root.style.setProperty(
      '--accent-contrast',
      contrastText(theme.colors.accent)
    )
    root.style.setProperty('--border', theme.colors.border)
    // 时钟色
    root.style.setProperty('--clock-primary', theme.colors.clockPrimary)
    root.style.setProperty('--clock-secondary', theme.colors.clockSecondary)
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
    // 番茄时钟色
    root.style.setProperty('--pomodoro-work', theme.colors.pomodoroWork)
    root.style.setProperty('--pomodoro-break', theme.colors.pomodoroBreak)
    // BlockedPage
    root.style.setProperty('--blocked-bubble-bg', theme.colors.blockedBubbleBg)
    root.style.setProperty(
      '--blocked-bubble-text',
      theme.colors.blockedBubbleText
    )
    root.style.setProperty('--blocked-pulse-bg', theme.colors.blockedPulseBg)
    root.style.setProperty(
      '--blocked-warning-bg',
      theme.colors.blockedWarningBg
    )
    root.style.setProperty('--blocked-chill-bg', theme.colors.blockedChillBg)
    root.style.setProperty(
      '--blocked-chill-text',
      theme.colors.blockedChillText
    )
    root.style.setProperty(
      '--blocked-chill-hold-bg',
      theme.colors.blockedChillHoldBg
    )
    root.style.setProperty(
      '--blocked-chill-hold-text',
      theme.colors.blockedChillHoldText
    )
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

    // 双表面 CSS 变量（深色背景 + 浅色卡片的主题）
    if (theme.colors.textOnCard) {
      root.style.setProperty('--text-on-card', theme.colors.textOnCard)
      root.style.setProperty(
        '--text-on-card-secondary',
        theme.colors.textSecondaryOnCard ?? theme.colors.textSecondary
      )
      root.style.setProperty(
        '--border-on-card',
        theme.colors.borderOnCard ?? theme.colors.border
      )
      root.style.setProperty(
        '--bg-secondary-on-card',
        theme.colors.bgSecondaryOnCard ?? theme.colors.bgSecondary
      )
    } else {
      root.style.removeProperty('--text-on-card')
      root.style.removeProperty('--text-on-card-secondary')
      root.style.removeProperty('--border-on-card')
      root.style.removeProperty('--bg-secondary-on-card')
    }

    // Texture class - 用 CSS 控制纹理显示，避免组件调用 useTheme
    root.classList.toggle('theme-with-texture', theme.showTexture)
    root.classList.toggle('theme-with-tape', theme.showTape)
    root.classList.toggle(
      'theme-dark-texture',
      theme.showTexture && (theme.isDark ?? false)
    )
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{ theme, themeType, setThemeType, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
