import { useMemo, useState } from 'react'
import {
  CalendarOutlined,
  FieldTimeOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useTheme } from '@/contexts/ThemeContext'
import { SettingsModal } from './SettingsModal'
import { SearchInput } from './SearchInput'
import { CollapseArrow } from './CollapseArrow'
import { ProjectColorDot } from './ProjectColorDot'
import { usePersistedSet } from '@/hooks/usePersistedSet'
import { usePersistedBoolean } from '@/hooks/usePersistedBoolean'
import { useRelativeDates } from '@/hooks/useRelativeDates'
import { extractDateStr } from '@/utils/date'
import type { ThemeType } from '@/themes'
import type { Task, Project } from '@/types'

// 主题配置
const themeOptions: { type: ThemeType; color: string; name: string }[] = [
  { type: 'journal', color: '#E8E4DF', name: '手帐' },
  { type: 'rose', color: '#F5F0ED', name: '玫瑰' },
  { type: 'ocean', color: '#D8E3E8', name: '海洋' },
  { type: 'tech', color: '#1C1C1E', name: '暗黑' },
]

interface SidebarProps {
  tasks: Task[]
  projects: Project[]
  selectedFilter: string
  onFilterChange: (filter: string) => void
  onSearch?: (query: string) => void
}

interface SmartFilter {
  id: string
  name: string
  icon: React.ReactNode
  count: number
}

interface ProjectWithCount extends Project {
  count: number
}

interface FolderGroup {
  id: string
  name: string
  projects: ProjectWithCount[]
}

// 侧边栏头部组件
function SidebarHeader({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { themeType, setThemeType } = useTheme()

  return (
    <div className={`p-4 pb-2 ${collapsed ? 'px-2' : ''}`}>
      <div
        className={`flex items-center gap-2 mb-3 ${collapsed ? 'flex-col' : ''}`}
      >
        <span className="text-lg">🌸</span>
        {!collapsed && (
          <>
            <span className="font-medium text-[var(--text-primary)]">
              Wonderland
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              {themeOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setThemeType(option.type)}
                  title={option.name}
                  className={`
                    w-3 h-3 rounded-full transition-all cursor-pointer border-0 p-0
                    ${themeType === option.type ? 'ring-2 ring-offset-1 ring-[var(--text-secondary)] scale-110' : 'opacity-70 hover:opacity-100 hover:scale-110'}
                  `}
                  style={{ backgroundColor: option.color }}
                />
              ))}
              <button
                onClick={onToggleCollapse}
                title="折叠侧边栏"
                className="w-5 h-5 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border-0 bg-transparent p-0 ml-1"
              >
                <MenuFoldOutlined className="text-xs" />
              </button>
            </div>
          </>
        )}
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            title="展开侧边栏"
            className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border-0 bg-transparent p-0 mt-1"
          >
            <MenuUnfoldOutlined className="text-sm" />
          </button>
        )}
      </div>
    </div>
  )
}

// 分组标题组件
function SectionTitle({ title }: { title: string }) {
  return (
    <div className="px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)] tracking-wide flex items-center gap-1">
      <span className="text-xs">›</span>
      {title}
    </div>
  )
}

// 筛选项组件
function FilterItem({
  active,
  onClick,
  icon,
  name,
  count,
  nested = false,
  color,
  collapsed = false,
}: {
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
  name: string
  count: number
  nested?: boolean
  color?: string
  collapsed?: boolean
}) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? name : undefined}
      className={`
        flex items-center gap-2.5 py-2 cursor-pointer rounded-lg my-0.5
        transition-all duration-200 ease-out
        ${collapsed ? 'justify-center px-2' : 'px-3'}
        ${nested && !collapsed ? 'pl-7' : ''}
        ${active ? 'bg-[var(--accent-light)]' : 'hover:bg-black/[0.04] hover:translate-x-0.5'}
      `}
    >
      {icon ? (
        <span
          className={`text-base w-5 flex items-center justify-center shrink-0 ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
        >
          {icon}
        </span>
      ) : (
        <ProjectColorDot color={color} />
      )}
      {!collapsed && (
        <>
          <span className="flex-1 text-[13px] text-[var(--text-primary)] truncate">
            {name}
          </span>
          {count > 0 && (
            <span
              className={`
                text-xs font-normal
                ${
                  active
                    ? 'bg-[var(--accent)] text-white min-w-[18px] h-[18px] leading-[18px] rounded-[9px] px-1.5 text-center'
                    : 'text-[var(--text-secondary)]'
                }
              `}
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </>
      )}
    </div>
  )
}

// 文件夹组件
function FolderItem({
  folder,
  collapsed,
  isFolderCollapsed,
  selectedFilter,
  onToggleFolder,
  onFilterChange,
}: {
  folder: FolderGroup
  collapsed: boolean
  isFolderCollapsed: boolean
  selectedFilter: string
  onToggleFolder: () => void
  onFilterChange: (filter: string) => void
}) {
  return (
    <div className="my-1">
      {collapsed ? (
        <div
          onClick={onToggleFolder}
          title={folder.name}
          className={`flex items-center justify-center py-2 px-2 cursor-pointer rounded-lg transition-all duration-200 ease-out hover:bg-black/[0.04] select-none ${isFolderCollapsed ? 'opacity-80' : ''}`}
        >
          <CollapseArrow isCollapsed={isFolderCollapsed} />
        </div>
      ) : (
        <div
          onClick={onToggleFolder}
          className={`flex items-center gap-1 py-2 px-3 cursor-pointer rounded-lg transition-all duration-200 ease-out hover:bg-black/[0.04] hover:translate-x-0.5 select-none ${isFolderCollapsed ? 'opacity-80' : ''}`}
        >
          <CollapseArrow isCollapsed={isFolderCollapsed} />
          <span className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide">
            {folder.name.toUpperCase()}
          </span>
        </div>
      )}
      {!isFolderCollapsed && (
        <div className={collapsed ? '' : 'ml-1'}>
          {folder.projects.map((project) => (
            <FilterItem
              key={project.id}
              active={selectedFilter === `project:${project.id}`}
              onClick={() => onFilterChange(`project:${project.id}`)}
              name={project.name}
              count={project.count}
              color={project.color}
              nested={!collapsed}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  tasks,
  projects,
  selectedFilter,
  onFilterChange,
  onSearch,
}: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedFolders, toggleFolder] = usePersistedSet(
    'sidebarFoldersCollapsed'
  )
  const [collapsed, toggleCollapsed] = usePersistedBoolean('sidebarCollapsed')

  const { todayStr, tomorrowStr, nextWeekStr } = useRelativeDates()

  const smartFilters = useMemo<SmartFilter[]>(
    () => [
      {
        id: 'inbox',
        name: '收集箱',
        icon: <InboxOutlined />,
        count: tasks.filter((t) => t.projectId.startsWith('inbox')).length,
      },
      {
        id: 'today',
        name: '今天',
        icon: <FieldTimeOutlined />,
        count: tasks.filter(
          (t) => t.dueDate && extractDateStr(t.dueDate) === todayStr
        ).length,
      },
      {
        id: 'tomorrow',
        name: '明天',
        icon: <CalendarOutlined />,
        count: tasks.filter(
          (t) => t.dueDate && extractDateStr(t.dueDate) === tomorrowStr
        ).length,
      },
      {
        id: 'week',
        name: '最近7天',
        icon: <CalendarOutlined />,
        count: tasks.filter((t) => {
          if (!t.dueDate) return false
          const d = extractDateStr(t.dueDate)
          return d >= todayStr && d < nextWeekStr
        }).length,
      },
      {
        id: 'overdue',
        name: '已过期',
        icon: <ClockCircleOutlined />,
        count: tasks.filter(
          (t) => t.dueDate && extractDateStr(t.dueDate) < todayStr
        ).length,
      },
    ],
    [tasks, todayStr, tomorrowStr, nextWeekStr]
  )

  const { folders, ungroupedProjects } = useMemo(() => {
    const projectsWithCount: ProjectWithCount[] = projects
      .filter((p) => !p.closed)
      .map((p) => ({
        ...p,
        count: tasks.filter((t) => t.projectId === p.id).length,
      }))

    const folderMap = new Map<string, ProjectWithCount[]>()
    const ungrouped: ProjectWithCount[] = []

    projectsWithCount.forEach((p) => {
      if (p.groupId) {
        if (!folderMap.has(p.groupId)) folderMap.set(p.groupId, [])
        folderMap.get(p.groupId)!.push(p)
      } else {
        ungrouped.push(p)
      }
    })

    // Open API 不返回文件夹项目，只返回子项目及其 groupId
    // 因此无法获取文件夹名称，只能显示默认名称
    const folderList: FolderGroup[] = []
    let folderIndex = 0
    folderMap.forEach((projectList, groupId) => {
      folderIndex++
      folderList.push({
        id: groupId,
        name: `文件夹 ${folderIndex}`,
        projects: projectList.sort((a, b) => a.sortOrder - b.sortOrder),
      })
    })

    return {
      folders: folderList.sort((a, b) => a.id.localeCompare(b.id)),
      ungroupedProjects: ungrouped.sort((a, b) => a.sortOrder - b.sortOrder),
    }
  }, [projects, tasks])

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
      <SidebarHeader collapsed={collapsed} onToggleCollapse={toggleCollapsed} />

      {!collapsed && (
        <SearchInput value={searchQuery} onChange={handleSearch} />
      )}

      {/* 可滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
        {/* 智能清单 */}
        <div className="mb-2">
          {!collapsed && <SectionTitle title="智能清单" />}
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

        {/* 清单 */}
        <div className="mb-4">
          {!collapsed && <SectionTitle title="清单" />}

          {ungroupedProjects.map((project) => (
            <FilterItem
              key={project.id}
              active={selectedFilter === `project:${project.id}`}
              onClick={() => onFilterChange(`project:${project.id}`)}
              name={project.name}
              count={project.count}
              color={project.color}
              collapsed={collapsed}
            />
          ))}

          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              collapsed={collapsed}
              isFolderCollapsed={collapsedFolders.has(folder.id)}
              selectedFilter={selectedFilter}
              onToggleFolder={() => toggleFolder(folder.id)}
              onFilterChange={onFilterChange}
            />
          ))}
        </div>
      </div>

      {/* 底部设置按钮 */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={() => setSettingsOpen(true)}
          title={collapsed ? '设置' : undefined}
          className={`
            flex items-center gap-2 w-full py-2 text-[13px] text-[var(--text-secondary)] rounded-lg
            hover:bg-black/[0.04] transition-all duration-200 ease-out cursor-pointer border-0 bg-transparent
            ${collapsed ? 'justify-center px-2' : 'px-3 hover:translate-x-0.5'}
          `}
        >
          <SettingOutlined />
          {!collapsed && <span>设置</span>}
        </button>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projects={projects}
      />
    </aside>
  )
}
