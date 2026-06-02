import { Card, Progress } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  getTodayStats,
  getCurrentStreak,
  type FocusStatsData,
} from '@/services/focusStats'

/** 每日番茄目标（用于环形进度） */
const DAILY_GOAL = 5

export function StreakHero({ data }: { data: FocusStatsData }) {
  const { t } = useTranslation('focus')
  const today = getTodayStats(data).count
  const streak = getCurrentStreak(data)
  const goal = DAILY_GOAL
  const pct = Math.min(Math.round((today / goal) * 100), 100)
  const remaining = Math.max(goal - today, 0)

  const message =
    remaining === 0
      ? t('stats.streak.done')
      : today === 0
        ? t('stats.streak.secure')
        : t('stats.streak.remaining', { count: remaining })

  return (
    <Card
      styles={{
        body: {
          background: 'var(--surface-accent)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        },
      }}
    >
      <Progress
        type="circle"
        percent={pct}
        size={76}
        strokeColor="var(--accent)"
        trailColor="var(--track)"
        format={() => (
          <div className="flex flex-col items-center leading-none">
            <span className="text-xl font-bold text-[var(--text-primary)]">
              {today}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-[var(--text-secondary)] mt-1">
              {t('stats.streak.goal', { goal })}
            </span>
          </div>
        )}
      />
      <div className="min-w-0">
        <div className="text-base font-semibold text-[var(--text-primary)]">
          🔥 {t('stats.streak.title', { days: streak })}
        </div>
        <div className="text-xs text-[var(--text-secondary)] mt-1">
          {message}
        </div>
      </div>
    </Card>
  )
}
