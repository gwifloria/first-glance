/**
 * Chill Mode 后台服务
 * 管理休息模式的状态和定时器
 */

import { clearBlockingRules, loadAndApplyBlockingRules } from './blockingRules'

export interface ChillModeState {
  active: boolean
  expiresAt: number
}

/**
 * 检查 chill mode 是否处于激活状态
 */
export async function isChillModeActive(): Promise<boolean> {
  const result = await chrome.storage.local.get('chill_mode')
  const state = result.chill_mode as ChillModeState | undefined
  return !!state?.active && Date.now() < state.expiresAt
}

/**
 * 检查 chill mode 是否过期，如果过期则清除
 */
export async function checkChillModeExpiry(): Promise<void> {
  const result = await chrome.storage.local.get('chill_mode')
  const state = result.chill_mode as ChillModeState | undefined
  if (state?.active && Date.now() >= state.expiresAt) {
    await chrome.storage.local.remove('chill_mode')
    console.log('[ChillMode] 休息模式已过期，已清除')
  }
}

/**
 * 处理 chill mode 状态变化
 */
export async function handleChillModeChange(
  state: ChillModeState | undefined
): Promise<void> {
  if (state?.active && Date.now() < state.expiresAt) {
    // 进入休息模式：清除所有屏蔽规则
    await clearBlockingRules()
    console.log('[ChillMode] 已进入休息模式，屏蔽规则已暂停')

    // 设置定时器在过期时恢复
    chrome.alarms.create('chillModeExpire', { when: state.expiresAt })
  } else {
    // 退出休息模式：恢复屏蔽规则
    await chrome.alarms.clear('chillModeExpire')
    await loadAndApplyBlockingRules()
    console.log('[ChillMode] 休息模式结束，屏蔽规则已恢复')
  }
}

/**
 * 处理 chill mode 过期 alarm
 */
export async function handleChillModeExpireAlarm(): Promise<void> {
  await chrome.storage.local.remove('chill_mode')
  await loadAndApplyBlockingRules()
  console.log('[ChillMode] 休息模式自动过期')
}

/**
 * 创建 storage 变化监听器
 * 注意：返回的处理函数会立即执行异步操作，Chrome 会等待 Promise 完成
 */
export function createChillModeChangeHandler(): (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void {
  let isProcessing = false

  return (changes, areaName) => {
    if (areaName === 'local' && changes.chill_mode) {
      // 防止并发处理
      if (isProcessing) return
      isProcessing = true

      handleChillModeChange(changes.chill_mode.newValue)
        .catch((err) => console.error('[ChillMode] 状态变化处理失败:', err))
        .finally(() => {
          isProcessing = false
        })
    }
  }
}
