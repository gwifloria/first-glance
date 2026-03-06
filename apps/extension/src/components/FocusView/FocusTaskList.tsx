import { useAppMode } from '@/contexts/useAppMode'
import { useTaskContext } from '@/contexts/TaskContext'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import { getParentTitle } from '@/utils/taskMap'
import { renderMarkdownLinks } from '@/utils/renderMarkdownLinks'
import type { Task } from '@/types'
import { Button, Checkbox, message, Popover, Spin } from 'antd'
import { PlayCircleOutlined, AimOutlined } from '@ant-design/icons'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskCheckbox } from '../common/TaskCheckbox'
import { FocusTaskInput } from './FocusTaskInput'

const MAX_LOCAL_TASKS = 3

interface FocusTaskItemProps {
  task: Task
  parentTitle?: string
  childInfo?: { total: number; completed: number }
  children?: Task[]
  onComplete: (task: Task) => void
  onCompleteChild: (task: Task) => void
  onStartPomodoro?: (task: Task) => void
  onBindTask?: (task: Task) => void
  isIdle?: boolean
  isFocusingUnbound?: boolean
  isHighlighted?: boolean
}

const FocusTaskItem = memo(function FocusTaskItem({
  task,
  parentTitle,
  childInfo,
  children: childTasks,
  onComplete,
  onCompleteChild,
  onStartPomodoro,
  onBindTask,
  isIdle,
  isFocusingUnbound,
  isHighlighted,
}: FocusTaskItemProps) {
  const { t } = useTranslation('focus')
  const { completing, handleComplete } = useTaskCompletion(onComplete, {
    delayBefore: false,
  })

  // 合并 checklist items 和 child tasks 的计数
  const subtaskCount = useMemo(() => {
    let total = 0
    let completed = 0
    if (task.items && task.items.length > 0) {
      total += task.items.length
      completed += task.items.filter((item) => item.status !== 0).length
    }
    if (childInfo) {
      total += childInfo.total
      completed += childInfo.completed
    }
    return total > 0 ? { total, completed } : null
  }, [task.items, childInfo])

  return (
    <div
      className={`
        group flex items-center gap-5 py-4 px-5 bg-[var(--bg-card)] rounded-xl shadow-sm
        transition-all duration-300 ease-out
        ${completing ? 'animate-[taskComplete_0.4s_ease-out_forwards]' : ''}
        ${isHighlighted ? 'ring-2 ring-[var(--accent)] ring-opacity-60 scale-[1.02]' : ''}
      `}
    >
      <TaskCheckbox
        completing={completing}
        onComplete={() => handleComplete(task)}
        variant="focus"
        disabled={completing}
      />
      <div className="flex-1 flex flex-col">
        {parentTitle && (
          <span className="text-xs text-[var(--text-secondary)] leading-tight mb-0.5 inline-flex items-center gap-0.5 bg-[var(--bg-secondary)] rounded px-1.5 py-0.5 w-fit">
            <span className="opacity-60">↳</span> {parentTitle}
          </span>
        )}
        <span
          className={`text-xl text-[var(--text-primary)] transition-all duration-200 font-hand ${isHighlighted ? 'text-2xl font-bold' : ''} ${completing ? 'line-through text-[var(--text-secondary)]' : ''}`}
        >
          {renderMarkdownLinks(task.title)}
        </span>
        {subtaskCount && (
          <Popover
            placement="bottomLeft"
            trigger="click"
            content={
              <div className="max-w-[200px] space-y-1.5">
                {childTasks?.map((child) => (
                  <div key={child.id} className="flex items-center gap-1.5">
                    <TaskCheckbox
                      completing={false}
                      onComplete={() => onCompleteChild(child)}
                      variant="default"
                    />
                    <span
                      className={`text-xs truncate ${child.status === 2 ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
                    >
                      {child.title}
                    </span>
                  </div>
                ))}
                {task.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <Checkbox checked={item.status !== 0} disabled />
                    <span
                      className={`text-xs truncate ${item.status !== 0 ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            }
          >
            <span className="text-xs text-[var(--text-secondary)] mt-0.5 cursor-pointer hover:text-[var(--text-primary)] transition-colors">
              {t('subtaskProgress', {
                completed: subtaskCount.completed,
                total: subtaskCount.total,
              })}
            </span>
          </Popover>
        )}
      </div>
      {/* idle 模式：hover 显示开始番茄按钮 */}
      {isIdle && onStartPomodoro && (
        <Button
          type="text"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => onStartPomodoro(task)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 !text-[var(--text-secondary)] hover:!text-[var(--accent)]"
          title={t('pomodoro.start')}
        />
      )}
      {/* focusing 且未绑定任务：hover 显示绑定按钮 */}
      {isFocusingUnbound && onBindTask && (
        <Button
          type="text"
          size="small"
          icon={<AimOutlined />}
          onClick={() => onBindTask(task)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 !text-[var(--text-secondary)] hover:!text-[var(--accent)]"
          title={t('pomodoro.bindTask')}
        />
      )}
    </div>
  )
})

interface FocusTaskListProps {
  immersive?: boolean
  currentTaskId?: string | null
  onStartPomodoro?: (task: Task) => void
  onBindTask?: (task: Task) => void
  isIdle?: boolean
}

export function FocusTaskList({
  immersive,
  currentTaskId,
  onStartPomodoro,
  onBindTask,
  isIdle,
}: FocusTaskListProps) {
  const { t } = useTranslation('focus')
  const { t: tCommon } = useTranslation('common')
  const { isGuest } = useAppMode()

  const { data, actions, views } = useTaskContext()
  const { tasks, loading: tasksLoading, taskMap } = data
  const { completeTask, createTask } = actions
  const { focusTasks } = views

  // 沉浸模式 + 有绑定任务时，只显示该任务
  const displayTasks = useMemo(() => {
    if (immersive && currentTaskId) {
      return focusTasks.filter((t) => t.id === currentTaskId)
    }
    return focusTasks
  }, [immersive, currentTaskId, focusTasks])

  // 从所有 tasks 中构建子任务计数 map 和子任务列表 map
  const { childCountMap, childrenMap } = useMemo(() => {
    const countMap = new Map<string, { total: number; completed: number }>()
    const listMap = new Map<string, Task[]>()
    for (const task of tasks) {
      if (task.parentId) {
        const entry = countMap.get(task.parentId) ?? { total: 0, completed: 0 }
        entry.total++
        if (task.status === 2) entry.completed++
        countMap.set(task.parentId, entry)

        const list = listMap.get(task.parentId) ?? []
        list.push(task)
        listMap.set(task.parentId, list)
      }
    }
    return { childCountMap: countMap, childrenMap: listMap }
  }, [tasks])

  // 只在初始加载时显示 skeleton，连接过程中保持显示原内容
  const loading = tasksLoading && tasks.length === 0
  const canAddMore = isGuest ? focusTasks.length < MAX_LOCAL_TASKS : true
  const focusingUnbound = !!immersive && !currentTaskId

  const handleCreate = useCallback(
    async (taskData: Partial<Task>): Promise<Task | null> => {
      try {
        return await createTask(taskData)
      } catch (err) {
        if (err instanceof Error && err.message.includes('上限')) {
          message.warning(tCommon('message.taskLimitReached'))
        }
        return null
      }
    },
    [createTask, tCommon]
  )

  return (
    <div className="mt-4 w-full max-w-md">
      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Spin />
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] text-lg">
            {t('empty')}
          </div>
        ) : (
          <div className="space-y-4">
            {displayTasks.map((task) => (
              <FocusTaskItem
                key={task.id}
                task={task}
                parentTitle={getParentTitle(task, taskMap)}
                childInfo={childCountMap.get(task.id)}
                children={childrenMap.get(task.id)}
                onComplete={completeTask}
                onCompleteChild={completeTask}
                onStartPomodoro={onStartPomodoro}
                onBindTask={onBindTask}
                isIdle={isIdle}
                isFocusingUnbound={focusingUnbound}
                isHighlighted={
                  currentTaskId ? task.id === currentTaskId : false
                }
              />
            ))}
          </div>
        )}
      </div>

      {!immersive && (
        <FocusTaskInput
          isGuestMode={isGuest}
          canAddMore={canAddMore}
          taskCount={focusTasks.length}
          onCreate={handleCreate}
          showRefresh={!isGuest}
        />
      )}
    </div>
  )
}
