import type { Theme } from './index'

export const journalTheme: Theme = {
  name: '日系手帐',
  colors: {
    bgPrimary: '#FDF8F3', // 温暖奶油色
    bgSecondary: '#F5EDE4', // 浅米色
    bgCard: '#FFFFFF',
    textPrimary: '#5D4E4E', // 深棕色
    textSecondary: '#9B8B8B', // 浅棕色
    accent: '#E8A0A0', // 樱花粉
    accentLight: '#FCE8E8',
    border: '#E8DDD4',
    success: '#A8D5A2', // 抹茶绿
    warning: '#F5D6A8', // 奶茶色
    danger: '#E8A0A0',
    priorityHigh: '#E8A0A0', // 樱花粉
    priorityMedium: '#F5D6A8', // 奶茶色
    priorityLow: '#A8D5A2', // 抹茶绿
  },
  borderRadius: {
    small: '8px',
    medium: '16px',
    large: '24px',
  },
  shadow: {
    small: '0 2px 8px rgba(93, 78, 78, 0.08)',
    medium: '0 4px 16px rgba(93, 78, 78, 0.1)',
    large: '0 8px 32px rgba(93, 78, 78, 0.12)',
  },
  font: {
    primary: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    secondary: '"Noto Serif SC", "STSong", serif',
  },
}
