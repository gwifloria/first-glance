/**
 * 网站屏蔽规则服务
 * 管理 declarativeNetRequest 动态规则
 */

import type { AppSettings } from '@/types/settings'
import { isChillModeActive } from './chillMode'

const SETTINGS_KEY = 'app_settings'
// 规则 ID 基础偏移量，避免与其他可能的规则冲突
const RULE_ID_BASE = 1000

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

    const result = await chrome.storage.sync.get(SETTINGS_KEY)
    const settings = result[SETTINGS_KEY] as AppSettings | undefined
    const blockedSites = settings?.blockedSites || []
    await updateBlockingRules(blockedSites)
  } catch (err) {
    console.error('[Background] 加载屏蔽规则失败:', err)
  }
}

/**
 * 更新屏蔽规则
 */
export async function updateBlockingRules(
  blockedSites: string[]
): Promise<void> {
  try {
    // 获取当前规则以便清除
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
    const removeRuleIds = existingRules.map((r) => r.id)

    console.log('[Blocksite] Current rules:', existingRules)
    console.log('[Blocksite] Blocked sites from settings:', blockedSites)

    // 如果没有要屏蔽的网站，只清除规则
    if (blockedSites.length === 0) {
      if (removeRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds })
        console.log('[Blocksite] Cleared all rules')
      }
      return
    }

    // 创建新规则
    // urlFilter 语法：
    // - || 匹配域名开始（包括子域名）
    // - ^ 匹配分隔符（/、?、: 或字符串结尾），确保完整域名匹配
    // 例如 ||xiaohongshu.com^ 会匹配：
    // - https://xiaohongshu.com
    // - https://www.xiaohongshu.com/explore
    // - https://m.xiaohongshu.com
    const addRules: chrome.declarativeNetRequest.Rule[] = blockedSites.map(
      (domain, index) => ({
        // 全量更新模式下使用简单递增 ID，加基础偏移避免与其他规则冲突
        id: RULE_ID_BASE + index,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            // 使用 newtab 页面 + 查询参数，避免单独 HTML 入口的打包问题
            extensionPath: '/src/newtab/index.html?blocked=1',
          },
        },
        condition: {
          urlFilter: `||${domain}^`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      })
    )

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
export type SettingsChangeCallback = (blockedSites: string[]) => void

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
        callback(newSettings.blockedSites || [])
      }
    }
  }
}
