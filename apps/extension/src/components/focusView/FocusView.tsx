import { useState, useMemo } from 'react'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import { usePomodoro } from '@/hooks/usePomodoro'
import { getGreeting } from '@/utils/greeting'
import { getRandomQuote, type Quote } from '@/data/quotes'
import { Clock } from '../common/Clock'
import { FocusTopBar } from './FocusTopBar'
import { FocusTaskInput } from './FocusTaskInput'
import { FocusTaskItem } from './FocusTaskItem'
import { FocusQuote } from './FocusQuote'
import { PomodoroControls } from './PomodoroControls'
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

  // 番茄时钟
  const pomodoro = usePomodoro()

  // 缓存问候语（避免每次渲染重新计算）
  const greeting = useMemo(() => getGreeting(), [])

  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden animate-fadeIn">
      {/* 背景纹理层 */}
      {theme.showTexture && (
        <div className="absolute inset-0 pointer-events-none opacity-40 paper-texture" />
      )}

      <FocusTopBar isGuestMode={isGuestMode} onConnect={onConnect} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* 大时钟 / 番茄倒计时 */}
        <Clock
          variant="large"
          pomodoroMode={pomodoro.mode}
          pomodoroTimeLeft={pomodoro.timeLeft}
        />

        {/* 番茄控制按钮 */}
        <PomodoroControls
          mode={pomodoro.mode}
          isRunning={pomodoro.isRunning}
          completedCount={pomodoro.completedCount}
          onStart={pomodoro.start}
          onPause={pomodoro.pause}
          onResume={pomodoro.resume}
          onReset={pomodoro.reset}
          onSkip={pomodoro.skip}
        />

        {/* 问候语 - 番茄模式时隐藏 */}
        {pomodoro.mode === 'idle' && (
          <div className="text-2xl text-[var(--text-primary)] mt-4 font-light">
            {greeting}
          </div>
        )}

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
            onCreate={onCreate}
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
