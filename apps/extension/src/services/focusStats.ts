/**
 * 专注数据统计服务
 * 记录番茄钟完成数据，存储在 chrome.storage.local
 */

import { createStorageSubscriber } from './storageSubscriber'

const STORAGE_KEY = 'focus_stats'

export interface FocusSession {
  timestamp: number // 完成时间戳
  duration: number // 工作时长（分钟）
  taskId: string | null // 绑定的任务 ID
}

export interface FocusStatsData {
  sessions: FocusSession[]
}

const EMPTY_STATS: FocusStatsData = { sessions: [] }

// 保留最近 90 天的数据，避免无限增长
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

export async function getFocusStats(): Promise<FocusStatsData> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] ?? EMPTY_STATS
}

export async function recordFocusSession(session: FocusSession): Promise<void> {
  const stats = await getFocusStats()
  const cutoff = Date.now() - MAX_AGE_MS
  // 清理过期数据 + 添加新记录
  const sessions = [
    ...stats.sessions.filter((s) => s.timestamp > cutoff),
    session,
  ]
  await chrome.storage.local.set({ [STORAGE_KEY]: { sessions } })
}

// ─── 统计计算 ───

export interface DailyStats {
  count: number // 完成的番茄数
  totalMinutes: number // 总专注时长（分钟）
  taskIds: Set<string> // 涉及的任务数
}

function getStartOfDay(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function getStartOfWeek(date: Date): number {
  const d = new Date(date)
  const day = d.getDay()
  // 周一为一周开始
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function computeStats(sessions: FocusSession[]): DailyStats {
  const taskIds = new Set<string>()
  let totalMinutes = 0
  for (const s of sessions) {
    totalMinutes += s.duration
    if (s.taskId) taskIds.add(s.taskId)
  }
  return { count: sessions.length, totalMinutes, taskIds }
}

export function getTodayStats(data: FocusStatsData): DailyStats {
  const start = getStartOfDay(new Date())
  const filtered = data.sessions.filter((s) => s.timestamp >= start)
  return computeStats(filtered)
}

export function getWeekStats(data: FocusStatsData): DailyStats {
  const start = getStartOfWeek(new Date())
  const filtered = data.sessions.filter((s) => s.timestamp >= start)
  return computeStats(filtered)
}

export interface DailyStatsWithDate {
  date: Date // 当天日期
  dayOfWeek: number // 0=周一, 6=周日
  count: number
  totalMinutes: number
}

/** 返回本周（周一到周日）每天的统计数据 */
export function getWeekDailyStats(data: FocusStatsData): DailyStatsWithDate[] {
  const now = new Date()
  const weekStart = getStartOfWeek(now)
  const result: DailyStatsWithDate[] = []

  for (let i = 0; i < 7; i++) {
    const dayStart = weekStart + i * 24 * 60 * 60 * 1000
    const dayEnd = dayStart + 24 * 60 * 60 * 1000
    const daySessions = data.sessions.filter(
      (s) => s.timestamp >= dayStart && s.timestamp < dayEnd
    )
    result.push({
      date: new Date(dayStart),
      dayOfWeek: i,
      count: daySessions.length,
      totalMinutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
    })
  }

  return result
}

export const subscribeFocusStats = createStorageSubscriber<FocusStatsData>(
  'local',
  STORAGE_KEY,
  (raw) => (raw as FocusStatsData | undefined) ?? EMPTY_STATS
)
