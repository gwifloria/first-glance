import { useState, useEffect } from 'react'
import {
  getTodayStr,
  getTomorrowStr,
  getDayAfterStr,
  getNextWeekStr,
} from '@/utils/date'

interface RelativeDates {
  todayStr: string
  tomorrowStr: string
  dayAfterStr: string
  nextWeekStr: string
}

/**
 * 获取相对日期字符串的 Hook
 * 用于任务过滤和分组中的日期比较
 * 会在每天午夜自动更新日期
 */
export function useRelativeDates(): RelativeDates {
  const [dates, setDates] = useState(() => ({
    todayStr: getTodayStr(),
    tomorrowStr: getTomorrowStr(),
    dayAfterStr: getDayAfterStr(),
    nextWeekStr: getNextWeekStr(),
  }))

  useEffect(() => {
    const updateDates = () => {
      setDates({
        todayStr: getTodayStr(),
        tomorrowStr: getTomorrowStr(),
        dayAfterStr: getDayAfterStr(),
        nextWeekStr: getNextWeekStr(),
      })
    }

    // 计算到下一个午夜的毫秒数
    const now = new Date()
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )
    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    // 在午夜时更新日期
    const timeout = setTimeout(() => {
      updateDates()
      // 之后每24小时更新一次
      const interval = setInterval(updateDates, 24 * 60 * 60 * 1000)
      return () => clearInterval(interval)
    }, msUntilMidnight)

    return () => clearTimeout(timeout)
  }, [])

  return dates
}
