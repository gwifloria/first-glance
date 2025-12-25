import type { Theme } from './index'

export const techTheme: Theme = {
  name: '科技现代',
  colors: {
    bgPrimary: '#0F0F13', // 深空黑
    bgSecondary: '#1A1A23', // 深灰
    bgCard: 'rgba(255, 255, 255, 0.05)', // 玻璃效果
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    accent: '#6366F1', // 靛蓝
    accentLight: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(255, 255, 255, 0.1)',
    success: '#10B981', // 翠绿
    warning: '#F59E0B', // 琥珀
    danger: '#EF4444', // 红色
    priorityHigh: '#EF4444',
    priorityMedium: '#F59E0B',
    priorityLow: '#10B981',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
  shadow: {
    small: '0 2px 8px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.4)',
    large: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  font: {
    primary: '"SF Mono", "Fira Code", "JetBrains Mono", monospace',
    secondary: '"Inter", "SF Pro Display", -apple-system, sans-serif',
  },
}
