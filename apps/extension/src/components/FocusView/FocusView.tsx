import { useEffect, useRef, useState, useCallback } from 'react'
import { App } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Quote } from '@/data/quotes'
import { usePomodoro } from '@/hooks/usePomodoro'
import { useTaskContext } from '@/contexts/TaskContext'
import { getSettings, subscribeSettings } from '@/services/settingsStorage'
import { SettingsPanel } from '../common'
import { Clock } from '../common/Clock'
import { PomodoroControls } from './PomodoroControls'
import { FocusTaskList } from './FocusTaskList'
import { FocusFloatButton } from './FocusFloatButton'
import { ChillModeIndicator } from '../common/ChillModeIndicator'
import type { Task } from '@/types'

interface FocusViewProps {
  quote: Quote
  onSwitchView?: () => void
}

export function FocusView({ quote, onSwitchView }: FocusViewProps) {
  const { t } = useTranslation('focus')
  const { modal } = App.useApp()

  const [pomodoroConfig, setPomodoroConfig] = useState<{
    workDuration: number
    breakDuration: number
  }>({ workDuration: 25, breakDuration: 5 })

  useEffect(() => {
    getSettings().then((s) =>
      setPomodoroConfig({
        workDuration: s.workDuration,
        breakDuration: s.breakDuration,
      })
    )
    return subscribeSettings((s) =>
      setPomodoroConfig({
        workDuration: s.workDuration,
        breakDuration: s.breakDuration,
      })
    )
  }, [])

  const pomodoro = usePomodoro(pomodoroConfig)
  const { data, actions } = useTaskContext()
  const isImmersive = pomodoro.mode !== 'idle'
  const prevModeRef = useRef(pomodoro.mode)

  // 监听 work → break 切换，弹出任务完成确认
  useEffect(() => {
    const prevMode = prevModeRef.current
    const currMode = pomodoro.mode

    if (prevMode === 'work' && currMode === 'break' && pomodoro.currentTaskId) {
      const task = data.tasks.find((t) => t.id === pomodoro.currentTaskId)
      if (task) {
        modal.confirm({
          title: t('pomodoro.taskDone.title'),
          content: task.title,
          okText: t('pomodoro.taskDone.confirm'),
          cancelText: t('pomodoro.taskDone.cancel'),
          onOk: () => actions.completeTask(task),
        })
      }
    }

    prevModeRef.current = currMode
  }, [pomodoro.mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartPomodoro = useCallback(
    (task: Task) => {
      pomodoro.startWithTask(task.id)
    },
    [pomodoro]
  )

  const handleBindTask = useCallback(
    (task: Task) => {
      modal.confirm({
        title: t('pomodoro.bindConfirm.title'),
        content: task.title,
        okText: t('pomodoro.bindConfirm.confirm'),
        cancelText: t('pomodoro.bindConfirm.cancel'),
        onOk: () => pomodoro.bindTask(task.id),
      })
    },
    [modal, t, pomodoro]
  )

  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden animate-fadeIn">
      {/* 背景纹理层 */}
      <div className="absolute inset-0 pointer-events-none opacity-60 paper-texture" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.06) 100%)',
        }}
      />

      {/* Top bar */}
      <div className="flex justify-end items-center gap-2 p-6 max-lg:p-4 relative z-10">
        <SettingsPanel />
      </div>

      <div
        className={`transition-opacity duration-[1.5s] ease-in-out ${isImmersive ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <FocusFloatButton onSwitchView={onSwitchView} />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-lg:px-4 relative z-10">
        <Clock
          variant="large"
          showGreeting
          pomodoroMode={pomodoro.mode}
          pomodoroTimeLeft={pomodoro.timeLeft}
          pomodoroTotalDuration={pomodoro.totalDuration}
        />
        <PomodoroControls
          mode={pomodoro.mode}
          isRunning={pomodoro.isRunning}
          onStart={pomodoro.start}
          onPause={pomodoro.pause}
          onResume={pomodoro.resume}
          onReset={pomodoro.reset}
          onSkip={pomodoro.skip}
        />
        <div
          className={`transition-opacity ease-in-out ${isImmersive ? 'opacity-40 duration-[2s]' : 'opacity-100 duration-[1.5s]'}`}
        >
          <FocusTaskList
            immersive={isImmersive}
            currentTaskId={pomodoro.currentTaskId}
            onStartPomodoro={handleStartPomodoro}
            onBindTask={handleBindTask}
            isIdle={pomodoro.mode === 'idle'}
          />
        </div>
      </div>

      {/* Quote */}
      <div
        className={`text-center pb-8 px-6 max-lg:pb-4 max-lg:px-4 relative z-10 transition-opacity ease-in-out ${isImmersive ? 'opacity-0 pointer-events-none duration-[1.5s]' : 'duration-[1.5s]'}`}
      >
        <p
          className="text-lg max-md:text-base text-[var(--text-primary)] italic opacity-70 max-w-3xl mx-auto"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          "{quote.text}"
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-2 tracking-widest uppercase font-bold opacity-40">
          {quote.author}
        </p>
      </div>

      <ChillModeIndicator />
    </div>
  )
}
