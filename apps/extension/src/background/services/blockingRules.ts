/**
 * 网站屏蔽规则服务
 * 管理 declarativeNetRequest 动态规则
 */

import type { AppSettings } from '@/types/settings'
import { isChillModeActive } from './chillMode'

const SETTINGS_KEY = 'app_settings'
const RULE_ID_BASE = 1000
const FOCUS_LOCK_RULE_ID = 999
const BLOCKED_PAGE_PATH = '/src/newtab/index.html?blocked=1'

/**
 * 加载设置并应用屏蔽规则
 */
export async function loadAndApplyBlockingRules(): Promise<void> {
  try {
    if (await isChillModeActive()) {
      console.log('[Background] 休息模式中，跳过屏蔽规则')
      return
    }

    const [syncResult, localResult] = await Promise.all([
      chrome.storage.sync.get(SETTINGS_KEY),
      chrome.storage.local.get('focus_lock'),
    ])
    const settings = syncResult[SETTINGS_KEY] as AppSettings | undefined
    const blockedSites = settings?.blockedSites || []
    const focusLock = !!localResult.focus_lock
    await updateBlockingRules(blockedSites, focusLock)
  } catch (err) {
    console.error('[Background] 加载屏蔽规则失败:', err)
  }
}

/**
 * 更新屏蔽规则
 */
export async function updateBlockingRules(
  blockedSites: string[],
  focusLock = false
): Promise<void> {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
    const removeRuleIds = existingRules.map((r) => r.id)

    const addRules: chrome.declarativeNetRequest.Rule[] = []

    if (focusLock) {
      addRules.push({
        id: FOCUS_LOCK_RULE_ID,
        priority: 2,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: { extensionPath: BLOCKED_PAGE_PATH },
        },
        condition: {
          urlFilter: '|http',
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      })
    }

    // urlFilter: || 匹配域名开始（含子域名），^ 匹配分隔符
    blockedSites.forEach((domain, i) => {
      addRules.push({
        id: RULE_ID_BASE + i,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: { extensionPath: BLOCKED_PAGE_PATH },
        },
        condition: {
          urlFilter: `||${domain}^`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      })
    })

    if (addRules.length === 0 && removeRuleIds.length === 0) return

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    })
  } catch (err) {
    console.error('[Blocksite] Failed to update rules:', err)
  }
}

/**
 * 清除所有屏蔽规则
 */
export async function clearBlockingRules(): Promise<void> {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
  const removeRuleIds = existingRules.map((r) => r.id)
  if (removeRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds })
  }
}

/**
 * 获取设置变化处理函数
 * settings 变化时调用 callback，focus_lock 由调用方单独监听
 */
export function createSettingsChangeHandler(
  callback: () => void
): (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void {
  return (changes, areaName) => {
    if (areaName === 'sync' && changes[SETTINGS_KEY]?.newValue) {
      callback()
    }
  }
}
