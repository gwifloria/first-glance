/**
 * 滴答清单/TickTick 兼容配置
 * 两者使用相同的 API 格式，仅域名和凭证不同
 */

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
