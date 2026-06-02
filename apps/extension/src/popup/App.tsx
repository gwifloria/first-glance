import { useCallback, useMemo } from 'react'
import { Button } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { TaskProvider } from '@/contexts/TaskProvider'
import { useTaskContext } from '@/contexts/TaskContext'
import {
  usePomodoro,
  formatPomodoroTime,
  type PomodoroState,
  type PomodoroActions,
} from '@/hooks/usePomodoro'
import { useTheme } from '@/hooks/useTheme'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import { TaskCheckbox } from '@/components/common/TaskCheckbox'
import type { Task } from '@/types'

const openNewTab = () => chrome.tabs.create({ url: 'chrome://newtab/' })

// ---- Pomodoro section ----

function PomodoroSection({
  pomodoro,
}: {
  pomodoro: PomodoroState & PomodoroActions
}) {
  const { t } = useTranslation('focus')

  const isActive = pomodoro.mode !== 'idle'
  if (!isActive) {
    return (
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <Button
          type="primary"
          block
          icon={<PlayCircleOutlined />}
          onClick={pomodoro.start}
          className="!h-10"
        >
          {t('popup.startPomodoro')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
      <div className="flex flex-col">
        <span
          className={`text-3xl font-mono font-bold leading-none ${pomodoro.mode === 'work' ? 'text-pomodoro-work' : 'text-pomodoro-break'}`}
        >
          {formatPomodoroTime(pomodoro.timeLeft)}
        </span>
        <span className="text-xs text-[var(--text-secondary)] mt-1">
          {pomodoro.mode === 'work'
            ? t('pomodoro.working')
            : t('pomodoro.resting')}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {pomodoro.isRunning ? (
          <Button
            type="text"
            size="small"
            icon={<PauseCircleOutlined />}
            onClick={pomodoro.pause}
            className="!text-[var(--text-secondary)] hover:!text-[var(--accent)]"
          />
        ) : (
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={pomodoro.resume}
            className="!text-[var(--text-secondary)] hover:!text-[var(--accent)]"
          />
        )}
        {pomodoro.completedCount > 0 && (
          <span className="text-xs text-[var(--text-secondary)] ml-1">
            🍅×{pomodoro.completedCount}
          </span>
        )}
      </div>
    </div>
  )
}

// ---- Task item ----

interface PopupTaskItemProps {
  task: Task
  onComplete: (task: Task) => void
  isCurrentTask?: boolean
}

function PopupTaskItem({
  task,
  onComplete,
  isCurrentTask,
}: PopupTaskItemProps) {
  const { completing, handleComplete } = useTaskCompletion(onComplete, {
    delayBefore: false,
  })

  return (
    <div
      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 ${isCurrentTask ? 'bg-[var(--accent-light,var(--bg-secondary))] ring-1 ring-[var(--accent)] ring-opacity-40' : 'hover:bg-[var(--bg-secondary)]'} ${completing ? 'opacity-40' : ''}`}
    >
      <TaskCheckbox
        completing={completing}
        onComplete={() => handleComplete(task)}
        variant="focus"
        disabled={completing}
      />
      <span
        className={`flex-1 text-sm text-[var(--text-primary)] font-hand leading-snug ${completing ? 'line-through text-[var(--text-secondary)]' : ''}`}
      >
        {task.title}
      </span>
      {isCurrentTask && (
        <span className="text-xs text-[var(--accent)] opacity-80">▶</span>
      )}
    </div>
  )
}

// ---- Task list ----

function PopupTaskList({
  pomodoro,
}: {
  pomodoro: PomodoroState & PomodoroActions
}) {
  const { t } = useTranslation('focus')
  const { views, actions, data } = useTaskContext()

  const { focusTasks } = views
  const loading = data.loading && data.tasks.length === 0

  // 有绑定任务时优先展示该任务
  const displayTasks = useMemo(() => {
    if (!pomodoro.currentTaskId) return focusTasks
    const currentFirst = focusTasks.filter(
      (t) => t.id === pomodoro.currentTaskId
    )
    const rest = focusTasks.filter((t) => t.id !== pomodoro.currentTaskId)
    return [...currentFirst, ...rest]
  }, [focusTasks, pomodoro.currentTaskId])

  const handleComplete = useCallback(
    (task: Task) => actions.completeTask(task),
    [actions]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20 text-[var(--text-secondary)] text-sm">
        ...
      </div>
    )
  }

  if (displayTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-[var(--text-secondary)] text-sm">
        {t('popup.noTasks')}
      </div>
    )
  }

  return (
    <div className="px-2 py-2 space-y-0.5 max-h-[260px] overflow-y-auto">
      {displayTasks.map((task) => (
        <PopupTaskItem
          key={task.id}
          task={task}
          onComplete={handleComplete}
          isCurrentTask={task.id === pomodoro.currentTaskId}
        />
      ))}
    </div>
  )
}

// ---- Main popup ----

function PopupContent() {
  const { t } = useTranslation('focus')
  const { theme } = useTheme()
  const pomodoro = usePomodoro()

  return (
    <div
      className={`w-[320px] flex flex-col bg-[var(--bg-card)] text-[var(--text-primary)] ${theme.isDark ? 'popup-dark' : ''}`}
      style={{ fontFamily: 'var(--font-primary)' }}
    >
      <PomodoroSection pomodoro={pomodoro} />
      <PopupTaskList pomodoro={pomodoro} />
      <div className="border-t border-[var(--border)] px-4 py-2.5">
        <Button
          type="text"
          size="small"
          icon={<FileTextOutlined />}
          onClick={openNewTab}
          className="w-full !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] !text-xs"
        >
          {t('popup.openNewtab')} →
        </Button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <TaskProvider>
      <PopupContent />
    </TaskProvider>
  )
}
