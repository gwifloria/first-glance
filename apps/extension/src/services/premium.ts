const PREMIUM_KEY = 'premium_status'

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

interface LemonSqueezyValidateResponse {
  valid: boolean
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
 * 验证 LemonSqueezy license key
 */
export async function validateLicense(
  key: string
): Promise<{ success: boolean; error?: string; instanceId?: string }> {
  try {
    const response = await fetch(
      'https://api.lemonsqueezy.com/v1/licenses/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: key,
          instance_name: `first-glance-${await getBrowserId()}`,
        }),
      }
    )

    const data: LemonSqueezyValidateResponse = await response.json()

    if (!data.valid) {
      return { success: false, error: data.error || 'invalid_key' }
    }

    return {
      success: true,
      instanceId: data.instance?.id ?? undefined,
    }
  } catch {
    return { success: false, error: 'network_error' }
  }
}

/**
 * 激活 license 并存储状态
 */
export async function activateLicense(key: string): Promise<{
  success: boolean
  error?: string
}> {
  const result = await validateLicense(key)
  if (!result.success) {
    return { success: false, error: result.error }
  }

  const status: PremiumStatus = {
    isActivated: true,
    licenseKey: key,
    activatedAt: Date.now(),
    instanceId: result.instanceId ?? null,
  }

  await chrome.storage.sync.set({ [PREMIUM_KEY]: status })
  return { success: true }
}

/**
 * 获取 Premium 状态
 */
export async function getPremiumStatus(): Promise<PremiumStatus> {
  const result = await chrome.storage.sync.get(PREMIUM_KEY)
  return result[PREMIUM_KEY] ?? DEFAULT_STATUS
}

/**
 * 快速判断是否 Premium
 */
export async function isPremium(): Promise<boolean> {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
    if (areaName !== 'sync') return
    if (PREMIUM_KEY in changes) {
      callback(changes[PREMIUM_KEY].newValue ?? DEFAULT_STATUS)
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
