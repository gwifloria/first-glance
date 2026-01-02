import { useState, useMemo } from 'react'
import { Empty, Alert, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import { TaskItem } from './TaskItem'
import { TaskEditor } from './TaskEditor'
import { CollapseArrow } from './CollapseArrow'
import { FocusButton } from './FocusButton'
import { TaskSkeleton } from './TaskSkeleton'
import { Clock } from './common/Clock'
import { useSettings } from '@/hooks/useSettings'
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
  const { settings } = useSettings()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [quickAddValue, setQuickAddValue] = useState('')

  // 分组折叠状态
  const [collapsedGroups, toggleGroup] = usePersistedSet('taskGroupCollapsed')

  // 使用统一的日期 Hook
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

  const handleQuickAdd = async () => {
    if (!quickAddValue.trim()) return

    let projectId: string | undefined
    let dueDate: string | undefined

    // 根据 filter 设置 projectId
    if (filter.startsWith('project:')) {
      projectId = filter.replace('project:', '')
    } else if (settings.defaultProjectId) {
      projectId = settings.defaultProjectId
    } else {
      projectId = projects[0]?.id
    }

    // 根据 filter 设置 dueDate
    if (filter === 'today') {
      dueDate = todayStr + 'T00:00:00.000+0000'
    } else if (filter === 'tomorrow') {
      dueDate = tomorrowStr + 'T00:00:00.000+0000'
    }
    // week/overdue/nodate 不设置默认日期

    await onCreate({
      title: quickAddValue.trim(),
      projectId,
      dueDate,
    })
    setQuickAddValue('')
  }

  const getProjectById = (projectId: string) =>
    projects.find((p) => p.id === projectId)

  const getFilterTitle = () => {
    if (filter.startsWith('project:')) {
      const projectId = filter.replace('project:', '')
      const project = projects.find((p) => p.id === projectId)
      return project?.name || t('common:label.list')
    }
    const filterKeys: Record<string, string> = {
      all: 'filter.all',
      today: 'filter.today',
      tomorrow: 'filter.tomorrow',
      week: 'filter.week',
      overdue: 'filter.overdue',
      nodate: 'filter.noDate',
    }
    const key = filterKeys[filter]
    return key ? t(key) : t('filter.default')
  }

  const getFilterLabel = () => {
    if (filter.startsWith('project:')) {
      return t('common:label.list')
    }
    return t('common:label.smartList')
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative py-10 px-[60px] overflow-hidden max-md:p-5">
      {/* 头部 */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-secondary)] tracking-[1px]">
            {getFilterLabel()}
          </span>
          <div className="flex items-baseline gap-2">
            <h1 className="text-[32px] max-md:text-2xl font-light text-[var(--text-primary)] m-0 font-[var(--font-secondary)]">
              {getFilterTitle()}
            </h1>
            <span className="text-base text-[var(--warning)]">✦</span>
            <span className="text-2xl font-light text-[var(--text-secondary)]">
              {filteredTasks.length}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-6">
          {/* Focus 按钮 */}
          {onFocus && <FocusButton onClick={onFocus} size="large" />}
          <div className="text-right">
            <div className="text-xs text-[var(--text-secondary)] mb-1">
              {t('common:message.todayIsGift')}
            </div>
            <Clock variant="small" showDate />
          </div>
        </div>
      </div>

      {/* 快速添加 */}
      <div className="mb-6">
        <Input
          placeholder={t('placeholder.quickAdd')}
          value={quickAddValue}
          onChange={(e) => setQuickAddValue(e.target.value)}
          onPressEnter={handleQuickAdd}
          className="quick-add-input"
          variant="borderless"
          suffix={
            <span
              className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-card)] py-0.5 px-1.5 rounded cursor-pointer hover:bg-[var(--border)]"
              onClick={handleNew}
            >
              ⌘ K
            </span>
          }
        />
      </div>

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
          sortedGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.id)
            return (
              <div key={group.id} className="mb-4">
                {/* 只有多个分组时才显示分组标题 */}
                {sortedGroups.length > 1 && (
                  <div
                    className="flex items-center gap-2 py-3 cursor-pointer select-none border-b border-[var(--border)] mb-2 hover:opacity-80"
                    onClick={() => toggleGroup(group.id)}
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
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
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
