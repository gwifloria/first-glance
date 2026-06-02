import { List, Tag } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getRecentSessions, type FocusStatsData } from '@/services/focusStats'
import { SectionLabel } from '../../common/SectionLabel'

/** priority(0/1/3/5) → 标签配置 */
function priorityTag(priority: number | null | undefined): {
  key: string
  color: string
} | null {
  if (priority === 5) return { key: 'high', color: 'var(--danger)' }
  if (priority === 3) return { key: 'medium', color: 'var(--warning)' }
  if (priority === 1) return { key: 'low', color: 'var(--accent)' }
  return null
}

export function SessionLog({ data }: { data: FocusStatsData }) {
  const { t, i18n } = useTranslation('focus')
  const sessions = getRecentSessions(data, 30)
  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <div>
      <SectionLabel
        className="mb-3"
        right={
          <span className="normal-case">
            {t('stats.log.count', { count: data.sessions.length })}
          </span>
        }
      >
        {t('stats.log.title')}
      </SectionLabel>

      <div className="max-h-[300px] overflow-y-auto pr-1">
        <List
          dataSource={sessions}
          locale={{ emptyText: t('stats.noData') }}
          split={false}
          renderItem={(s) => {
            const tag = priorityTag(s.priority)
            return (
              <List.Item
                className="!px-3 !my-1.5 rounded-lg"
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                }}
                extra={
                  <div className="flex items-center gap-2">
                    {tag && (
                      <Tag
                        bordered
                        style={{
                          color: tag.color,
                          borderColor: tag.color,
                          background: 'transparent',
                          margin: 0,
                        }}
                      >
                        {t(`stats.log.priority.${tag.key}`)}
                      </Tag>
                    )}
                    <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                      +{s.duration}m
                    </span>
                  </div>
                }
              >
                <List.Item.Meta
                  avatar={
                    <CheckCircleFilled
                      style={{ color: 'var(--accent)', fontSize: 18 }}
                    />
                  }
                  title={
                    <span className="text-sm">
                      {s.taskTitle || t('stats.log.free')}
                    </span>
                  }
                  description={
                    <span className="text-[11px]">
                      {dateFmt.format(s.timestamp)}
                    </span>
                  }
                />
              </List.Item>
            )
          }}
        />
      </div>
    </div>
  )
}
