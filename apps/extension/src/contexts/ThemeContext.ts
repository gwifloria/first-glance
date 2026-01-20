import { createContext } from 'react'
import type { Theme, ThemeType } from '@/themes'

export interface ThemeContextValue {
  theme: Theme
  themeType: ThemeType
  setThemeType: (type: ThemeType) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
