import { defaultSettings, type AppSettings } from '@/types/settings'

const STORAGE_KEY = 'app_settings'
const VERSION_KEY = 'settings_version'
const CURRENT_VERSION = 4

// 旧版存储键（用于迁移）
const LEGACY_SETTINGS_KEY = 'user_settings'

/**
 * 获取设置
 */
export async function getSettings(): Promise<AppSettings> {
  // 先检查是否需要从旧版迁移
  await migrateLegacySettings()

  const result = await chrome.storage.sync.get([STORAGE_KEY, VERSION_KEY])
  await migrateIfNeeded(result)
  return { ...defaultSettings, ...result[STORAGE_KEY] }
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
export function subscribeSettings(
  callback: (settings: AppSettings) => void
): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    // 只处理 sync 区域的变化
    if (areaName !== 'sync') return
    if (STORAGE_KEY in changes) {
      callback({ ...defaultSettings, ...changes[STORAGE_KEY].newValue })
    }
  }
  chrome.storage.onChanged.addListener(handler)
  return () => chrome.storage.onChanged.removeListener(handler)
}

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
}
