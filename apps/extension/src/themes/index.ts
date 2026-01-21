export interface BlockedPageStyles {
  text: string
  textSecondary: string
  bubbleBg: string
  bubbleTail: string
  buttonBase: string
  buttonFill: string
  buttonHoverText: string
  pulseBg: string
  warningBg: string
  chillButtonDefault: string
  chillButtonHolding: string
}

export interface Theme {
  name: string
  type: 'journal' | 'modern'
  blockedPage: BlockedPageStyles
  colors: {
    bgPrimary: string
    bgSecondary: string
    bgSidebar: string
    bgContent: string
    bgCard: string
    textPrimary: string
    textSecondary: string
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
  }
  // 装饰属性
  showTexture: boolean
  showTape: boolean
}

export type ThemeType = 'milk' | 'beige' | 'pink' | 'blue' | 'dark'

export { milkTheme } from './milk'
export { beigeTheme } from './beige'
export { pinkTheme } from './pink'
export { blueTheme } from './blue'
export { darkTheme } from './dark'
