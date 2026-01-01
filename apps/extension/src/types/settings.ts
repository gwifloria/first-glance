import type { ThemeType } from '@/themes'

/**
 * 应用设置
 * 存储在 chrome.storage.sync，支持跨设备同步
 */
export interface AppSettings {
  /** 默认清单 ID，null 表示使用收集箱 */
  defaultProjectId: string | null
  /** 主题类型 */
  theme: ThemeType
}

/**
 * 默认设置
 */
export const defaultSettings: AppSettings = {
  defaultProjectId: null,
  theme: 'pink',
}
