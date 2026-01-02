import { useState, useMemo } from 'react'
import { Empty, Alert } from 'antd'
import { useTranslation } from 'react-i18next'
import { TaskEditor } from '../Task/TaskEditor'
import { TaskSkeleton } from '../Task/TaskSkeleton'
import { TaskListHeader } from './TaskListHeader'
import { QuickAddInput } from './QuickAddInput'
import { TaskGroupSection } from './TaskGroupSection'
import { usePersistedSet } from '@/hooks/usePersistedSet'
import { useRelativeDates } from '@/hooks/useRelativeDates'
import { filterTasks, sortTasks, type TaskGroup } from '@/utils/taskFilters'
import { extractDateStr } from '@/utils/date'
import type { Task, Project } from '@/types'

interface TaskListProps {
  tasks: Task[]
  projects: Project[]
  loading: boolean
  error: string | null
  filter: string
  searchQuery?: string
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onCreate: (task: Partial<Task>) => Promise<Task>
  onFocus?: () => void
}

export function TaskList({
  tasks,
  projects,
  loading,
  error,
  filter,
  searchQuery,
  onComplete,
  onDelete,
  onUpdate,
  onCreate,
  onFocus,
}: TaskListProps) {
  const { t } = useTranslation('task')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [collapsedGroups, toggleGroup] = usePersistedSet('taskGroupCollapsed')
  const { todayStr, tomorrowStr, dayAfterStr } = useRelativeDates()

  // 使用统一的过滤函数
  const filteredTasks = useMemo(
    () => sortTasks(filterTasks(tasks, filter, searchQuery), 'priority'),
    [tasks, filter, searchQuery]
  )

  // 按日期分组
  const groupedTasks = useMemo<TaskGroup[]>(() => {
    const groups: TaskGroup[] = []

    // 置顶任务 (sortOrder 较大的表示置顶)
    const pinned = filteredTasks.filter((t) => t.sortOrder > 0)
    if (pinned.length > 0) {
      groups.push({
        id: 'pinned',
        title: t('group.pinned'),
        tasks: pinned.sort((a, b) => b.sortOrder - a.sortOrder),
      })
    }

    // 非置顶任务
    const unpinned = filteredTasks.filter((t) => t.sortOrder <= 0)

    // 已过期
    const overdue = unpinned.filter((task) => {
      if (!task.dueDate) return false
      const taskDateStr = extractDateStr(task.dueDate)
      return taskDateStr < todayStr
    })
    if (overdue.length > 0) {
      groups.push({ id: 'overdue', title: t('group.overdue'), tasks: overdue })
    }

    // 今天
    const todayTasks = unpinned.filter((task) => {
      if (!task.dueDate) return false
      return extractDateStr(task.dueDate) === todayStr
    })
    if (todayTasks.length > 0) {
      groups.push({ id: 'today', title: t('group.today'), tasks: todayTasks })
    }

    // 明天
    const tomorrowTasks = unpinned.filter((task) => {
      if (!task.dueDate) return false
      return extractDateStr(task.dueDate) === tomorrowStr
    })
    if (tomorrowTasks.length > 0) {
      groups.push({
        id: 'tomorrow',
        title: t('group.tomorrow'),
        tasks: tomorrowTasks,
      })
    }

    // 之后
    const later = unpinned.filter((task) => {
      if (!task.dueDate) return false
      return extractDateStr(task.dueDate) >= dayAfterStr
    })
    if (later.length > 0) {
      groups.push({ id: 'later', title: t('group.later'), tasks: later })
    }

    // 无日期
    const noDate = unpinned.filter((task) => !task.dueDate)
    if (noDate.length > 0) {
      groups.push({ id: 'nodate', title: t('group.noDate'), tasks: noDate })
    }

    return groups
  }, [filteredTasks, todayStr, tomorrowStr, dayAfterStr, t])

  // 对每组内的任务排序（按优先级）
  const sortedGroups = useMemo(() => {
    return groupedTasks.map((group) => ({
      ...group,
      tasks: [...group.tasks].sort((a, b) => b.priority - a.priority),
    }))
  }, [groupedTasks])

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsEditorOpen(true)
  }

  const handleNew = () => {
    setEditingTask(null)
    setIsEditorOpen(true)
  }

  const handleSave = async (taskId: string | null, values: Partial<Task>) => {
    if (taskId) {
      onUpdate(taskId, values)
    } else {
      await onCreate(values)
    }
    setIsEditorOpen(false)
    setEditingTask(null)
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative py-10 px-[60px] overflow-hidden max-md:p-5">
      <TaskListHeader
        filter={filter}
        projects={projects}
        taskCount={filteredTasks.length}
        onFocus={onFocus}
      />

      <QuickAddInput
        filter={filter}
        projects={projects}
        onCreate={onCreate}
        onOpenEditor={handleNew}
      />

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          className="!mb-4 !rounded-lg"
        />
      )}

      <div className="flex-1 overflow-y-auto -mx-5 px-5">
        {loading ? (
          <TaskSkeleton count={6} />
        ) : sortedGroups.length === 0 ? (
          <Empty
            description={t('empty.noTasks')}
            className="!py-[100px] !px-5 !bg-transparent"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          sortedGroups.map((group) => (
            <TaskGroupSection
              key={group.id}
              group={group}
              projects={projects}
              isCollapsed={collapsedGroups.has(group.id)}
              showGroupTitle={sortedGroups.length > 1}
              onToggle={() => toggleGroup(group.id)}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>

      {/* 右下角水印 */}
      <div className="absolute right-10 bottom-10 text-sm text-[var(--border)] italic pointer-events-none">
        today
      </div>

      <TaskEditor
        task={editingTask}
        projects={projects}
        open={isEditorOpen}
        onCancel={() => {
          setIsEditorOpen(false)
          setEditingTask(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
