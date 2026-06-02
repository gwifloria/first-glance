import { useTranslation } from 'react-i18next'
import {
  getDailyStatsRange,
  getWeekOverWeek,
  type FocusStatsData,
} from '@/services/focusStats'
import { SectionLabel } from '../../common/SectionLabel'

export function TrendChart({ data }: { data: FocusStatsData }) {
  const { t, i18n } = useTranslation('focus')
  const daily = getDailyStatsRange(data, 7)
  const maxCount = Math.max(...daily.map((d) => d.count), 1)
  const wow = getWeekOverWeek(data)
  const todayTime = new Date().setHours(0, 0, 0, 0)

  const weekdayFmt = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
  })

  const deltaText =
    wow.deltaPct == null
      ? null
      : `${t('stats.trend.delta', { delta: `${wow.deltaPct > 0 ? '+' : ''}${wow.deltaPct}` })}${
          wow.deltaPct > 0 ? ' ↑' : wow.deltaPct < 0 ? ' ↓' : ''
        }`
  const deltaColor =
    wow.deltaPct && wow.deltaPct > 0
      ? 'var(--success)'
      : 'var(--text-secondary)'

  return (
    <div>
      <SectionLabel
        className="mb-3"
        right={
          deltaText ? (
            <span style={{ color: deltaColor }} className="normal-case">
              {deltaText}
            </span>
          ) : (
            <span className="normal-case">{t('stats.trend.caption')}</span>
          )
        }
      >
        {t('stats.trend.last7')}
      </SectionLabel>

      <div className="flex flex-col gap-2">
        {daily.map((day, i) => {
          const isToday = new Date(day.date).setHours(0, 0, 0, 0) === todayTime
          const widthPct = day.count > 0 ? (day.count / maxCount) * 100 : 0
          return (
            <div key={i} className="flex items-center gap-3">
              <span
                className={`w-10 shrink-0 text-xs ${
                  isToday
                    ? 'text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {weekdayFmt.format(day.date)}
              </span>
              <div className="relative flex-1 h-6 rounded-md bg-[var(--surface-raised)] overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-300"
                  style={{
                    width: `${Math.max(widthPct, day.count > 0 ? 8 : 0)}%`,
                    backgroundColor: 'var(--accent)',
                    opacity: day.count === 0 ? 0 : isToday ? 1 : 0.45,
                  }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-[var(--text-primary)]">
                  {day.count}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
