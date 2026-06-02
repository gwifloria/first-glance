import { useEffect, useState, useCallback } from 'react'
import { App, Button } from 'antd'
import { BarChartOutlined } from '@ant-design/icons'
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
import { StatsDashboard } from './StatsDashboard'
import { ChillModeIndicator } from '../common/ChillModeIndicator'
import { AmbientSoundButton } from '../AmbientSound'
import type { Task } from '@/types'

interface FocusViewProps {
  quote: Quote
  onSwitchView?: () => void
}

// 统计面板尚未打磨完成，暂时隐藏入口（代码保留，改为 true 即可恢复）
const SHOW_STATS_DASHBOARD = false

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

  const { data, actions } = useTaskContext()
  const getTaskMeta = useCallback(
    (taskId: string) => {
      const task = data.tasks.find((t) => t.id === taskId)
      return task ? { title: task.title, priority: task.priority } : null
    },
    [data.tasks]
  )
  // work 阶段结束（到点/skip）弹「任务完成?」。去重在 usePomodoro 内部完成，
  // 这里只负责弹窗，避免多 Tab 各自反应式监听 mode 变化而重复弹、重复 completeTask。
  const handleWorkSessionComplete = useCallback(
    (taskId: string) => {
      const task = data.tasks.find((t) => t.id === taskId)
      if (!task) return
      modal.confirm({
        title: t('pomodoro.taskDone.title'),
        content: task.title,
        okText: t('pomodoro.taskDone.confirm'),
        cancelText: t('pomodoro.taskDone.cancel'),
        onOk: () => actions.completeTask(task),
      })
    },
    [data.tasks, modal, t, actions]
  )
  const pomodoro = usePomodoro(
    pomodoroConfig,
    getTaskMeta,
    handleWorkSessionComplete
  )
  const isPomodoroActive = pomodoro.mode !== 'idle'
  // 进入动画门控：若 FocusView 挂载时番茄钟已在运行（从 ListView 开启番茄钟切过来），
  // 先以非沉浸态渲染一帧，再翻转到沉浸态，复刻 idle→immersive 的卡片 morph 动效。
  // 在 FocusView 内部点「开始」时番茄钟原为 idle，entered 初始即 true，正常的状态过渡不受影响。
  const [entered, setEntered] = useState(() => !isPomodoroActive)
  useEffect(() => {
    if (entered) return
    // 双 rAF：保证 idle 帧先完成绘制，再翻转，使 CSS 过渡有「起点」可播
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [entered])
  const isImmersive = isPomodoroActive && entered
  const [statsOpen, setStatsOpen] = useState(false)
  const openStats = useCallback(() => setStatsOpen(true), [])

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
      <div className="absolute inset-0 pointer-events-none line-grid-auto z-0" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.06) 100%)',
        }}
      />

      {/* Top bar */}
      <div className="flex justify-end items-center gap-2 p-6 max-lg:p-4 relative z-10">
        {SHOW_STATS_DASHBOARD && (
          <Button
            type="text"
            size="small"
            icon={<BarChartOutlined />}
            onClick={openStats}
            aria-label={t('stats.dashboardTitle')}
            className="!text-[var(--text-secondary)] hover:!text-[var(--text-primary)]"
          />
        )}
        <AmbientSoundButton />
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
          onOpenStats={SHOW_STATS_DASHBOARD ? openStats : undefined}
        />
        <FocusTaskList
          immersive={isImmersive}
          currentTaskId={pomodoro.currentTaskId}
          onStartPomodoro={handleStartPomodoro}
          onBindTask={handleBindTask}
          isIdle={pomodoro.mode === 'idle'}
        />
      </div>

      {/* Quote */}
      <div
        className={`text-center pb-8 px-6 max-lg:pb-4 max-lg:px-4 relative z-10 transition-opacity ease-in-out ${isImmersive ? 'opacity-0 pointer-events-none duration-[1.5s]' : 'duration-[1.5s]'}`}
      >
        <p
          className="text-lg max-md:text-base text-[var(--text-secondary)] opacity-40 max-w-3xl mx-auto"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          "{quote.text}"
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-2 tracking-widest uppercase font-bold opacity-25">
          {quote.author}
        </p>
      </div>

      <ChillModeIndicator />

      {SHOW_STATS_DASHBOARD && (
        <StatsDashboard open={statsOpen} onClose={() => setStatsOpen(false)} />
      )}
    </div>
  )
}
