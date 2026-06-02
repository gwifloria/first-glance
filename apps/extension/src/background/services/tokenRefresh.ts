/**
 * Token 刷新服务
 * 负责检测和自动刷新 OAuth token
 */
import {
  didaConfig,
  ticktickConfig,
  refreshDidaCompatToken,
  type DidaCompatProviderConfig,
} from '@/services/didaCompatConfig'
import { storage } from '@/services/storage'

/** 根据 adapter_type 获取对应的配置 */
function getConfigForProvider(
  adapterType: string | null
): DidaCompatProviderConfig | null {
  switch (adapterType) {
    case 'didaList':
      return didaConfig
    case 'ticktick':
      return ticktickConfig
    default:
      return null
  }
}

/**
 * 检查并刷新 token（如果即将过期）。
 * 与前台 auth.ts 共用 refreshDidaCompatToken + storage 封装，避免两套刷新逻辑漂移。
 */
export async function refreshTokenIfNeeded(): Promise<void> {
  try {
    const config = getConfigForProvider(await storage.getAdapterType())
    // 非滴答清单/TickTick 类型（如 todoist），不需要刷新
    if (!config) return

    const token = await storage.getToken()
    if (!token?.expires_at || !token?.refresh_token) return

    // 仅在 token 将于 10 分钟内过期时刷新
    const tenMinutes = 10 * 60 * 1000
    if (Date.now() <= token.expires_at - tenMinutes) return

    console.log('[Background] Token 即将过期，开始刷新')
    const newToken = await refreshDidaCompatToken(config, token.refresh_token)
    if (!newToken) {
      console.error('[Background] Token 刷新失败，清除本地 token')
      await storage.clearToken()
      return
    }
    await storage.setToken(newToken)
    console.log('[Background] Token 刷新成功')
  } catch (err) {
    console.error('[Background] Token 刷新异常:', err)
  }
}

/**
 * 初始化 Token 刷新定时器（每 30 分钟检查一次）
 */
export function initTokenRefreshAlarm(): void {
  chrome.alarms.create('refreshToken', { periodInMinutes: 30 })
}
