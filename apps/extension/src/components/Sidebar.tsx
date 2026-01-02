import { useState } from 'react'
import { Button } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usePersistedBoolean } from '@/hooks/usePersistedBoolean'
import { ThemeToggle } from './common/ThemeToggle'
import { SearchInput } from './SearchInput'
import { SmartFilterList } from './SmartFilterList'
import { ProjectList } from './ProjectList'
import { SidebarFooter } from './SidebarFooter'
import type { Project, Task } from '@/types'
import type { TaskCounts } from '@/utils/taskFilters'

interface SidebarProps {
  tasks: Task[]
  projects: Project[]
  counts: TaskCounts
  selectedFilter: string
  onFilterChange: (filter: string) => void
  onSearch?: (query: string) => void
}

function SidebarHeader({
  collapsed,
  onToggleCollapse,
  toggleTitle,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
  toggleTitle: string
}) {
  return (
    <div className={`p-4 pb-2 ${collapsed ? 'px-2' : ''}`}>
      <div
        className={`flex items-center gap-2 mb-3 ${collapsed ? 'justify-center' : 'justify-between'}`}
      >
        {!collapsed && <ThemeToggle />}
        <Button
          type="text"
          size="small"
          onClick={onToggleCollapse}
          title={toggleTitle}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          className="!w-5 !h-5 !min-w-0 !p-0"
        />
      </div>
    </div>
  )
}

export function Sidebar({
  tasks,
  projects,
  counts,
  selectedFilter,
  onFilterChange,
  onSearch,
}: SidebarProps) {
  const { t } = useTranslation('sidebar')
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsed, toggleCollapsed] = usePersistedBoolean('sidebarCollapsed')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <aside
      className={`
        ${collapsed ? 'w-[60px]' : 'w-[240px]'}
        bg-[var(--bg-sidebar)] h-full flex flex-col shrink-0
        transition-all duration-300 ease-out
      `}
    >
      <SidebarHeader
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        toggleTitle={collapsed ? t('action.expand') : t('action.collapse')}
      />

      {!collapsed && (
        <SearchInput value={searchQuery} onChange={handleSearch} />
      )}

      {/* 可滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
        <SmartFilterList
          counts={counts}
          selectedFilter={selectedFilter}
          collapsed={collapsed}
          onFilterChange={onFilterChange}
        />

        <ProjectList
          projects={projects}
          tasks={tasks}
          selectedFilter={selectedFilter}
          collapsed={collapsed}
          onFilterChange={onFilterChange}
        />
      </div>

      <SidebarFooter collapsed={collapsed} projects={projects} />
    </aside>
  )
}
