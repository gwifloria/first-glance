import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isToday, isTomorrow, isThisWeek, isOverdue } from './predicates'

describe('date predicates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-27T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isToday', () => {
    it('匹配今天日期', () => {
      expect(isToday('2026-02-27')).toBe(true)
    })

    it('匹配今天带时间的日期', () => {
      expect(isToday('2026-02-27T14:30:00')).toBe(true)
    })

    it('不匹配昨天', () => {
      expect(isToday('2026-02-26')).toBe(false)
    })

    it('不匹配明天', () => {
      expect(isToday('2026-02-28')).toBe(false)
    })

    it('undefined 返回 false', () => {
      expect(isToday(undefined)).toBe(false)
    })
  })

  describe('isTomorrow', () => {
    it('匹配明天日期', () => {
      expect(isTomorrow('2026-02-28')).toBe(true)
    })

    it('不匹配今天', () => {
      expect(isTomorrow('2026-02-27')).toBe(false)
    })

    it('undefined 返回 false', () => {
      expect(isTomorrow(undefined)).toBe(false)
    })
  })

  describe('isOverdue', () => {
    it('匹配过去日期', () => {
      expect(isOverdue('2026-02-25')).toBe(true)
    })

    it('今天不算逾期', () => {
      expect(isOverdue('2026-02-27')).toBe(false)
    })

    it('未来日期不算逾期', () => {
      expect(isOverdue('2026-03-01')).toBe(false)
    })

    it('undefined 返回 false', () => {
      expect(isOverdue(undefined)).toBe(false)
    })
  })

  describe('isThisWeek', () => {
    it('包含今天', () => {
      expect(isThisWeek('2026-02-27')).toBe(true)
    })

    it('包含明天', () => {
      expect(isThisWeek('2026-02-28')).toBe(true)
    })

    it('包含6天后', () => {
      expect(isThisWeek('2026-03-05')).toBe(true)
    })

    it('不包含7天后', () => {
      expect(isThisWeek('2026-03-06')).toBe(false)
    })

    it('不包含过去', () => {
      expect(isThisWeek('2026-02-26')).toBe(false)
    })

    it('undefined 返回 false', () => {
      expect(isThisWeek(undefined)).toBe(false)
    })
  })
})
