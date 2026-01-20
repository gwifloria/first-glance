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
  onClick?: () => void
}

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
  onClick,
}: ClockProps) {
  const { t } = useTranslation('common')
  const { formattedTime, formattedDate, hours } = useCurrentTime()

  // 番茄模式下显示倒计时
  const isPomodoroActive = pomodoroMode && pomodoroMode !== 'idle'
  const displayTime = isPomodoroActive
    ? formatPomodoroTime(pomodoroTimeLeft)
    : formattedTime

  // 番茄模式颜色（使用主题色）
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
    return (
      <div
        role="timer"
        aria-label={displayTime}
        onClick={onClick}
        className={`flex flex-col items-center select-none text-center ${className}`}
      >
        <div
          className={`text-[10rem] leading-none font-medium tracking-tighter transition-all duration-700 cursor-pointer hover:scale-105 ${isPomodoroActive ? pomodoroColor : 'text-[var(--clock-primary)]'}`}
        >
          {displayTime}
        </div>
        {showGreeting && (
          <div className="text-3xl mt-4 font-bold font-hand text-[var(--clock-primary)] opacity-90">
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
