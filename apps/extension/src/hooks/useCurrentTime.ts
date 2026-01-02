import { useSyncExternalStore } from 'react'
import { formatTime, formatDisplayDate } from '@/utils/date'

// 全局时间状态 - 所有消费者共享
let currentTime = new Date()
const listeners = new Set<() => void>()

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot(): Date {
  return currentTime
}

// 确保定时器只启动一次
let timerStarted = false
function ensureTimer() {
  if (timerStarted) return
  timerStarted = true

  setInterval(() => {
    currentTime = new Date()
    listeners.forEach((listener) => listener())
  }, 1000)
}

/**
 * 订阅当前时间更新的 Hook
 * 使用 useSyncExternalStore 实现最佳性能
 * 所有消费者共享同一个定时器
 */
export function useCurrentTime() {
  ensureTimer()

  const time = useSyncExternalStore(subscribe, getSnapshot)

  return {
    time,
    formattedTime: formatTime(time),
    formattedDate: formatDisplayDate(time),
  }
}
