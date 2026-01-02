import { memo } from 'react'
import { CollapseArrow } from './CollapseArrow'
import { FilterItem } from './FilterItem'

interface ProjectWithCount {
  id: string
  name: string
  color?: string
  sortOrder: number
  count: number
}

interface FolderGroup {
  id: string
  name: string
  projects: ProjectWithCount[]
}

interface FolderItemProps {
  folder: FolderGroup
  collapsed: boolean
  isFolderCollapsed: boolean
  selectedFilter: string
  onToggleFolder: () => void
  onFilterChange: (filter: string) => void
}

export const FolderItem = memo(function FolderItem({
  folder,
  collapsed,
  isFolderCollapsed,
  selectedFilter,
  onToggleFolder,
  onFilterChange,
}: FolderItemProps) {
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
})
