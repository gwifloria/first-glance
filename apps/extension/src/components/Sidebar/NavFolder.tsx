import { memo } from 'react'
import { RightOutlined } from '@ant-design/icons'
import { NavItem } from './NavItem'
import type { FolderGroup } from './types'

interface NavFolderProps {
  folder: FolderGroup
  collapsed: boolean
  isFolderCollapsed: boolean
  selectedFilter: string
  onToggleFolder: () => void
  onFilterChange: (filter: string) => void
}

const baseButtonClass =
  'flex items-center cursor-pointer rounded-lg transition-all duration-200 ease-out hover:bg-[var(--overlay-hover-surface)] select-none'

export const NavFolder = memo(function NavFolder({
  folder,
  collapsed,
  isFolderCollapsed,
  selectedFilter,
  onToggleFolder,
  onFilterChange,
}: NavFolderProps) {
  const opacityClass = isFolderCollapsed ? 'opacity-80' : ''

  return (
    <div className="my-1">
      {collapsed ? (
        <div
          onClick={onToggleFolder}
          title={folder.name}
          className={`${baseButtonClass} justify-center py-2 px-2 ${opacityClass}`}
        >
          <RightOutlined
            className={`text-[10px] text-[var(--text-secondary)] transition-transform duration-200 ${isFolderCollapsed ? '' : 'rotate-90'}`}
          />
        </div>
      ) : (
        <div
          onClick={onToggleFolder}
          className={`${baseButtonClass} gap-1 py-2 px-3 hover:translate-x-0.5 ${opacityClass}`}
        >
          <RightOutlined
            className={`text-[10px] text-[var(--text-secondary)] transition-transform duration-200 ${isFolderCollapsed ? '' : 'rotate-90'}`}
          />
          <span className="text-[0.6875rem] font-medium text-[var(--text-secondary)] tracking-wide font-[family-name:var(--font-heading)]">
            {folder.name.toUpperCase()}
          </span>
        </div>
      )}
      {!isFolderCollapsed && (
        <div className={collapsed ? '' : 'ml-1'}>
          {folder.projects.map((project) => (
            <NavItem
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
