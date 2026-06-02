/**
 * 滴答清单/TickTick 兼容配置
 * 两者使用相同的 API 格式，仅域名和凭证不同
 */
import type { AuthToken } from '@/types'

export interface DidaCompatProviderConfig {
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  apiBase: string
}

export const didaConfig: DidaCompatProviderConfig = {
  clientId: import.meta.env.VITE_DIDA_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_DIDA_CLIENT_SECRET || '',
  authUrl: 'https://dida365.com/oauth/authorize',
  tokenUrl: 'https://dida365.com/oauth/token',
  apiBase: 'https://api.dida365.com/open/v1',
}

export const ticktickConfig: DidaCompatProviderConfig = {
  clientId: import.meta.env.VITE_TICKTICK_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_TICKTICK_CLIENT_SECRET || '',
  authUrl: 'https://ticktick.com/oauth/authorize',
  tokenUrl: 'https://ticktick.com/oauth/token',
  apiBase: 'https://api.ticktick.com/open/v1',
}

export function isDidaCompatConfigured(cfg: DidaCompatProviderConfig): boolean {
  return Boolean(cfg.clientId && cfg.clientSecret)
}

/**
 * 用 refresh_token 换取新 AuthToken（纯网络逻辑，不碰存储/事件，前台与 background 共用）。
 * 成功返回原始 token（expires_at 统一由 storage.setToken 盖）；
 * 网络异常 / 响应非 2xx / 缺 access_token|expires_in 一律返回 null，由调用方决定清 token。
 */
export async function refreshDidaCompatToken(
  config: DidaCompatProviderConfig,
  refreshToken: string
): Promise<AuthToken | null> {
  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })
    if (!response.ok) return null
    const token = (await response.json().catch(() => null)) as AuthToken | null
    if (!token?.access_token || typeof token.expires_in !== 'number') {
      return null
    }
    return token
  } catch {
    return null
  }
}
