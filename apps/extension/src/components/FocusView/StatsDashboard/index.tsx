import { useState, useEffect } from 'react'
import { Modal, Tabs } from 'antd'
import { CrownOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usePremium } from '@/hooks/usePremium'
import {
  getFocusStats,
  subscribeFocusStats,
  type FocusStatsData,
} from '@/services/focusStats'
import { StreakHero } from './StreakHero'
import { OverviewCards } from './OverviewCards'
import { TrendChart } from './TrendChart'
import { FocusRhythm } from './FocusRhythm'
import { Heatmap } from './Heatmap'
import { SessionLog } from './SessionLog'
import { SAMPLE_STATS } from './sampleData'

interface StatsDashboardProps {
  open: boolean
  onClose: () => void
}

function DashboardTitle() {
  const { t } = useTranslation('focus')
  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className="text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t('stats.dashboardTitle')}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-accent)] text-[var(--accent)] font-medium">
          {t('stats.dashboardBadge')}
        </span>
      </div>
      <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-normal">
        {t('stats.dashboardSubtitle')}
      </div>
    </div>
  )
}

export function StatsDashboard({ open, onClose }: StatsDashboardProps) {
  const { t } = useTranslation('focus')
  const { isPremium, openPremiumModal } = usePremium()
  const [stats, setStats] = useState<FocusStatsData | null>(null)
  const [activeTab, setActiveTab] = useState('trend')

  useEffect(() => {
    if (!open) return
    getFocusStats().then(setStats)
    return subscribeFocusStats(setStats)
  }, [open])

  const hasData = stats && stats.sessions.length > 0

  return (
    <Modal
      title={<DashboardTitle />}
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 560 }}
      styles={{
        header: {
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12,
          marginBottom: 0,
        },
      }}
    >
      {!hasData ? (
        <div className="text-sm text-[var(--text-secondary)] text-center py-8">
          {t('stats.noData')}
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          <StreakHero data={stats} />
          <OverviewCards data={stats} />

          <div className="relative">
            <div
              className={
                isPremium ? '' : 'blur-[3px] pointer-events-none select-none'
              }
            >
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'trend',
                    label: t('stats.tabs.trend'),
                    children: (
                      <TrendChart data={isPremium ? stats : SAMPLE_STATS} />
                    ),
                  },
                  {
                    key: 'hourly',
                    label: t('stats.tabs.hourly'),
                    children: (
                      <FocusRhythm data={isPremium ? stats : SAMPLE_STATS} />
                    ),
                  },
                  {
                    key: 'heatmap',
                    label: t('stats.tabs.heatmap'),
                    children: (
                      <Heatmap data={isPremium ? stats : SAMPLE_STATS} />
                    ),
                  },
                  {
                    key: 'log',
                    label: t('stats.tabs.log'),
                    children: (
                      <SessionLog data={isPremium ? stats : SAMPLE_STATS} />
                    ),
                  },
                ]}
              />
            </div>

            {!isPremium && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={openPremiumModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
                    bg-[var(--surface-accent)] text-[var(--accent)] font-medium text-sm
                    border border-[var(--accent)] border-opacity-30
                    shadow-sm hover:opacity-85 transition-opacity"
                >
                  <CrownOutlined
                    style={{ color: 'var(--color-premium-gold)' }}
                  />
                  {t('stats.unlockDashboard')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
