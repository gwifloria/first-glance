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
 * 从 ISO 日期字符串中提取本地日期的 YYYY-MM-DD 部分
 * 处理时区问题：将 UTC 时间转换为本地时间后再提取日期
 */
export function extractDateStr(dueDate: string): string {
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
 * 格式化简短日期（如：12/25）
 */
export function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.slice(0, 10).split('-')
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
