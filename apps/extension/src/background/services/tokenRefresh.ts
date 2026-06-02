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
    const result = await refreshDidaCompatToken(config, token.refresh_token)
    if (!result.ok) {
      if (result.reason === 'invalid') {
        // 跨上下文兜底：若 storage 里的 refresh_token 已变，说明前台已并发刷新成功，
        // 本次 400 只是用了旧 token，不清，避免把刚刷新好的登录态误登出。
        const latest = await storage.getToken()
        if (
          latest?.refresh_token &&
          latest.refresh_token !== token.refresh_token
        ) {
          console.warn('[Background] refresh_token 已被并发刷新轮换，跳过清除')
          return
        }
        console.error('[Background] refresh_token 已失效，清除本地 token')
        await storage.clearToken()
      } else {
        // 网络/临时故障：保留 token，等下次定时任务重试，不登出
        console.warn('[Background] Token 刷新临时失败（网络），保留 token')
      }
      return
    }
    await storage.setToken(result.token)
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
