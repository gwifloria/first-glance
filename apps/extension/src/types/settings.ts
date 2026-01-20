/**
 * 应用设置
 * 存储在 chrome.storage.sync，支持跨设备同步
 */
export interface AppSettings {
  /** 默认清单 ID，null 表示使用收集箱 */
  defaultProjectId: string | null
  /** 被屏蔽的网站域名列表 */
  blockedSites: string[]
}

/**
 * 默认设置
 */
export const defaultSettings: AppSettings = {
  defaultProjectId: null,
  blockedSites: [],
}
