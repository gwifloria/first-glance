const PREMIUM_KEY = 'premium_status'
const DEV_OVERRIDE_KEY = 'dev_premium_override'
const IS_DEV_BUILD = import.meta.env.MODE === 'development'

export interface PremiumStatus {
  isActivated: boolean
  licenseKey: string | null
  activatedAt: number | null
  instanceId: string | null
}

const DEFAULT_STATUS: PremiumStatus = {
  isActivated: false,
  licenseKey: null,
  activatedAt: null,
  instanceId: null,
}

/**
 * dev 模式下的 Premium 开关（仅 dev build 生效）：
 * - 默认 true，保留"开发即解锁"的便利
 * - 用户可在 SettingsPanel 切到 false，用于测试非会员 UI
 * - 模块加载时异步 hydrate；后续 storage 变化由 subscribePremium 统一处理
 * 生产 build 下 IS_DEV_BUILD = false，整段逻辑被 tree-shaken
 */
let devOverride = true

if (IS_DEV_BUILD) {
  chrome.storage.local.get(DEV_OVERRIDE_KEY).then((r) => {
    const v = r[DEV_OVERRIDE_KEY]
    if (typeof v === 'boolean') devOverride = v
  })
}

function isDevPremium(): boolean {
  return IS_DEV_BUILD && devOverride
}

function applyDevFallback(status: PremiumStatus): PremiumStatus {
  if (isDevPremium() && !status.isActivated) {
    return { ...status, isActivated: true }
  }
  return status
}

export function isDevBuild(): boolean {
  return IS_DEV_BUILD
}

export function getDevPremiumOverride(): boolean {
  return devOverride
}

export async function setDevPremiumOverride(enabled: boolean): Promise<void> {
  if (!IS_DEV_BUILD) return
  devOverride = enabled
  await chrome.storage.local.set({ [DEV_OVERRIDE_KEY]: enabled })
}

interface LemonSqueezyResponse {
  activated: boolean
  valid?: boolean
  error?: string
  license_key?: {
    id: number
    status: string
    key: string
    activation_limit: number
    activation_usage: number
  }
  instance?: {
    id: string
  }
  meta?: {
    store_id: number
    product_id: number
  }
}

/**
 * 激活 LemonSqueezy license key（消耗一个激活名额）
 */
export async function activateLicense(key: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const instanceName = `first-glance-${await getBrowserId()}`
    const response = await fetch(
      'https://api.lemonsqueezy.com/v1/licenses/activate',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          license_key: key,
          instance_name: instanceName,
        }),
      }
    )

    const data: LemonSqueezyResponse = await response.json()

    if (!data.activated) {
      return { success: false, error: data.error || 'activation_failed' }
    }

    const status: PremiumStatus = {
      isActivated: true,
      licenseKey: key,
      activatedAt: Date.now(),
      instanceId: data.instance?.id ?? null,
    }

    await chrome.storage.sync.set({ [PREMIUM_KEY]: status })
    return { success: true }
  } catch {
    return { success: false, error: 'network_error' }
  }
}

/**
 * 获取 Premium 状态
 */
export async function getPremiumStatus(): Promise<PremiumStatus> {
  const result = await chrome.storage.sync.get(PREMIUM_KEY)
  const status: PremiumStatus = result[PREMIUM_KEY] ?? DEFAULT_STATUS
  return applyDevFallback(status)
}

/**
 * 快速判断是否 Premium
 */
export async function isPremium(): Promise<boolean> {
  if (isDevPremium()) return true
  const status = await getPremiumStatus()
  return status.isActivated
}

/**
 * 停用 license
 */
export async function deactivateLicense(): Promise<void> {
  const status = await getPremiumStatus()

  // 尝试远程停用
  if (status.licenseKey && status.instanceId) {
    try {
      await fetch('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          license_key: status.licenseKey,
          instance_id: status.instanceId,
        }),
      })
    } catch {
      // 即使远程停用失败，也继续清除本地状态
    }
  }

  await chrome.storage.sync.set({ [PREMIUM_KEY]: DEFAULT_STATUS })
}

/**
 * 订阅 Premium 状态变化
 */
export function subscribePremium(
  callback: (status: PremiumStatus) => void
): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName === 'sync' && PREMIUM_KEY in changes) {
      const next: PremiumStatus =
        changes[PREMIUM_KEY].newValue ?? DEFAULT_STATUS
      callback(applyDevFallback(next))
      return
    }
    if (IS_DEV_BUILD && areaName === 'local' && DEV_OVERRIDE_KEY in changes) {
      const v = changes[DEV_OVERRIDE_KEY].newValue
      devOverride = typeof v === 'boolean' ? v : true
      // dev override 变化时重派当前状态
      getPremiumStatus().then(callback)
    }
  }
  chrome.storage.onChanged.addListener(handler)
  return () => chrome.storage.onChanged.removeListener(handler)
}

const BROWSER_ID_KEY = 'browser_instance_id'

/**
 * 获取持久化的浏览器标识（用于 instance_name）
 * 首次生成后存储到 chrome.storage.local，后续复用同一 ID
 */
async function getBrowserId(): Promise<string> {
  const result = await chrome.storage.local.get(BROWSER_ID_KEY)
  if (result[BROWSER_ID_KEY]) {
    return result[BROWSER_ID_KEY]
  }
  const id = `${navigator.userAgent.slice(0, 20)}-${Date.now().toString(36)}`
  await chrome.storage.local.set({ [BROWSER_ID_KEY]: id })
  return id
}
