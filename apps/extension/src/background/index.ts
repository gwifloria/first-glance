/**
 * Background Service Worker
 * 主入口文件，负责事件监听和服务协调
 */

import {
  refreshTokenIfNeeded,
  initTokenRefreshAlarm,
  loadAndApplyBlockingRules,
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

initTokenRefreshAlarm()

chrome.alarms.create('chillModeCheck', { periodInMinutes: 1 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshToken') {
    await refreshTokenIfNeeded()
  } else if (
    alarm.name === 'chillModeExpire' ||
    alarm.name === 'chillModeCheck'
  ) {
    await checkChillModeExpiry()
    await loadAndApplyBlockingRules()
  }
})

// ==================== Storage 变化监听 ====================

// 统一防抖：所有触发规则重载的事件共用同一个 timer
let rulesDebounceTimer: ReturnType<typeof setTimeout> | null = null
function scheduleRulesReload() {
  if (rulesDebounceTimer) clearTimeout(rulesDebounceTimer)
  rulesDebounceTimer = setTimeout(() => {
    loadAndApplyBlockingRules()
    rulesDebounceTimer = null
  }, 500)
}

const handleSettingsChange = createSettingsChangeHandler(scheduleRulesReload)
const handleChillModeChange = createChillModeChangeHandler()

chrome.storage.onChanged.addListener((changes, areaName) => {
  handleSettingsChange(changes, areaName)
  handleChillModeChange(changes, areaName)

  if (areaName === 'local' && changes.focus_lock) {
    scheduleRulesReload()
  }
})
