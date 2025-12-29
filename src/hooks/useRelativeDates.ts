import { useMemo } from 'react'
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
 */
export function useRelativeDates(): RelativeDates {
  return useMemo(() => {
    return {
      todayStr: getTodayStr(),
      tomorrowStr: getTomorrowStr(),
      dayAfterStr: getDayAfterStr(),
      nextWeekStr: getNextWeekStr(),
    }
  }, [])
}
