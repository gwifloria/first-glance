/**
 * 专注统计内容（用于 Popover 展示）
 * 显示今日/本周番茄钟统计 + 7 天柱状图
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'antd'
import {
  getFocusStats,
  subscribeFocusStats,
  getTodayStats,
  getWeekStats,
  getWeekDailyStats,
  formatDuration,
  type FocusStatsData,
  type DailyStatsWithDate,
} from '@/services/focusStats'

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

const CHART_HEIGHT = 64

function WeeklyChart({ dailyStats }: { dailyStats: DailyStatsWithDate[] }) {
  const { t } = useTranslation('focus')
  const days = t('stats.days', { returnObjects: true }) as string[]

  const maxCount = Math.max(...dailyStats.map((d) => d.count), 1)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()

  return (
    <div className="flex items-end justify-between gap-1.5 w-full px-1 mt-3">
      {dailyStats.map((day, i) => {
        const heightPercent = day.count > 0 ? (day.count / maxCount) * 100 : 0
        const isToday = new Date(day.date).setHours(0, 0, 0, 0) === todayTime
        const barColor = isToday ? 'var(--accent)' : 'var(--accent-light)'
        const tooltipText =
          day.count > 0
            ? t('stats.chartTooltip', {
                count: day.count,
                duration: formatDuration(day.totalMinutes),
              })
            : ''

        const barContent = (
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div
              className="relative w-full flex items-end justify-center"
              style={{ height: CHART_HEIGHT }}
            >
              <div
                className="w-full max-w-[16px] rounded-t-sm transition-all duration-300"
                style={{
                  height:
                    day.count > 0 ? `${Math.max(heightPercent, 8)}%` : '2px',
                  backgroundColor: day.count > 0 ? barColor : 'var(--border)',
                  opacity: isToday ? 1 : 0.7,
                }}
              />
            </div>
            <span
              className="text-[10px] mt-1 leading-none"
              style={{
                color: isToday ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isToday ? 600 : 400,
              }}
            >
              {days[i]}
            </span>
          </div>
        )

        if (day.count > 0) {
          return (
            <Tooltip key={i} title={tooltipText}>
              {barContent}
            </Tooltip>
          )
        }
        return <div key={i}>{barContent}</div>
      })}
    </div>
  )
}

export function StatsPopoverContent({
  onOpenDashboard,
}: {
  onOpenDashboard?: () => void
}) {
  const { t } = useTranslation('focus')
  const [stats, setStats] = useState<FocusStatsData | null>(null)

  useEffect(() => {
    getFocusStats().then(setStats)
    return subscribeFocusStats(setStats)
  }, [])

  if (!stats || stats.sessions.length === 0) {
    return (
      <div className="text-sm text-[var(--text-secondary)] text-center py-2">
        {t('stats.noData')}
      </div>
    )
  }

  const today = getTodayStats(stats)
  const week = getWeekStats(stats)
  const dailyStats = getWeekDailyStats(stats)
  const hasChartData = dailyStats.some((d) => d.count > 0)

  return (
    <div className="w-[240px]">
      <div className="flex items-center justify-center gap-6">
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
      {hasChartData && <WeeklyChart dailyStats={dailyStats} />}
      {onOpenDashboard && (
        <button
          onClick={onOpenDashboard}
          className="w-full mt-3 pt-2 border-t border-[var(--border)] text-xs
            text-[var(--text-secondary)] hover:text-[var(--accent)]
            transition-colors cursor-pointer"
        >
          {t('stats.viewFull')} →
        </button>
      )}
    </div>
  )
}
