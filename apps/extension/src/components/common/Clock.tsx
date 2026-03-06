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
    // 进度环 SVG - 番茄模式下显示
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
        {showRing ? (
          // 沉浸式模式：时间文字在进度环中心
          <div className="relative flex items-center justify-center w-[300px] h-[300px] max-lg:w-[240px] max-lg:h-[240px] max-md:w-[200px] max-md:h-[200px]">
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 300 300"
              width="300"
              height="300"
            >
              {/* 背景环 */}
              <circle
                cx="150"
                cy="150"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--bg-secondary)"
                strokeWidth="5"
                opacity="0.5"
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
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div
              className={`relative z-10 text-[4.5rem] max-lg:text-[3.5rem] max-md:text-[2.75rem] leading-none font-medium tracking-tighter cursor-pointer hover:scale-105 transition-all duration-700 ${pomodoroColor}`}
            >
              {displayTime}
            </div>
          </div>
        ) : (
          <div
            className={`text-[10rem] max-lg:text-[7rem] max-md:text-[5rem] leading-none font-medium tracking-tighter transition-all duration-700 cursor-pointer hover:scale-105 ${isPomodoroActive ? pomodoroColor : 'text-[var(--clock-primary)]'}`}
          >
            {displayTime}
          </div>
        )}
        {showGreeting && (
          <div className="text-3xl max-lg:text-2xl max-md:text-xl mt-4 font-bold font-hand text-[var(--clock-primary)] opacity-90">
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
      <div className="text-sm italic mb-1 opacity-80 font-hand text-[var(--text-secondary)]">
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
