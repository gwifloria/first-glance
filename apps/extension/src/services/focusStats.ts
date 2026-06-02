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
  // 完成时对任务的快照（冻结历史，不随任务改名/删除变化；旧记录可能没有）
  taskTitle?: string | null
  priority?: number | null // 0=无 1=低 3=中 5=高
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

/** 把分钟数格式化为 "45m" / "1h" / "2h 30m" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

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

const DAY_MS = 24 * 60 * 60 * 1000

/** 返回本周（周一到周日）每天的统计数据 */
export function getWeekDailyStats(data: FocusStatsData): DailyStatsWithDate[] {
  const weekStart = getStartOfWeek(new Date())
  return buildDailyStats(data, weekStart, 7)
}

/**
 * 返回截至今天、往前 days 天的每日统计（最旧 → 今天）。
 * dayOfWeek 以周一为 0。
 */
export function getDailyStatsRange(
  data: FocusStatsData,
  days: number
): DailyStatsWithDate[] {
  const todayStart = getStartOfDay(new Date())
  const rangeStart = todayStart - (days - 1) * DAY_MS
  return buildDailyStats(data, rangeStart, days)
}

function buildDailyStats(
  data: FocusStatsData,
  startTime: number,
  days: number
): DailyStatsWithDate[] {
  const result: DailyStatsWithDate[] = []
  for (let i = 0; i < days; i++) {
    const dayStart = startTime + i * DAY_MS
    const dayEnd = dayStart + DAY_MS
    const daySessions = data.sessions.filter(
      (s) => s.timestamp >= dayStart && s.timestamp < dayEnd
    )
    const date = new Date(dayStart)
    const dow = date.getDay()
    result.push({
      date,
      dayOfWeek: dow === 0 ? 6 : dow - 1,
      count: daySessions.length,
      totalMinutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
    })
  }
  return result
}

// ─── Dashboard（Premium 完整统计面板）───

export interface OverallStats {
  totalCount: number // 累计番茄数
  totalMinutes: number // 累计专注时长
  activeDays: number // 有专注记录的天数
  avgPerActiveDay: number // 活跃日均番茄数（保留一位小数）
}

/** 累计总览：基于全部留存数据（最近 90 天） */
export function getOverallStats(data: FocusStatsData): OverallStats {
  const dayKeys = new Set<number>()
  let totalMinutes = 0
  for (const s of data.sessions) {
    totalMinutes += s.duration
    dayKeys.add(getStartOfDay(new Date(s.timestamp)))
  }
  const totalCount = data.sessions.length
  const activeDays = dayKeys.size
  const avgPerActiveDay =
    activeDays > 0 ? Math.round((totalCount / activeDays) * 10) / 10 : 0
  return { totalCount, totalMinutes, activeDays, avgPerActiveDay }
}

/**
 * 当前连续专注天数：从今天往回数连续有 ≥1 番茄的天数。
 * 今天还没番茄时，从昨天起算（不打断已有连续记录）。
 */
export function getCurrentStreak(data: FocusStatsData): number {
  if (data.sessions.length === 0) return 0
  const activeDays = new Set<number>()
  for (const s of data.sessions) {
    activeDays.add(getStartOfDay(new Date(s.timestamp)))
  }
  const todayStart = getStartOfDay(new Date())
  let cursor = activeDays.has(todayStart) ? todayStart : todayStart - DAY_MS
  let streak = 0
  while (activeDays.has(cursor)) {
    streak++
    cursor -= DAY_MS
  }
  return streak
}

export interface HeatmapDay {
  date: Date
  count: number
}

/** 最近 days 天内的最长连续专注天数（区别于当前连胜，反映历史峰值） */
export function getLongestStreak(data: FocusStatsData, days = 90): number {
  const series = getDailyStatsRange(data, days)
  let best = 0
  let cur = 0
  for (const d of series) {
    if (d.count > 0) {
      cur++
      if (cur > best) best = cur
    } else {
      cur = 0
    }
  }
  return best
}

/** 热力图数据：截至今天往前 days 天的每日番茄数（最旧 → 今天） */
export function getHeatmapData(data: FocusStatsData, days = 90): HeatmapDay[] {
  return getDailyStatsRange(data, days).map((d) => ({
    date: d.date,
    count: d.count,
  }))
}

/** 24 小时分布：按完成时刻的小时累计番茄数（索引 0-23） */
export function getHourlyDistribution(data: FocusStatsData): number[] {
  const buckets = new Array(24).fill(0)
  for (const s of data.sessions) {
    buckets[new Date(s.timestamp).getHours()]++
  }
  return buckets
}

/** 最近的专注会话（按完成时间倒序） */
export function getRecentSessions(
  data: FocusStatsData,
  limit = 30
): FocusSession[] {
  return [...data.sessions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}

export interface WeekOverWeek {
  thisWeek: number // 近 7 天番茄数
  lastWeek: number // 前 7 天番茄数
  deltaPct: number | null // 环比百分比；前一周为 0 时为 null
}

/** 近 7 天 vs 前 7 天的番茄数环比 */
export function getWeekOverWeek(data: FocusStatsData): WeekOverWeek {
  const days = getDailyStatsRange(data, 14)
  const lastWeek = days.slice(0, 7).reduce((s, d) => s + d.count, 0)
  const thisWeek = days.slice(7).reduce((s, d) => s + d.count, 0)
  const deltaPct =
    lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
  return { thisWeek, lastWeek, deltaPct }
}

/** 命名时段定义（覆盖 0-23 全天），按一天的自然顺序排列 */
export const HOUR_BUCKETS: { key: string; hours: number[] }[] = [
  { key: 'morning', hours: [5, 6, 7, 8] },
  { key: 'forenoon', hours: [9, 10, 11] },
  { key: 'afternoon', hours: [12, 13, 14, 15, 16] },
  { key: 'evening', hours: [17, 18, 19, 20] },
  { key: 'night', hours: [21, 22, 23] },
  { key: 'lateNight', hours: [0, 1, 2, 3, 4] },
]

export interface HourBucket {
  key: string
  count: number
}

/** 按命名时段聚合，并标出番茄最多的时段 */
export function getHourlyBuckets(data: FocusStatsData): {
  buckets: HourBucket[]
  peakKey: string | null
} {
  const dist = getHourlyDistribution(data)
  const buckets = HOUR_BUCKETS.map((b) => ({
    key: b.key,
    count: b.hours.reduce((sum, h) => sum + dist[h], 0),
  }))
  let peakKey: string | null = null
  let max = 0
  for (const b of buckets) {
    if (b.count > max) {
      max = b.count
      peakKey = b.key
    }
  }
  return { buckets, peakKey }
}

export const subscribeFocusStats = createStorageSubscriber<FocusStatsData>(
  'local',
  STORAGE_KEY,
  (raw) => (raw as FocusStatsData | undefined) ?? EMPTY_STATS
)

// ─── Dev 假数据种子 ───

const DEV_SEED_HOURS = [9, 9, 10, 10, 11, 14, 15, 15, 16, 21, 22]
const DEV_SEED_TASKS: { title: string; priority: number }[] = [
  { title: 'ByteNotes: React Server Architecture', priority: 5 },
  { title: '阅读《心流》', priority: 3 },
  { title: '每日计划及复盘', priority: 1 },
  { title: 'React 19 CVE Bug Research', priority: 3 },
  { title: 'Review official docs', priority: 5 },
  { title: '学习新框架', priority: 0 },
]

function buildDevSeedSessions(): FocusSession[] {
  const sessions: FocusSession[] = []
  const todayStart = getStartOfDay(new Date())
  for (let d = 89; d >= 0; d--) {
    const dayStart = todayStart - d * DAY_MS
    let count: number
    if (d <= 9)
      count = 2 + Math.floor(Math.random() * 6) // 最近 10 天保证连胜
    else if (Math.random() < 0.22)
      count = 0 // 约两成休息日
    else count = 1 + Math.floor(Math.random() * 7)
    for (let i = 0; i < count; i++) {
      const hour = DEV_SEED_HOURS[(d + i) % DEV_SEED_HOURS.length]
      const task = DEV_SEED_TASKS[(d + i) % DEV_SEED_TASKS.length]
      sessions.push({
        timestamp: dayStart + hour * 3600000 + ((i * 17) % 60) * 60000,
        duration: 25,
        taskId: `dev-seed-${(d + i) % DEV_SEED_TASKS.length}`,
        taskTitle: task.title,
        priority: task.priority,
      })
    }
  }
  return sessions
}

/**
 * dev 模式下按需灌入假番茄数据，省去每次手动在控制台敲命令。
 * 仅当 MODE=development 且 VITE_DEV_SEED_FOCUS_STATS=true 时生效；
 * 已有数据则跳过（不覆盖手动测试数据，想重灌就先清空 focus_stats）。
 * 生产构建中整个函数体被 tree-shaken。
 */
export async function seedDevFocusStatsIfNeeded(): Promise<void> {
  if (import.meta.env.MODE !== 'development') return
  if (import.meta.env.VITE_DEV_SEED_FOCUS_STATS !== 'true') return

  const existing = await getFocusStats()
  if (existing.sessions.length > 0) return

  const sessions = buildDevSeedSessions()
  await chrome.storage.local.set({ [STORAGE_KEY]: { sessions } })
  console.info(
    `[dev] seeded ${sessions.length} fake focus sessions (clear "focus_stats" to re-seed)`
  )
}
