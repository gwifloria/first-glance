import { Card, Statistic } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  getOverallStats,
  formatDuration,
  type FocusStatsData,
} from '@/services/focusStats'
import { SectionLabel } from '../../common/SectionLabel'

export function OverviewCards({ data }: { data: FocusStatsData }) {
  const { t } = useTranslation('focus')
  const overall = getOverallStats(data)

  const items = [
    {
      label: t('stats.overall.totalTime'),
      value: formatDuration(overall.totalMinutes),
    },
    { label: t('stats.overall.totalCount'), value: overall.totalCount },
    { label: t('stats.overall.avgDaily'), value: overall.avgPerActiveDay },
  ]

  return (
    <div>
      <SectionLabel className="mb-2">{t('stats.overall.title')}</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <Card
            key={item.label}
            size="small"
            style={{
              background: 'var(--surface-raised)',
              boxShadow: 'var(--shadow-small)',
            }}
            styles={{ body: { textAlign: 'center' } }}
          >
            <Statistic
              title={item.label}
              value={item.value}
              valueStyle={{ fontSize: 18, fontWeight: 600 }}
            />
          </Card>
        ))}
      </div>
    </div>
  )
}
