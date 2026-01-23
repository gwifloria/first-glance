/**
 * Background Service Worker
 * 主入口文件，负责事件监听和服务协调
 */

import {
  refreshTokenIfNeeded,
  initTokenRefreshAlarm,
  loadAndApplyBlockingRules,
  updateBlockingRules,
  checkChillModeExpiry,
  createSettingsChangeHandler,
  createChillModeChangeHandler,
} from './services'

// ==================== 安装和启动事件 ====================

chrome.runtime.onInstalled.addListener(async (details) => {
  const currentVersion = chrome.runtime.getManifest().version

  if (details.reason === 'install') {
    console.log(`[Extension] 首次安装 v${currentVersion}`)
    await chrome.storage.local.set({
      extension_version: currentVersion,
      install_time: Date.now(),
    })
    // 打开介绍页面
    chrome.tabs.create({ url: 'https://first-glance.app/introduction' })
  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion
    console.log(`[Extension] 更新 v${previousVersion} -> v${currentVersion}`)
    await chrome.storage.local.set({
      extension_version: currentVersion,
      last_update: {
        from: previousVersion,
        to: currentVersion,
        time: Date.now(),
        seen: false,
      },
    })
  }

  // 初始化时加载屏蔽规则
  await loadAndApplyBlockingRules()
})

// 浏览器启动时加载规则
chrome.runtime.onStartup.addListener(async () => {
  console.log('First Glance extension startup')
  await checkChillModeExpiry()
  await loadAndApplyBlockingRules()
})

// Service Worker 激活时立即加载规则（确保规则始终生效）
loadAndApplyBlockingRules()

// ==================== 定时任务 ====================

// 初始化 Token 刷新定时器
initTokenRefreshAlarm()

// 初始化 Chill Mode 定期检查（每分钟检查一次，作为 alarm 的备份）
chrome.alarms.create('chillModeCheck', { periodInMinutes: 1 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshToken') {
    await refreshTokenIfNeeded()
  } else if (
    alarm.name === 'chillModeExpire' ||
    alarm.name === 'chillModeCheck'
  ) {
    // 两个 alarm 都触发过期检查，确保可靠性
    await checkChillModeExpiry()
    await loadAndApplyBlockingRules()
  }
})

// ==================== Storage 变化监听 ====================

// 设置变化监听器（带 500ms 防抖）
let settingsDebounceTimer: ReturnType<typeof setTimeout> | null = null
const handleSettingsChange = createSettingsChangeHandler((blockedSites) => {
  if (settingsDebounceTimer) {
    clearTimeout(settingsDebounceTimer)
  }
  settingsDebounceTimer = setTimeout(() => {
    updateBlockingRules(blockedSites)
    settingsDebounceTimer = null
  }, 500)
})

// Chill Mode 变化监听器
const handleChillModeChange = createChillModeChangeHandler()

// 统一的 storage 变化监听
chrome.storage.onChanged.addListener((changes, areaName) => {
  handleSettingsChange(changes, areaName)
  handleChillModeChange(changes, areaName)
})
