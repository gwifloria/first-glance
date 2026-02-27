import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  formatDateStr,
  extractDateStr,
  formatShortDate,
  formatDateTimeWithTimezone,
  getTodayStr,
  getTomorrowStr,
  getDayAfterStr,
  getNextWeekStr,
} from './date'

describe('date utils', () => {
  describe('formatDateStr', () => {
    it('输出 YYYY-MM-DD 格式', () => {
      const date = new Date(2026, 0, 15) // 2026-01-15
      expect(formatDateStr(date)).toBe('2026-01-15')
    })

    it('月份和日期补零', () => {
      const date = new Date(2026, 0, 5) // 2026-01-05
      expect(formatDateStr(date)).toBe('2026-01-05')
    })

    it('12月31日', () => {
      const date = new Date(2026, 11, 31)
      expect(formatDateStr(date)).toBe('2026-12-31')
    })
  })

  describe('extractDateStr', () => {
    it('从本地日期字符串提取 YYYY-MM-DD', () => {
      // 不含时区的字符串，Date 解析为本地时间
      expect(extractDateStr('2026-01-24')).toBe('2026-01-24')
    })

    it('从带时间的字符串提取本地日期', () => {
      // 本地时间字符串
      const result = extractDateStr('2026-03-15T14:30:00')
      expect(result).toBe('2026-03-15')
    })
  })

  describe('formatShortDate', () => {
    it('去前导零', () => {
      expect(formatShortDate('2026-01-05')).toBe('1/5')
    })

    it('双位数月份和日期', () => {
      expect(formatShortDate('2026-12-25')).toBe('12/25')
    })
  })

  describe('formatDateTimeWithTimezone', () => {
    it('包含 +HH:MM 或 -HH:MM 格式的偏移量', () => {
      const date = new Date(2026, 0, 15) // 2026-01-15
      const result = formatDateTimeWithTimezone(date)

      // 格式应为 YYYY-MM-DDT00:00:00.000±HH:MM
      expect(result).toMatch(/^2026-01-15T00:00:00\.000[+-]\d{2}:\d{2}$/)
    })

    it('偏移量符号正确', () => {
      const date = new Date(2026, 5, 15)
      const result = formatDateTimeWithTimezone(date)
      // 应包含 + 或 - 号
      expect(result).toMatch(/[+-]\d{2}:\d{2}$/)
    })
  })

  describe('相对日期函数', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-27T12:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('getTodayStr 返回今天', () => {
      expect(getTodayStr()).toBe('2026-02-27')
    })

    it('getTomorrowStr 返回明天', () => {
      expect(getTomorrowStr()).toBe('2026-02-28')
    })

    it('getDayAfterStr 返回后天', () => {
      expect(getDayAfterStr()).toBe('2026-03-01')
    })

    it('getNextWeekStr 返回7天后', () => {
      expect(getNextWeekStr()).toBe('2026-03-06')
    })
  })
})
