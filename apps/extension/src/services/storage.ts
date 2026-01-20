import type { AuthToken } from '@/types'

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  CACHED_TASKS: 'cached_tasks',
  CACHED_PROJECTS: 'cached_projects',
  LAST_SYNC: 'last_sync',
  LOCAL_TASKS: 'local_tasks', // Guest mode local tasks
  POMODORO: 'pomodoro', // Pomodoro timer state
} as const

// 番茄时钟存储结构
export interface PomodoroStorage {
  mode: 'idle' | 'work' | 'break'
  isRunning: boolean
  completedCount: number
  startTime: number | null // 当前阶段开始的时间戳
  pausedTimeLeft: number | null // 暂停时的剩余秒数
  lastNotificationTime: number | null // 上次播放提示音的时间戳（防止多 tab 重复播放）
  config: {
    workDuration: number // 分钟
    breakDuration: number // 分钟
  }
}

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

  /**
   * 检查缓存是否有效（未过期）
   * @param maxAge 最大有效期（毫秒），默认 5 分钟
   */
  async isCacheValid(maxAge = 5 * 60 * 1000): Promise<boolean> {
    const lastSync = await this.getLastSync()
    if (!lastSync) return false
    return Date.now() - lastSync < maxAge
  },

  // 番茄时钟相关
  async getPomodoro(): Promise<PomodoroStorage | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.POMODORO)
    return result[STORAGE_KEYS.POMODORO] || null
  },

  async setPomodoro(state: PomodoroStorage): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.POMODORO]: state })
  },

  async clearPomodoro(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.POMODORO)
  },

  // 监听 storage 变化
  onPomodoroChange(
    callback: (newState: PomodoroStorage | null) => void
  ): () => void {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.POMODORO]) {
        try {
          callback(changes[STORAGE_KEYS.POMODORO].newValue || null)
        } catch (err) {
          console.error('[Storage] Error in pomodoro change callback:', err)
        }
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  },
}
