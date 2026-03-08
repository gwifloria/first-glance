import type { AIConfig } from './buddy'
import type { NotificationSound } from '@/services/soundEngine'

/**
 * 应用设置
 * 存储在 chrome.storage.sync，支持跨设备同步
 */
export interface AppSettings {
  /** 默认清单 ID，null 表示使用收集箱 */
  defaultProjectId: string | null
  /** 被屏蔽的网站域名列表 */
  blockedSites: string[]
  /** AI 助手配置 */
  aiConfig?: AIConfig
  /** 番茄钟提示音 */
  notificationSound: NotificationSound
  /** 番茄钟工作时长（分钟） */
  workDuration: number
  /** 番茄钟休息时长（分钟） */
  breakDuration: number
}

/**
 * 默认设置
 */
export const defaultSettings: AppSettings = {
  defaultProjectId: null,
  blockedSites: [],
  aiConfig: undefined,
  notificationSound: 'bell',
  workDuration: 25,
  breakDuration: 5,
}
