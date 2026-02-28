import { useState, useCallback, memo, useMemo } from 'react'
import { Empty, Alert, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import { TaskEditor } from '../Task/TaskEditor'
import { TaskListHeader } from './TaskListHeader'
import { QuickAddInput } from './QuickAddInput'
import { TaskDateGroup } from './TaskDateGroup'
import { usePersistedSet } from '@/hooks/usePersistedSet'
import { FILTER_NAMES } from '@/constants/task'
import type { Task, Project } from '@/types'
import type { TaskGroup } from '@/utils/taskFilters'

// 不显示快速添加的 filter（逻辑不明确，避免混淆）
const FILTERS_WITHOUT_QUICK_ADD: string[] = [
  FILTER_NAMES.WEEK,
  FILTER_NAMES.OVERDUE,
  FILTER_NAMES.NODATE,
]

interface TaskListProps {
  projects: Project[]
  loading: boolean
  error: string | null
  filter: string
  searchQuery?: string
  /** 从 useTasks().filters 传入的分组函数 */
  getTaskGroups: (filter: string, searchQuery?: string) => TaskGroup[]
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onCreate: (task: Partial<Task>) => Promise<Task>
  onFocus?: () => void
}

export const TaskList = memo(function TaskList({
  projects,
  loading,
  error,
  filter,
  searchQuery,
  getTaskGroups,
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

  // 使用传入的分组函数
  const groups = useMemo(
    () => getTaskGroups(filter, searchQuery),
    [getTaskGroups, filter, searchQuery]
  )
  const taskCount = groups.reduce((sum, g) => sum + g.tasks.length, 0)

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task)
    setIsEditorOpen(true)
  }, [])

  const handleNew = useCallback(() => {
    setEditingTask(null)
    setIsEditorOpen(true)
  }, [])

  const handleSave = useCallback(
    async (taskId: string | null, values: Partial<Task>) => {
      if (taskId) {
        await onUpdate(taskId, values)
      } else {
        await onCreate(values)
      }
      setIsEditorOpen(false)
      setEditingTask(null)
    },
    [onUpdate, onCreate]
  )

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false)
    setEditingTask(null)
  }, [])

  return (
    <div className="flex flex-col h-full bg-transparent relative py-10 px-[60px] overflow-hidden max-md:p-5">
      <TaskListHeader
        filter={filter}
        projects={projects}
        taskCount={taskCount}
        onFocus={onFocus}
      />

      {!FILTERS_WITHOUT_QUICK_ADD.includes(filter) && (
        <QuickAddInput
          filter={filter}
          onCreate={onCreate}
          onOpenEditor={handleNew}
        />
      )}

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
          <div className="flex items-center justify-center py-20">
            <Spin />
          </div>
        ) : groups.length === 0 ? (
          <Empty
            description={t('empty.noTasks')}
            className="!py-[100px] !px-5 !bg-transparent"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          groups.map((group) => (
            <TaskDateGroup
              key={group.id}
              group={group}
              projects={projects}
              isCollapsed={collapsedGroups.has(group.id)}
              showGroupTitle={groups.length > 1}
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
        filter={filter}
        open={isEditorOpen}
        onCancel={handleCloseEditor}
        onSave={handleSave}
      />
    </div>
  )
})
