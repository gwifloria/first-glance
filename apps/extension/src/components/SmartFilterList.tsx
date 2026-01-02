import {
  CalendarOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { TaskCounts } from '@/utils/taskFilters'
import { FilterItem } from './FilterItem'

interface SmartFilter {
  id: string
  name: string
  icon: React.ReactNode
  count: number
}

interface SmartFilterListProps {
  counts: TaskCounts
  selectedFilter: string
  collapsed: boolean
  onFilterChange: (filter: string) => void
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)] tracking-wide flex items-center gap-1">
      <span className="text-xs">›</span>
      {title}
    </div>
  )
}

export function SmartFilterList({
  counts,
  selectedFilter,
  collapsed,
  onFilterChange,
}: SmartFilterListProps) {
  const { t } = useTranslation('sidebar')

  const smartFilters: SmartFilter[] = [
    {
      id: 'inbox',
      name: t('smartList.inbox'),
      icon: <InboxOutlined />,
      count: counts.inbox,
    },
    {
      id: 'today',
      name: t('smartList.today'),
      icon: <FieldTimeOutlined />,
      count: counts.today,
    },
    {
      id: 'tomorrow',
      name: t('smartList.tomorrow'),
      icon: <CalendarOutlined />,
      count: counts.tomorrow,
    },
    {
      id: 'week',
      name: t('smartList.week'),
      icon: <CalendarOutlined />,
      count: counts.week,
    },
    {
      id: 'overdue',
      name: t('smartList.overdue'),
      icon: <ClockCircleOutlined />,
      count: counts.overdue,
    },
  ]

  return (
    <div className="mb-2">
      {!collapsed && <SectionTitle title={t('smartList.title')} />}
      {smartFilters.map((filter) => (
        <FilterItem
          key={filter.id}
          active={selectedFilter === filter.id}
          onClick={() => onFilterChange(filter.id)}
          icon={filter.icon}
          name={filter.name}
          count={filter.count}
          collapsed={collapsed}
        />
      ))}
    </div>
  )
}
