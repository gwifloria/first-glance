export interface Theme {
  name: string
  type: 'journal' | 'modern'
  isDark?: boolean
  colors: {
    bgPrimary: string
    bgSecondary: string
    bgSidebar: string
    bgContent: string
    bgFrame?: string
    bgCard: string
    textPrimary: string
    textSecondary: string
    textOnCard?: string
    textSecondaryOnCard?: string
    borderOnCard?: string
    bgSecondaryOnCard?: string
    accent: string
    accentLight: string
    border: string
    // 时钟颜色
    clockPrimary: string
    clockSecondary: string
    // 侧边栏颜色
    sidebarText: string
    sidebarHover: string
    sidebarActive: string
    sidebarActiveText: string
    // 状态颜色
    success: string
    warning: string
    danger: string
    priorityHigh: string
    priorityMedium: string
    priorityLow: string
    // 番茄时钟颜色
    pomodoroWork: string
    pomodoroBreak: string
    focusGradient?: string // FOCUS 按钮流动环颜色，默认用 accent
    // BlockedPage 颜色
    blockedBubbleBg: string
    blockedBubbleText: string
    blockedPulseBg: string
    blockedWarningBg: string
    blockedChillBg: string
    blockedChillText: string
    blockedChillHoldBg: string
    blockedChillHoldText: string
  }
  borderRadius: {
    small: string
    medium: string
    large: string
  }
  shadow: {
    small: string
    medium: string
    large: string
  }
  font: {
    primary: string
    secondary: string
    heading: string
    hand?: string // .font-hand 类使用的字体，默认 Lora
  }
  // 装饰属性
  showTexture: boolean
  showTape: boolean
  textureStyle?: 'dots' | 'grid' // 默认 dots
}

export type ThemeType =
  | 'cream'
  | 'milk'
  | 'beige'
  | 'pink'
  | 'blue'
  | 'dark'
  | 'twilight'

export { creamTheme } from './cream'
export { milkTheme } from './milk'
export { beigeTheme } from './beige'
export { pinkTheme } from './pink'
export { blueTheme } from './blue'
export { darkTheme } from './dark'
export { twilightTheme } from './twilight'
