import type { ThemeType } from '@/themes'

export interface ThemeOption {
  type: ThemeType
  color: string
  name: string
  premium?: boolean
}

export const THEME_OPTIONS: ThemeOption[] = [
  { type: 'cream', color: '#f9f5eb', name: '奶油' },
  { type: 'milk', color: '#ffffff', name: '椰奶' },
  { type: 'beige', color: '#dce3dd', name: '米灰' },
  { type: 'pink', color: '#ebdcd9', name: '玫瑰' },
  { type: 'blue', color: '#ced8df', name: '海洋' },
  { type: 'dark', color: '#18181b', name: '暗黑' },
  { type: 'twilight', color: '#2C3E50', name: '暮色' },
]
