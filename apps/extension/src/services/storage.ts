import type { AuthToken } from '@/types'

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  CACHED_TASKS: 'cached_tasks',
  CACHED_PROJECTS: 'cached_projects',
  LAST_SYNC: 'last_sync',
} as const

export const storage = {
  async getToken(): Promise<AuthToken | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN)
    return result[STORAGE_KEYS.AUTH_TOKEN] || null
  },

  async setToken(token: AuthToken): Promise<void> {
    const tokenWithExpiry = {
      ...token,
      expires_at: Date.now() + token.expires_in * 1000,
    }
    await chrome.storage.local.set({
      [STORAGE_KEYS.AUTH_TOKEN]: tokenWithExpiry,
    })
  },

  async clearToken(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN)
  },

  async isTokenValid(): Promise<boolean> {
    const token = await this.getToken()
    if (!token || !token.expires_at) return false
    return Date.now() < token.expires_at - 60000 // 提前1分钟过期
  },

  async getCachedTasks<T>(): Promise<T | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHED_TASKS)
    return result[STORAGE_KEYS.CACHED_TASKS] || null
  },

  async setCachedTasks<T>(tasks: T): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.CACHED_TASKS]: tasks,
      [STORAGE_KEYS.LAST_SYNC]: Date.now(),
    })
  },

  async getCachedProjects<T>(): Promise<T | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHED_PROJECTS)
    return result[STORAGE_KEYS.CACHED_PROJECTS] || null
  },

  async setCachedProjects<T>(projects: T): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.CACHED_PROJECTS]: projects })
  },

  async getLastSync(): Promise<number | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_SYNC)
    return result[STORAGE_KEYS.LAST_SYNC] || null
  },
}
