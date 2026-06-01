import { Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  getHourlyDistribution,
  getHourlyBuckets,
  type FocusStatsData,
} from '@/services/focusStats'
import { SectionLabel } from '../../common/SectionLabel'

const CHART_HEIGHT = 96
const AXIS_HOURS = [0, 4, 8, 12, 16, 20]

export function FocusRhythm({ data }: { data: FocusStatsData }) {
  const { t } = useTranslation('focus')
  const dist = getHourlyDistribution(data)
  const max = Math.max(...dist, 1)
  const { peakKey } = getHourlyBuckets(data)
  const hasData = dist.some((c) => c > 0)

  const caption =
    hasData && peakKey
      ? `${t('stats.rhythm.golden')} · ${t(`stats.rhythm.buckets.${peakKey}`)}`
      : t('stats.rhythm.empty')

  return (
    <div>
      <SectionLabel
        className="mb-3"
        right={<span className="normal-case">{caption}</span>}
      >
        {t('stats.rhythm.title')}
      </SectionLabel>

      <div
        className="flex items-end gap-[3px] border-b border-dashed border-[var(--border)]"
        style={{ height: CHART_HEIGHT }}
      >
        {dist.map((count, hour) => {
          const h = count > 0 ? (count / max) * 100 : 0
          const isPeak = count === max && count > 0
          return (
            <Tooltip
              key={hour}
              title={t('stats.rhythm.tooltip', {
                hour: `${String(hour).padStart(2, '0')}:00`,
                count,
              })}
            >
              <div className="flex-1 flex items-end justify-center h-full">
                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: count > 0 ? `${Math.max(h, 5)}%` : '2px',
                    backgroundColor:
                      count > 0 ? 'var(--accent)' : 'var(--track)',
                    opacity: count > 0 ? (isPeak ? 1 : 0.45) : 1,
                  }}
                />
              </div>
            </Tooltip>
          )
        })}
      </div>

      <div className="relative mt-1 h-3">
        {AXIS_HOURS.map((hr) => (
          <span
            key={hr}
            className="absolute text-[10px] text-[var(--text-secondary)] -translate-x-1/2"
            style={{ left: `${(hr / 24) * 100}%` }}
          >
            {String(hr).padStart(2, '0')}
          </span>
        ))}
      </div>
    </div>
  )
}
