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
 * 刷新结果。区分两类失败，调用方据此决定是否清 token：
 * - invalid：refresh_token 已失效（400/401），应清 token 登出。
 * - network：网络异常 / 5xx / 响应体异常等临时故障，应保留 token 等下次重试，不能登出。
 */
export type RefreshTokenResult =
  | { ok: true; token: AuthToken }
  | { ok: false; reason: 'invalid' | 'network' }

/**
 * 用 refresh_token 换取新 AuthToken（纯网络逻辑，不碰存储/事件，前台与 background 共用）。
 * 成功返回 token（expires_at 统一由 storage.setToken 盖）；失败按 invalid/network 分类，
 * 避免把网络抖动误判为 refresh_token 失效而把正常登录的用户登出。
 */
export async function refreshDidaCompatToken(
  config: DidaCompatProviderConfig,
  refreshToken: string
): Promise<RefreshTokenResult> {
  let response: Response
  try {
    response = await fetch(config.tokenUrl, {
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
  } catch {
    // fetch 抛错 = 网络层故障（DNS/超时/断网），属临时失败
    return { ok: false, reason: 'network' }
  }

  if (!response.ok) {
    // 仅 400/401 代表 refresh_token 失效；其余（5xx/429 等）当临时故障
    const reason =
      response.status === 400 || response.status === 401 ? 'invalid' : 'network'
    return { ok: false, reason }
  }

  const token = (await response.json().catch(() => null)) as AuthToken | null
  if (!token?.access_token || typeof token.expires_in !== 'number') {
    // 2xx 但响应体异常：更可能是代理/网关问题，保留 token 等重试，不登出
    return { ok: false, reason: 'network' }
  }
  return { ok: true, token }
}
