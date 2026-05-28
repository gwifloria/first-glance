import { defaultSettings, type AppSettings } from '@/types/settings'
import { createStorageSubscriber } from './storageSubscriber'

const STORAGE_KEY = 'app_settings'
const VERSION_KEY = 'settings_version'
const CURRENT_VERSION = 7

// 旧版存储键（用于迁移）
const LEGACY_SETTINGS_KEY = 'user_settings'

/**
 * dev 模式下从环境变量读取 AI Buddy 兜底配置
 * 仅在三项齐全时返回，不写回 storage，避免把 key 同步到云端
 */
function getDevAIConfigFallback(): AppSettings['aiConfig'] {
  // `vite build --watch` 下 import.meta.env.DEV 恒为 false，这里用 MODE 判断
  if (import.meta.env.MODE !== 'development') return undefined
  const baseUrl = import.meta.env.VITE_BUDDY_BASE_URL
  const apiKey = import.meta.env.VITE_BUDDY_API_KEY
  const model = import.meta.env.VITE_BUDDY_MODEL
  if (!baseUrl || !apiKey || !model) return undefined
  return { baseUrl, apiKey, model }
}

/**
 * 获取设置
 */
export async function getSettings(): Promise<AppSettings> {
  // 先检查是否需要从旧版迁移
  await migrateLegacySettings()

  const result = await chrome.storage.sync.get([STORAGE_KEY, VERSION_KEY])
  await migrateIfNeeded(result)
  const merged = { ...defaultSettings, ...result[STORAGE_KEY] }
  if (!merged.aiConfig) {
    const fallback = getDevAIConfigFallback()
    if (fallback) merged.aiConfig = fallback
  }
  return merged
}

/**
 * 从旧版 local 存储迁移到新版 sync 存储
 */
async function migrateLegacySettings(): Promise<void> {
  // 检查是否已迁移过
  const syncResult = await chrome.storage.sync.get(STORAGE_KEY)
  if (syncResult[STORAGE_KEY]) {
    // 已有新版数据，清理旧版
    await chrome.storage.local.remove([LEGACY_SETTINGS_KEY])
    return
  }

  // 读取旧版数据
  const localResult = await chrome.storage.local.get([LEGACY_SETTINGS_KEY])

  const legacySettings = localResult[LEGACY_SETTINGS_KEY] as
    | { defaultProjectId?: string | null }
    | undefined

  // 如果有旧版数据，迁移到新版
  if (legacySettings) {
    const migratedSettings: AppSettings = {
      ...defaultSettings,
      defaultProjectId: legacySettings?.defaultProjectId ?? null,
      blockedSites: [],
    }

    await chrome.storage.sync.set({
      [STORAGE_KEY]: migratedSettings,
      [VERSION_KEY]: CURRENT_VERSION,
    })

    // 清理旧版数据
    await chrome.storage.local.remove([LEGACY_SETTINGS_KEY])
  }
}

/**
 * 更新设置（合并更新）
 */
export async function setSettings(
  updates: Partial<AppSettings>
): Promise<void> {
  const current = await getSettings()
  const next = { ...current, ...updates }
  await chrome.storage.sync.set({ [STORAGE_KEY]: next })
}

/**
 * 订阅设置变化
 * 返回取消订阅函数
 */
export const subscribeSettings = createStorageSubscriber<AppSettings>(
  'sync',
  STORAGE_KEY,
  (raw) => ({ ...defaultSettings, ...(raw as Partial<AppSettings>) })
)

/**
 * 版本迁移
 */
async function migrateIfNeeded(result: Record<string, unknown>): Promise<void> {
  const version = (result[VERSION_KEY] as number) || 0

  if (version >= CURRENT_VERSION) return

  // 从存储中获取旧数据
  const oldData = result[STORAGE_KEY] || {}
  let migratedData = { ...oldData }

  // 执行迁移
  for (let v = version; v < CURRENT_VERSION; v++) {
    const migration = migrations[v + 1]
    if (migration) {
      migratedData = migration(migratedData)
    }
  }

  // 保存迁移后的数据和版本号
  await chrome.storage.sync.set({
    [STORAGE_KEY]: migratedData,
    [VERSION_KEY]: CURRENT_VERSION,
  })
}

/**
 * 迁移函数映射
 */
const migrations: Record<number, (data: unknown) => Record<string, unknown>> = {
  // v0 -> v1: 初始版本，确保默认值
  1: (data) => {
    const d = (data || {}) as Record<string, unknown>
    return {
      defaultProjectId: d.defaultProjectId ?? null,
      theme: d.theme ?? 'journal',
    }
  },
  // v1 -> v2: 主题名迁移 (journal/ocean/tech/rose -> milk/beige/pink/blue/dark)
  2: (data) => {
    const d = (data || {}) as Record<string, unknown>
    const themeMigration: Record<string, string> = {
      journal: 'beige',
      ocean: 'blue',
      tech: 'dark',
      rose: 'milk',
    }
    const oldTheme = d.theme as string
    const newTheme = themeMigration[oldTheme] || oldTheme || 'pink'
    return {
      ...d,
      theme: newTheme,
    }
  },
  // v2 -> v3: 添加 blockedSites 字段
  3: (data) => {
    const d = (data || {}) as Record<string, unknown>
    return {
      ...d,
      blockedSites: d.blockedSites ?? [],
    }
  },
  // v3 -> v4: 移除 theme 字段（已迁移到独立存储）
  4: (data) => {
    const d = (data || {}) as Record<string, unknown>
    return {
      defaultProjectId: d.defaultProjectId ?? null,
      blockedSites: d.blockedSites ?? [],
    }
  },
  // v4 -> v5: 添加 aiConfig 字段
  5: (data) => {
    const d = (data || {}) as Record<string, unknown>
    return {
      ...d,
      aiConfig: d.aiConfig ?? undefined,
    }
  },
  // v5 -> v6: 添加提示音设置
  6: (data) => {
    const d = (data || {}) as Record<string, unknown>
    return {
      ...d,
      notificationSound: d.notificationSound ?? 'bell',
    }
  },
  // v6 -> v7: 添加番茄钟时长设置
  7: (data) => {
    const d = (data || {}) as Record<string, unknown>
    return {
      ...d,
      workDuration: d.workDuration ?? 25,
      breakDuration: d.breakDuration ?? 5,
    }
  },
}
