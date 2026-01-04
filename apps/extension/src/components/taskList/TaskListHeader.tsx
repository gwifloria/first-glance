import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FocusButton } from '../FocusButton'
import { Clock } from '../common/Clock'
import type { Project } from '@/types'

const FILTER_KEYS: Record<string, string> = {
  all: 'filter.all',
  today: 'filter.today',
  tomorrow: 'filter.tomorrow',
  week: 'filter.week',
  overdue: 'filter.overdue',
  nodate: 'filter.noDate',
}

interface TaskListHeaderProps {
  filter: string
  projects: Project[]
  taskCount: number
  onFocus?: () => void
}

export function TaskListHeader({
  filter,
  projects,
  taskCount,
  onFocus,
}: TaskListHeaderProps) {
  const { t } = useTranslation('task')

  const { filterTitle, filterLabel } = useMemo(() => {
    if (filter.startsWith('project:')) {
      const projectId = filter.replace('project:', '')
      const project = projects.find((p) => p.id === projectId)
      return {
        filterTitle: project?.name || t('common:label.list'),
        filterLabel: t('common:label.list'),
      }
    }
    const key = FILTER_KEYS[filter]
    return {
      filterTitle: key ? t(key) : t('filter.default'),
      filterLabel: t('common:label.smartList'),
    }
  }, [filter, projects, t])

  return (
    <div className="flex justify-between items-start mb-8">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-[var(--text-secondary)] tracking-[1px]">
          {filterLabel}
        </span>
        <div className="flex items-baseline gap-2">
          <h1 className="text-[32px] max-md:text-2xl font-light text-[var(--text-primary)] m-0 font-[var(--font-secondary)]">
            {filterTitle}
          </h1>
          <span className="text-base text-[var(--warning)]">✦</span>
          <span className="text-2xl font-light text-[var(--text-secondary)]">
            {taskCount}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-6">
        {onFocus && <FocusButton onClick={onFocus} size="large" />}
        <div className="text-right">
          <div className="text-xs text-[var(--text-secondary)] mb-1">
            {t('common:message.todayIsGift')}
          </div>
          <Clock variant="small" showDate />
        </div>
      </div>
    </div>
  )
}
