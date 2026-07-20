/**
 * 日期工具函数
 * 统一处理日期格式化，避免时区问题
 */

/**
 * 将 Date 对象格式化为 YYYY-MM-DD 字符串
 */
export function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 从日期字符串中提取本地日期的 YYYY-MM-DD 部分
 * 纯日期表示日历日期，不应经过 UTC 转换；带时间的值才转换为本地日期
 *
 * 滴答清单 API 返回 UTC 时间（如 2026-01-23T16:00:00.000+0000）
 * 需要转换为本地时间（如 UTC+8 时区变成 2026-01-24）
 */
export function extractDateStr(dueDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return dueDate

  const date = new Date(dueDate)
  return formatDateStr(date)
}

/**
 * 格式化显示日期（如：12月25日 星期三）
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

/**
 * 格式化时间（如：14:30）
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * 格式化简短日期（如：1/25）
 * 先转换为本地日期再格式化，避免时区问题
 */
export function formatShortDate(dateStr: string): string {
  const localDateStr = extractDateStr(dateStr)
  const [, month, day] = localDateStr.split('-')
  return `${parseInt(month)}/${parseInt(day)}`
}

// ============ 相对日期工具 ============

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export function getTodayStr(): string {
  return formatDateStr(new Date())
}

/**
 * 获取明天的日期字符串 (YYYY-MM-DD)
 */
export function getTomorrowStr(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formatDateStr(tomorrow)
}

/**
 * 获取后天的日期字符串 (YYYY-MM-DD)
 */
export function getDayAfterStr(): string {
  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  return formatDateStr(dayAfter)
}

/**
 * 获取7天后的日期字符串 (YYYY-MM-DD)
 */
export function getNextWeekStr(): string {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  return formatDateStr(nextWeek)
}

/**
 * 生成带本地时区的 RFC 3339 日期时间字符串
 * 例如：2024-01-15T00:00:00.000+08:00
 */
export function formatDateTimeWithTimezone(date: Date): string {
  const dateStr = formatDateStr(date)
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0')
  return `${dateStr}T00:00:00.000${sign}${hours}:${minutes}`
}
