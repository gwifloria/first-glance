import { memo, useMemo, useState } from 'react'
import { RightOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import { getParentTitle } from '@/utils/taskMap'
import { TaskItem } from '../Task/TaskItem'
import type { Task, Project } from '@/types'
import type { TaskGroup } from '@/utils/taskFilters'

// 可翻译的分组 ID
const TRANSLATABLE_GROUPS = new Set([
  'all',
  'overdue',
  'today',
  'tomorrow',
  'week',
  'later',
  'nodate',
  'inbox',
  'high',
  'medium',
  'low',
  'none',
  'pinned',
])

interface TaskDateGroupProps {
  group: TaskGroup
  projects: Project[]
  isCollapsed: boolean
  showGroupTitle: boolean
  onToggle: () => void
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
}

export const TaskDateGroup = memo(function TaskDateGroup({
  group,
  projects,
  isCollapsed,
  showGroupTitle,
  onToggle,
  onComplete,
  onDelete,
  onEdit,
}: TaskDateGroupProps) {
  const { t } = useTranslation('task')
  const {
    data: { taskMap, tasks: allTasks },
  } = useTaskContext()

  // 展开/折叠子任务状态（默认全部展开）
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  // parentId → children[] 映射
  const childrenMap = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of allTasks) {
      if (task.parentId && taskMap.has(task.parentId)) {
        const children = map.get(task.parentId) ?? []
        children.push(task)
        map.set(task.parentId, children)
      }
    }
    return map
  }, [allTasks, taskMap])

  // 只保留 root 任务（无 parentId 或 parent 不在 taskMap 中的孤儿）
  const rootTasks = useMemo(
    () => group.tasks.filter((t) => !t.parentId || !taskMap.has(t.parentId)),
    [group.tasks, taskMap]
  )

  const getProjectById = (projectId: string) =>
    projects.find((p) => p.id === projectId)

  // 根据分组 ID 获取翻译后的标题，项目名称直接使用
  const groupTitle = TRANSLATABLE_GROUPS.has(group.id)
    ? t(`group.${group.id}`)
    : group.title

  return (
    <div className="mb-4">
      {showGroupTitle && (
        <div
          className="flex items-center gap-2 py-3 cursor-pointer select-none border-b border-[var(--border)] mb-2 hover:opacity-80"
          onClick={onToggle}
        >
          <RightOutlined
            className={`text-[10px] text-[var(--text-secondary)] transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
          />
          <span className="text-[11px] font-medium text-[var(--text-secondary)] tracking-[1px]">
            {groupTitle.toUpperCase()}
          </span>
          <span className="ml-auto text-xs text-[var(--text-secondary)]">
            {group.tasks.length}
          </span>
        </div>
      )}
      {!isCollapsed && (
        <div className="flex flex-col gap-1">
          {rootTasks.map((task) => {
            const children = childrenMap.get(task.id)
            const hasChildren = !!children && children.length > 0
            const isExpanded = hasChildren && !expandedTasks.has(task.id)

            return (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  project={getProjectById(task.projectId)}
                  parentTitle={getParentTitle(task, taskMap)}
                  expandable={hasChildren}
                  expanded={isExpanded}
                  onToggleExpand={() => toggleExpand(task.id)}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
                {hasChildren && isExpanded && (
                  <div className="pl-10 flex flex-col gap-1">
                    {children.map((child) => (
                      <TaskItem
                        key={child.id}
                        task={child}
                        project={getProjectById(child.projectId)}
                        onComplete={onComplete}
                        onDelete={onDelete}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
