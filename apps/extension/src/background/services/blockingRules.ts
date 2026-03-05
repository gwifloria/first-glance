/**
 * 网站屏蔽规则服务
 * 管理 declarativeNetRequest 动态规则
 */

import type { AppSettings } from '@/types/settings'
import { isChillModeActive } from './chillMode'

const SETTINGS_KEY = 'app_settings'
// 规则 ID 基础偏移量，避免与其他可能的规则冲突
const RULE_ID_BASE = 1000
// Focus Lock 全站屏蔽规则固定 ID
const FOCUS_LOCK_RULE_ID = 999

/**
 * 加载设置并应用屏蔽规则
 */
export async function loadAndApplyBlockingRules(): Promise<void> {
  try {
    // 如果处于休息模式，不应用屏蔽规则
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
    // 获取当前规则以便清除
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
    const removeRuleIds = existingRules.map((r) => r.id)

    console.log('[Blocksite] Current rules:', existingRules)
    console.log('[Blocksite] Blocked sites from settings:', blockedSites)
    console.log('[Blocksite] Focus Lock:', focusLock)

    const addRules: chrome.declarativeNetRequest.Rule[] = []

    // Focus Lock 全站屏蔽规则（优先级 2，覆盖普通规则）
    if (focusLock) {
      addRules.push({
        id: FOCUS_LOCK_RULE_ID,
        priority: 2,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            extensionPath: '/src/newtab/index.html?blocked=1',
          },
        },
        condition: {
          // |http 匹配所有 http:// 和 https:// 导航
          urlFilter: '|http',
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      })
    }

    // 个别网站屏蔽规则
    // urlFilter 语法：
    // - || 匹配域名开始（包括子域名）
    // - ^ 匹配分隔符（/、?、: 或字符串结尾），确保完整域名匹配
    // 例如 ||xiaohongshu.com^ 会匹配：
    // - https://xiaohongshu.com
    // - https://www.xiaohongshu.com/explore
    // - https://m.xiaohongshu.com
    for (let i = 0; i < blockedSites.length; i++) {
      addRules.push({
        id: RULE_ID_BASE + i,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            extensionPath: '/src/newtab/index.html?blocked=1',
          },
        },
        condition: {
          urlFilter: `||${blockedSites[i]}^`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      })
    }

    if (addRules.length === 0 && removeRuleIds.length === 0) {
      return
    }

    console.log('[Blocksite] Adding rules:', JSON.stringify(addRules, null, 2))

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    })

    // 验证规则已生效
    const newRules = await chrome.declarativeNetRequest.getDynamicRules()
    console.log('[Blocksite] Rules after update:', newRules)
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
 * 设置变化监听器的回调类型
 */
export type SettingsChangeCallback = (
  blockedSites: string[],
  focusLock: boolean
) => void

/**
 * 获取设置变化处理函数
 */
export function createSettingsChangeHandler(
  callback: SettingsChangeCallback
): (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void {
  return (changes, areaName) => {
    if (areaName === 'sync' && changes[SETTINGS_KEY]) {
      const newSettings = changes[SETTINGS_KEY].newValue as
        | AppSettings
        | undefined
      if (newSettings) {
        chrome.storage.local.get('focus_lock').then((localResult) => {
          callback(newSettings.blockedSites || [], !!localResult.focus_lock)
        })
      }
    }
  }
}
