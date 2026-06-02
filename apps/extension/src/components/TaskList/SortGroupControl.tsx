import { useState } from 'react'
import { Popover, Select } from 'antd'
import { ControlOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import { SurfaceIconButton } from '../common/SurfaceIconButton'
import type { SortOption, GroupOption } from '@/utils/taskFilters'

// 分组选项（deadline / label 受服务能力门控）
const GROUP_OPTIONS: { value: GroupOption; needs?: 'deadline' | 'labels' }[] = [
  { value: 'none' },
  { value: 'date' },
  { value: 'dateAdded' },
  { value: 'deadline', needs: 'deadline' },
  { value: 'priority' },
  { value: 'label', needs: 'labels' },
]

// 排序选项（deadline 受服务能力门控）
const SORT_OPTIONS: { value: SortOption; needs?: 'deadline' }[] = [
  { value: 'sortOrder' },
  { value: 'name' },
  { value: 'dueDate' },
  { value: 'createdTime' },
  { value: 'deadline', needs: 'deadline' },
  { value: 'priority' },
]

/**
 * ListView 工具栏的「分组 + 排序」控件。
 * 参考 Todoist：一个图标按钮弹出 Popover，内含 Grouping / Sorting 两个下拉。
 * Deadline / Label 选项按当前服务能力（adapter.capabilities）显隐。
 */
export function SortGroupControl() {
  const { t } = useTranslation('task')
  const { filters, capabilities } = useTaskContext()
  const { sortBy, setSortBy, groupBy, setGroupBy } = filters
  const [open, setOpen] = useState(false)

  const groupOptions = GROUP_OPTIONS.filter(
    (o) => !o.needs || capabilities[o.needs]
  ).map((o) => ({ value: o.value, label: t(`listControl.group.${o.value}`) }))

  const sortOptions = SORT_OPTIONS.filter(
    (o) => !o.needs || capabilities[o.needs]
  ).map((o) => ({ value: o.value, label: t(`listControl.sort.${o.value}`) }))

  // 非默认（date 分组 + Default 排序）时给图标加个小圆点提示
  const isActive = groupBy !== 'date' || sortBy !== 'sortOrder'

  const content = (
    <div className="card-surface flex flex-col gap-3 w-56 p-1">
      <Row label={t('listControl.grouping')}>
        <Select
          size="small"
          value={groupBy}
          onChange={(v) => setGroupBy(v as GroupOption)}
          options={groupOptions}
          popupMatchSelectWidth={false}
          className="min-w-[120px]"
        />
      </Row>
      <Row label={t('listControl.sorting')}>
        <Select
          size="small"
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          options={sortOptions}
          popupMatchSelectWidth={false}
          className="min-w-[120px]"
        />
      </Row>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      open={open}
      onOpenChange={setOpen}
    >
      <span className="relative inline-flex">
        <SurfaceIconButton
          surface="page"
          size="large"
          shape="circle"
          icon={<ControlOutlined />}
        />
        {isActive && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] pointer-events-none" />
        )}
      </span>
    </Popover>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  )
}
