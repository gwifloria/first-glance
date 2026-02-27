import { useAppMode } from '@/contexts/useAppMode'
import { useTaskContext } from '@/contexts/TaskContext'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import { getParentTitle } from '@/utils/taskMap'
import { renderMarkdownLinks } from '@/utils/renderMarkdownLinks'
import type { Task } from '@/types'
import { message, Spin } from 'antd'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskCheckbox } from '../common/TaskCheckbox'
import { RefreshButton } from '../common/RefreshButton'
import { FocusTaskInput } from './FocusTaskInput'

const MAX_LOCAL_TASKS = 3

interface FocusTaskItemProps {
  task: Task
  parentTitle?: string
  onComplete: (task: Task) => void
}

const FocusTaskItem = memo(function FocusTaskItem({
  task,
  parentTitle,
  onComplete,
}: FocusTaskItemProps) {
  const { completing, handleComplete } = useTaskCompletion(onComplete, {
    delayBefore: false,
  })

  return (
    <div
      className={`
        flex items-center gap-5 py-4 px-5 bg-[var(--bg-card)] rounded-xl shadow-sm
        transition-all duration-300 ease-out
        ${completing ? 'animate-[taskComplete_0.4s_ease-out_forwards]' : ''}
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
          className={`text-xl text-[var(--text-primary)] transition-all duration-200 font-hand ${completing ? 'line-through text-[var(--text-secondary)]' : ''}`}
        >
          {renderMarkdownLinks(task.title)}
        </span>
      </div>
    </div>
  )
})

export function FocusTaskList() {
  const { t } = useTranslation('focus')
  const { t: tCommon } = useTranslation('common')
  const { isGuest } = useAppMode()

  const { data, actions, views } = useTaskContext()
  const { tasks, loading: tasksLoading, taskMap } = data
  const { completeTask, createTask } = actions
  const { focusTasks } = views

  // 只在初始加载时显示 skeleton，连接过程中保持显示原内容
  const loading = tasksLoading && tasks.length === 0
  const canAddMore = isGuest ? focusTasks.length < MAX_LOCAL_TASKS : true

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
    <div className="mt-6 w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-5">
        <h2 className="text-xs font-medium tracking-[3px] text-center text-[var(--text-secondary)]">
          {t('title')}
        </h2>
        {!isGuest && (
          <RefreshButton className="!text-[var(--text-secondary)] hover:!text-[var(--text-primary)]" />
        )}
      </div>

      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Spin />
          </div>
        ) : focusTasks.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] text-lg">
            {t('empty')}
          </div>
        ) : (
          <div className="space-y-4">
            {focusTasks.map((task) => (
              <FocusTaskItem
                key={task.id}
                task={task}
                parentTitle={getParentTitle(task, taskMap)}
                onComplete={completeTask}
              />
            ))}
          </div>
        )}
      </div>

      <FocusTaskInput
        isGuestMode={isGuest}
        canAddMore={canAddMore}
        taskCount={focusTasks.length}
        onCreate={handleCreate}
      />
    </div>
  )
}
