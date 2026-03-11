/**
 * Token 刷新服务
 * 负责检测和自动刷新 OAuth token
 */
import {
  didaConfig,
  ticktickConfig,
  type DidaCompatProviderConfig,
} from '@/services/didaCompatConfig'

/** 根据 adapter_type 获取对应的配置 */
function getConfigForProvider(
  adapterType: string
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
 * 检查并刷新 token（如果即将过期）
 */
export async function refreshTokenIfNeeded(): Promise<void> {
  try {
    // 批量读取 adapter 类型和 token
    const { adapter_type: adapterType, auth_token: token } =
      await chrome.storage.local.get(['adapter_type', 'auth_token'])

    const config = getConfigForProvider(adapterType)

    // 非滴答清单/TickTick 类型（如 todoist），不需要刷新
    if (!config) return

    if (!token?.expires_at || !token?.refresh_token) {
      return
    }

    // 如果 token 将在 10 分钟内过期，尝试刷新
    const tenMinutes = 10 * 60 * 1000
    if (Date.now() <= token.expires_at - tenMinutes) {
      return
    }

    console.log('[Background] Token 即将过期，开始刷新')

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
      }),
    })

    if (!response.ok) {
      console.error(`[Background] Token 刷新失败: ${response.status}`)
      // Token 无效，清除存储
      await chrome.storage.local.remove('auth_token')
      return
    }

    // 解析响应 JSON
    let newToken
    try {
      newToken = await response.json()
    } catch {
      console.error('[Background] Token 响应解析失败')
      return
    }

    // 验证响应格式
    if (!newToken?.access_token || !newToken?.expires_in) {
      console.error('[Background] Token 响应格式无效:', newToken)
      return
    }

    // 计算过期时间
    newToken.expires_at = Date.now() + newToken.expires_in * 1000
    await chrome.storage.local.set({ auth_token: newToken })
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
