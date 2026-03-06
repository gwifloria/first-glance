/**
 * 专注数据统计卡片
 * 显示今日和本周的番茄钟统计
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getFocusStats,
  subscribeFocusStats,
  getTodayStats,
  getWeekStats,
  type FocusStatsData,
  type DailyStats,
} from '@/services/focusStats'

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-semibold text-[var(--text-primary)]">
        {value}
      </span>
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    </div>
  )
}

export function StatsCard() {
  const { t } = useTranslation('focus')
  const [stats, setStats] = useState<FocusStatsData | null>(null)

  useEffect(() => {
    getFocusStats().then(setStats)
    return subscribeFocusStats(setStats)
  }, [])

  if (!stats || stats.sessions.length === 0) return null

  const today: DailyStats = getTodayStats(stats)
  const week: DailyStats = getWeekStats(stats)

  // 今天没有数据就不显示
  if (today.count === 0 && week.count === 0) return null

  return (
    <div className="mt-6 w-full max-w-md">
      <div className="flex items-center justify-center gap-8 py-3 px-4 rounded-xl bg-[var(--bg-card)] shadow-sm">
        {today.count > 0 && (
          <>
            <StatItem value={today.count} label={t('stats.todayCount')} />
            <StatItem
              value={formatDuration(today.totalMinutes)}
              label={t('stats.todayTime')}
            />
          </>
        )}
        {week.count > 0 && (
          <>
            {today.count > 0 && <div className="w-px h-8 bg-[var(--border)]" />}
            <StatItem value={week.count} label={t('stats.weekCount')} />
            <StatItem
              value={formatDuration(week.totalMinutes)}
              label={t('stats.weekTime')}
            />
          </>
        )}
      </div>
    </div>
  )
}
