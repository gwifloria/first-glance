import type { ThemeType } from '@/themes'
import { createStorageSubscriber } from './storageSubscriber'

const THEME_KEY = 'app_theme'
const DEFAULT_THEME: ThemeType = 'cream'

// 旧主题名 -> 新主题名映射
const THEME_MIGRATION: Record<string, ThemeType> = {
  journal: 'beige',
  ocean: 'blue',
  tech: 'dark',
  rose: 'milk',
}

// 旧版存储键（用于迁移）
const LEGACY_SETTINGS_KEY = 'app_settings'
const LEGACY_THEME_KEY = 'theme_preference'
const LEGACY_USER_SETTINGS_KEY = 'user_settings'

/**
 * 解析主题类型，处理旧主题名迁移
 */
function resolveTheme(raw: unknown): ThemeType {
  if (typeof raw !== 'string') return DEFAULT_THEME

  if (raw in THEME_MIGRATION) {
    return THEME_MIGRATION[raw]
  }

  const validThemes: ThemeType[] = [
    'cream',
    'milk',
    'beige',
    'pink',
    'blue',
    'dark',
    'twilight',
  ]
  if (validThemes.includes(raw as ThemeType)) {
    return raw as ThemeType
  }

  return DEFAULT_THEME
}

/**
 * 从旧版存储迁移主题
 */
async function migrateIfNeeded(): Promise<void> {
  // 检查是否已有新版数据
  const result = await chrome.storage.sync.get(THEME_KEY)
  if (result[THEME_KEY]) return

  // 尝试从 app_settings 迁移
  const settingsResult = await chrome.storage.sync.get(LEGACY_SETTINGS_KEY)
  const settings = settingsResult[LEGACY_SETTINGS_KEY] as
    | { theme?: string }
    | undefined

  if (settings?.theme) {
    await chrome.storage.sync.set({
      [THEME_KEY]: resolveTheme(settings.theme),
    })
    return
  }

  // 尝试从 local storage 的旧版迁移
  const localResult = await chrome.storage.local.get([
    LEGACY_THEME_KEY,
    LEGACY_USER_SETTINGS_KEY,
  ])

  const legacyTheme = localResult[LEGACY_THEME_KEY] as string | undefined
  if (legacyTheme) {
    await chrome.storage.sync.set({
      [THEME_KEY]: resolveTheme(legacyTheme),
    })
    await chrome.storage.local.remove(LEGACY_THEME_KEY)
  }
}

/**
 * 获取主题
 */
export async function getTheme(): Promise<ThemeType> {
  await migrateIfNeeded()
  const result = await chrome.storage.sync.get(THEME_KEY)
  return resolveTheme(result[THEME_KEY])
}

/**
 * 设置主题
 */
export async function setTheme(theme: ThemeType): Promise<void> {
  await chrome.storage.sync.set({ [THEME_KEY]: theme })
}

/**
 * 订阅主题变化
 */
export const subscribeTheme = createStorageSubscriber(
  'sync',
  THEME_KEY,
  resolveTheme
)
