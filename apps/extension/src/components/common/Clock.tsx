import { useTranslation } from 'react-i18next'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { formatPomodoroTime, type PomodoroMode } from '@/hooks/usePomodoro'

const GREETINGS = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
} as const

interface ClockProps {
  variant: 'small' | 'large'
  showDate?: boolean
  showGreeting?: boolean
  className?: string
  // 番茄时钟模式
  pomodoroMode?: PomodoroMode
  pomodoroTimeLeft?: number
  pomodoroTotalDuration?: number
  onClick?: () => void
}

const RING_RADIUS = 110
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * 时钟组件 - 支持普通时钟和番茄时钟模式
 */
export function Clock({
  variant,
  showDate = false,
  showGreeting = false,
  className = '',
  pomodoroMode,
  pomodoroTimeLeft = 0,
  pomodoroTotalDuration,
  onClick,
}: ClockProps) {
  const { t } = useTranslation('common')
  const { formattedTime, formattedDate, hours } = useCurrentTime()

  // 番茄模式下显示倒计时
  const isPomodoroActive = pomodoroMode && pomodoroMode !== 'idle'
  const displayTime = isPomodoroActive
    ? formatPomodoroTime(pomodoroTimeLeft)
    : formattedTime

  // 番茄模式颜色
  const pomodoroColor =
    pomodoroMode === 'work'
      ? 'text-pomodoro-work'
      : pomodoroMode === 'break'
        ? 'text-pomodoro-break'
        : ''

  // 问候语
  const getGreeting = () => {
    if (hours < 12) return GREETINGS.morning
    if (hours < 18) return GREETINGS.afternoon
    return GREETINGS.evening
  }

  if (variant === 'large') {
    const showRing =
      isPomodoroActive && pomodoroTotalDuration && pomodoroTotalDuration > 0
    const progress = showRing ? pomodoroTimeLeft / pomodoroTotalDuration! : 1
    const dashOffset = RING_CIRCUMFERENCE * (1 - progress)

    return (
      <div
        role="timer"
        aria-label={displayTime}
        onClick={onClick}
        className={`flex flex-col items-center select-none text-center ${className}`}
      >
        {/* 容器：高度随状态过渡，idle 自适应，pomodoro 时按视口高度缩放 */}
        <div
          className="relative flex items-center justify-center transition-all duration-[1.5s] ease-in-out"
          style={{
            width: 'clamp(180px, 30vh, 300px)',
            height: showRing ? 'clamp(180px, 30vh, 300px)' : 'auto',
          }}
        >
          {/* 普通时钟视图 */}
          <div
            className={`transition-all duration-[1.5s] ease-in-out ${showRing ? 'absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <div
              className="leading-none font-medium tracking-tighter cursor-pointer hover:scale-105 transition-all duration-700 text-[var(--clock-primary)] font-hand"
              style={{ fontSize: 'clamp(4.5rem, 12vh, 10rem)' }}
            >
              {formattedTime}
            </div>
          </div>

          {/* 番茄环视图 */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[1.5s] ease-in-out ${showRing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg
              className="absolute inset-0 -rotate-90 w-full h-full"
              viewBox="0 0 300 300"
            >
              {/* 背景环 */}
              <circle
                cx="150"
                cy="150"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--bg-secondary)"
                strokeWidth="5"
                className={
                  pomodoroMode === 'work'
                    ? 'animate-[breathe_4s_ease-in-out_infinite]'
                    : ''
                }
                style={{ transformOrigin: '150px 150px', opacity: 0.5 }}
              />
              {/* 进度环 */}
              <circle
                cx="150"
                cy="150"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="5"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className={
                  pomodoroMode === 'work'
                    ? 'animate-[ringGlow_4s_ease-in-out_infinite]'
                    : ''
                }
                style={{
                  transformOrigin: '150px 150px',
                  transition: 'stroke-dashoffset 1s linear',
                }}
              />
            </svg>
            <div
              className={`relative z-10 leading-none font-medium tracking-tighter cursor-pointer hover:scale-105 transition-all duration-700 font-hand ${pomodoroColor}`}
              style={{ fontSize: 'clamp(2.5rem, 5vh, 4.5rem)' }}
            >
              {isPomodoroActive ? displayTime : ''}
            </div>
          </div>
        </div>

        {showGreeting && (
          <div className="text-3xl max-lg:text-2xl max-md:text-xl mt-2 font-bold font-hand text-[var(--clock-primary)] opacity-90 transition-opacity duration-[1.5s]">
            {isPomodoroActive
              ? pomodoroMode === 'work'
                ? t('focus:pomodoro.working')
                : t('focus:pomodoro.resting')
              : `${getGreeting()}.`}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-start select-none ${className}`}
      onClick={onClick}
    >
      <div className="text-sm mb-1 opacity-60 font-hand text-[var(--text-secondary)]">
        {t('message.todayIsGift')}
      </div>
      <div
        className={`text-4xl max-md:text-2xl font-medium leading-none tracking-tight ${isPomodoroActive ? pomodoroColor : 'text-[var(--clock-secondary)]'}`}
      >
        {displayTime}
      </div>
      {showDate && !isPomodoroActive && (
        <div className="text-sm font-medium mt-1 text-[var(--text-secondary)]">
          {formattedDate}
        </div>
      )}
    </div>
  )
}
