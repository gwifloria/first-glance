import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePersistedSet } from '@/hooks/usePersistedSet'
import type { Project, Task } from '@/types'
import { FilterItem } from './FilterItem'
import { FolderItem } from './FolderItem'

interface ProjectWithCount extends Project {
  count: number
}

interface FolderGroup {
  id: string
  name: string
  projects: ProjectWithCount[]
}

interface ProjectListProps {
  projects: Project[]
  tasks: Task[]
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

export function ProjectList({
  projects,
  tasks,
  selectedFilter,
  collapsed,
  onFilterChange,
}: ProjectListProps) {
  const { t } = useTranslation('sidebar')
  const [collapsedFolders, toggleFolder] = usePersistedSet(
    'sidebarFoldersCollapsed'
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
        name: t('folder.defaultName', { index: folderIndex }),
        projects: projectList.sort((a, b) => a.sortOrder - b.sortOrder),
      })
    })

    return {
      folders: folderList.sort((a, b) => a.id.localeCompare(b.id)),
      ungroupedProjects: ungrouped.sort((a, b) => a.sortOrder - b.sortOrder),
    }
  }, [projects, t, tasks])

  return (
    <div className="mb-4">
      {!collapsed && <SectionTitle title={t('section.lists')} />}

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
  )
}
