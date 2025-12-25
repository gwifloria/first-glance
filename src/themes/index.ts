export interface Theme {
  name: string
  colors: {
    bgPrimary: string
    bgSecondary: string
    bgCard: string
    textPrimary: string
    textSecondary: string
    accent: string
    accentLight: string
    border: string
    success: string
    warning: string
    danger: string
    priorityHigh: string
    priorityMedium: string
    priorityLow: string
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
  }
}

export type ThemeType = 'journal' | 'tech'

export { journalTheme } from './journal'
export { techTheme } from './tech'
