// Background Service Worker
// 处理 OAuth 回调和 token 刷新

import type { AppSettings } from '@/types/settings'

const CLIENT_ID = import.meta.env.VITE_DIDA_CLIENT_ID || ''
const CLIENT_SECRET = import.meta.env.VITE_DIDA_CLIENT_SECRET || ''
const TOKEN_URL = 'https://dida365.com/oauth/token'
const SETTINGS_KEY = 'app_settings'

chrome.runtime.onInstalled.addListener(async (details) => {
  const currentVersion = chrome.runtime.getManifest().version

  if (details.reason === 'install') {
    console.log(`[Extension] 首次安装 v${currentVersion}`)
    // 记录安装版本
    await chrome.storage.local.set({
      extension_version: currentVersion,
      install_time: Date.now(),
    })
  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion
    console.log(`[Extension] 更新 v${previousVersion} -> v${currentVersion}`)
    // 记录更新信息，供 UI 层判断是否显示更新提示
    await chrome.storage.local.set({
      extension_version: currentVersion,
      last_update: {
        from: previousVersion,
        to: currentVersion,
        time: Date.now(),
        seen: false, // UI 层读取后设为 true
      },
    })
  }

  // 初始化时加载屏蔽规则
  await loadAndApplyBlockingRules()
})

// 浏览器启动时也加载规则
chrome.runtime.onStartup.addListener(async () => {
  console.log('First Glance extension startup')
  await loadAndApplyBlockingRules()
})

// Service Worker 激活时立即加载规则（确保规则始终生效）
loadAndApplyBlockingRules()

// 定时刷新 token（每 30 分钟检查一次）
chrome.alarms.create('refreshToken', { periodInMinutes: 30 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshToken') {
    await refreshTokenIfNeeded()
  }
})

/**
 * 检查并刷新 token（直接在 background 中执行，不依赖 newtab）
 */
async function refreshTokenIfNeeded(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('auth_token')
    const token = result.auth_token

    if (!token?.expires_at || !token?.refresh_token) {
      return
    }

    // 如果 token 将在 10 分钟内过期，尝试刷新
    const tenMinutes = 10 * 60 * 1000
    if (Date.now() <= token.expires_at - tenMinutes) {
      return
    }

    console.log('[Background] Token 即将过期，开始刷新')

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
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

// ==================== 网站屏蔽功能 ====================

/**
 * 监听设置变化，更新屏蔽规则
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes[SETTINGS_KEY]) {
    const newSettings = changes[SETTINGS_KEY].newValue as
      | AppSettings
      | undefined
    if (newSettings) {
      updateBlockingRules(newSettings.blockedSites || [])
    }
  }
})

/**
 * 加载设置并应用屏蔽规则
 */
async function loadAndApplyBlockingRules(): Promise<void> {
  try {
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
async function updateBlockingRules(blockedSites: string[]): Promise<void> {
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
        id: index + 1,
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
