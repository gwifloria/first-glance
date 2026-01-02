import { CollapseArrow } from '../CollapseArrow'
import { TaskItem } from '../Task/TaskItem'
import type { Task, Project } from '@/types'
import type { TaskGroup } from '@/utils/taskFilters'

interface TaskGroupSectionProps {
  group: TaskGroup
  projects: Project[]
  isCollapsed: boolean
  showGroupTitle: boolean
  onToggle: () => void
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
}

export function TaskGroupSection({
  group,
  projects,
  isCollapsed,
  showGroupTitle,
  onToggle,
  onComplete,
  onDelete,
  onEdit,
}: TaskGroupSectionProps) {
  const getProjectById = (projectId: string) =>
    projects.find((p) => p.id === projectId)

  return (
    <div className="mb-4">
      {showGroupTitle && (
        <div
          className="flex items-center gap-2 py-3 cursor-pointer select-none border-b border-[var(--border)] mb-2 hover:opacity-80"
          onClick={onToggle}
        >
          <CollapseArrow isCollapsed={isCollapsed} />
          <span className="text-[11px] font-medium text-[var(--text-secondary)] tracking-[1px]">
            {group.title.toUpperCase()}
          </span>
          <span className="ml-auto text-xs text-[var(--text-secondary)]">
            {group.tasks.length}
          </span>
        </div>
      )}
      {!isCollapsed && (
        <div className="flex flex-col gap-1">
          {group.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              project={getProjectById(task.projectId)}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
