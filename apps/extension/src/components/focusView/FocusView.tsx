import { useState, memo } from 'react'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import { getGreeting } from '@/utils/greeting'
import { getRandomQuote, type Quote } from '@/data/quotes'
import { TaskCheckbox } from '../common/TaskCheckbox'
import { Clock } from '../common/Clock'
import { FocusTopBar } from './FocusTopBar'
import { FocusTaskInput } from './FocusTaskInput'
import { FocusQuote } from './FocusQuote'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import { FocusSkeleton } from '../Task/TaskSkeleton'
import type { Task, LocalTask } from '@/types'

interface FocusViewProps {
  focusTasks: (Task | LocalTask)[]
  loading: boolean
  onComplete: (task: Task | LocalTask) => void
  onCreate: (task: Partial<Task>) => Promise<Task | LocalTask | null>
  onSwitchView?: () => void
  todayTaskCount: number
  isGuestMode?: boolean
  canAddMore?: boolean
  onConnect?: () => void
}

export function FocusView({
  focusTasks,
  loading,
  onComplete,
  onCreate,
  onSwitchView,
  todayTaskCount,
  isGuestMode = false,
  canAddMore = true,
  onConnect,
}: FocusViewProps) {
  const { t } = useTranslation('focus')
  const { theme } = useTheme()
  const [quote] = useState<Quote>(() => getRandomQuote())
  const [creating, setCreating] = useState(false)

  const greeting = getGreeting()

  const handleCreate = async (task: Partial<Task>) => {
    setCreating(true)
    try {
      return await onCreate(task)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden animate-fadeIn">
      {/* 背景纹理层 */}
      {theme.showTexture && (
        <div className="absolute inset-0 pointer-events-none opacity-40 paper-texture" />
      )}

      <FocusTopBar isGuestMode={isGuestMode} onConnect={onConnect} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* 大时钟 */}
        <Clock variant="large" />

        {/* 问候语 */}
        <div className="text-2xl text-[var(--text-primary)] mt-4 font-light">
          {greeting}
        </div>

        {/* TODAY'S FOCUS */}
        <div className="mt-16 w-full max-w-md">
          <h2 className="text-xs font-medium tracking-[3px] text-center text-[var(--text-secondary)] mb-8">
            {t('title')}
          </h2>

          {loading ? (
            <FocusSkeleton />
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
                  onComplete={onComplete}
                />
              ))}
            </div>
          )}

          <FocusTaskInput
            isGuestMode={isGuestMode}
            canAddMore={canAddMore}
            taskCount={focusTasks.length}
            creating={creating}
            onCreate={handleCreate}
          />
        </div>
      </div>

      <FocusQuote quote={quote} />

      {/* 右下角 Todo 按钮 - 访客模式隐藏 */}
      {!isGuestMode && onSwitchView && (
        <Button
          type="default"
          shape="round"
          onClick={onSwitchView}
          className="todo-float-btn"
        >
          Todo
          <span className="bg-[var(--accent)] text-white text-xs px-2 py-0.5 rounded-full">
            {todayTaskCount}
          </span>
        </Button>
      )}
    </div>
  )
}

// 专注任务项组件（使用 memo 避免不必要的重渲染）
const FocusTaskItem = memo(function FocusTaskItem({
  task,
  onComplete,
}: {
  task: Task | LocalTask
  onComplete: (task: Task | LocalTask) => void
}) {
  const { theme } = useTheme()
  const { completing, handleComplete } = useTaskCompletion(onComplete, {
    delayBefore: false,
  })

  return (
    <div
      className={`
        flex items-center gap-4 py-3 px-4 bg-[var(--bg-card)] rounded-xl shadow-sm
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
      <span
        className={`flex-1 text-lg text-[var(--text-primary)] transition-all duration-200 ${completing ? 'line-through text-[var(--text-secondary)]' : ''}`}
        style={{
          fontFamily:
            theme.type === 'journal' ? 'var(--font-heading)' : 'inherit',
        }}
      >
        {task.title}
      </span>
    </div>
  )
})
