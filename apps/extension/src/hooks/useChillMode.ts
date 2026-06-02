import { useState, useEffect, useCallback, useMemo } from 'react'
import { CHILL_MODE_DURATION_MS } from '@/constants'
import { STORAGE_KEYS } from '@/services/storageKeys'

export interface ChillModeState {
  active: boolean
  expiresAt: number
}

/**
 * 格式化剩余时间：>1 分钟显示 "Xmin"，≤1 分钟显示 "M:SS"
 */
function formatRemainingTime(expiresAt: number, now: number): string {
  const remaining = Math.max(0, expiresAt - now)
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  if (minutes >= 1) return `${minutes}min`
  return `0:${seconds.toString().padStart(2, '0')}`
}

/**
 * Chill Mode 状态管理 Hook
 * 监听 chrome.storage 中的 chill_mode 状态，提供倒计时和结束功能
 */
export function useChillMode() {
  const [chillMode, setChillMode] = useState<ChillModeState | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // 监听 chill mode 状态
  useEffect(() => {
    // 初始加载
    const currentTime = Date.now()
    chrome.storage.local.get(STORAGE_KEYS.CHILL_MODE).then((result) => {
      const state = result[STORAGE_KEYS.CHILL_MODE] as
        | ChillModeState
        | undefined
      if (state?.active && currentTime < state.expiresAt) {
        setChillMode(state)
      } else {
        setChillMode(null)
      }
    })

    // 监听变化
    const handleChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.CHILL_MODE]) {
        const state = changes[STORAGE_KEYS.CHILL_MODE].newValue as
          | ChillModeState
          | undefined
        const time = Date.now()
        if (state?.active && time < state.expiresAt) {
          setChillMode(state)
        } else {
          setChillMode(null)
        }
      }
    }

    chrome.storage.onChanged.addListener(handleChange)
    return () => chrome.storage.onChanged.removeListener(handleChange)
  }, [])

  // 每秒更新当前时间
  useEffect(() => {
    if (!chillMode) return

    const interval = setInterval(() => {
      const currentTime = Date.now()
      if (currentTime >= chillMode.expiresAt) {
        setChillMode(null)
      } else {
        setNow(currentTime)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [chillMode])

  // 计算是否激活状态
  const isActive = useMemo(() => {
    return !!chillMode && now < chillMode.expiresAt
  }, [chillMode, now])

  // 计算剩余时间
  const remainingTime = useMemo(() => {
    if (!chillMode) return ''
    return formatRemainingTime(chillMode.expiresAt, now)
  }, [chillMode, now])

  // 计算剩余比例 (1=刚开始, 0=即将结束)
  const remainingPercent = useMemo(() => {
    if (!chillMode) return 0
    const remaining = Math.max(0, chillMode.expiresAt - now)
    return Math.min(1, remaining / CHILL_MODE_DURATION_MS)
  }, [chillMode, now])

  // 结束 chill mode
  const endChillMode = useCallback(async () => {
    await chrome.storage.local.remove(STORAGE_KEYS.CHILL_MODE)
    setChillMode(null)
  }, [])

  return { isActive, remainingTime, remainingPercent, endChillMode }
}
