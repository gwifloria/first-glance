/**
 * 全应用 chrome.storage key 的单一登记表。
 *
 * 前台、background 与各 service 都从这里取 key，避免同一字面量在多处独立硬编码
 * 而漂移（如 app_settings 同时被屏蔽规则与设置/主题读取、chill_mode 跨进程读写）。
 *
 * 注：更进一步的「typed storage entry 帮手」按需分批迁移，本文件先收口 key 字面量。
 */
export const STORAGE_KEYS = {
  // 认证 / 适配器
  AUTH_TOKEN: 'auth_token',
  TODOIST_TOKEN: 'todoist_auth_token',
  ADAPTER_TYPE: 'adapter_type',
  // 任务缓存
  CACHED_TASKS: 'cached_tasks',
  CACHED_PROJECTS: 'cached_projects',
  LAST_SYNC: 'last_sync',
  LOCAL_TASKS: 'local_tasks', // 游客模式本地任务
  // 番茄钟
  POMODORO: 'pomodoro',
  // 设置（app_settings 也被 background 屏蔽规则、主题迁移读取）
  APP_SETTINGS: 'app_settings',
  // 主题（存于 chrome.storage.sync）
  APP_THEME: 'app_theme',
  // 休息模式（background 写、前台读，跨进程）
  CHILL_MODE: 'chill_mode',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
