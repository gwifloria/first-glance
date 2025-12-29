import type { ThemeType } from '@/themes'

export const THEME_OPTIONS: { type: ThemeType; color: string; name: string }[] =
  [
    { type: 'journal', color: '#E8E4DF', name: '手帐' },
    { type: 'rose', color: '#F5F0ED', name: '玫瑰' },
    { type: 'ocean', color: '#D8E3E8', name: '海洋' },
    { type: 'tech', color: '#1C1C1E', name: '暗黑' },
  ]
