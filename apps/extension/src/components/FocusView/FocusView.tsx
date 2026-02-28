import type { Quote } from '@/data/quotes'
import { usePomodoro } from '@/hooks/usePomodoro'
import { SettingsPanel } from '../common'
import { Clock } from '../common/Clock'
import { PomodoroControls } from './PomodoroControls'
import { FocusTaskList } from './FocusTaskList'
import { FocusFloatButton } from './FocusFloatButton'
import { ChillModeIndicator } from '../common/ChillModeIndicator'

interface FocusViewProps {
  quote: Quote
  onSwitchView?: () => void
}

export function FocusView({ quote, onSwitchView }: FocusViewProps) {
  const pomodoro = usePomodoro()

  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden animate-fadeIn">
      {/* 背景纹理层 */}
      <div className="absolute inset-0 pointer-events-none opacity-40 paper-texture" />

      {/* Top bar */}
      <div className="flex justify-end items-center gap-2 p-6 relative z-10">
        <SettingsPanel />
      </div>

      <FocusFloatButton onSwitchView={onSwitchView} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <Clock
          variant="large"
          showGreeting
          pomodoroMode={pomodoro.mode}
          pomodoroTimeLeft={pomodoro.timeLeft}
        />
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
        <FocusTaskList />
      </div>

      {/* Quote */}
      <div className="text-center pb-8 px-6 relative z-10">
        <p
          className="text-lg text-[var(--text-primary)] italic opacity-70 max-w-3xl mx-auto"
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
