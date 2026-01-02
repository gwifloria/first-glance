import { memo } from 'react'
import { useCurrentTime } from '@/hooks/useCurrentTime'

interface ClockProps {
  variant: 'small' | 'large'
  showDate?: boolean
  className?: string
}

/**
 * 时钟组件 - 独立更新，不影响父组件渲染
 */
export const Clock = memo(function Clock({
  variant,
  showDate = false,
  className = '',
}: ClockProps) {
  const { formattedTime, formattedDate } = useCurrentTime()

  if (variant === 'large') {
    return (
      <div
        className={`text-[120px] font-extralight text-[var(--text-primary)] leading-none tracking-tight hover:scale-105 transition-transform duration-700 ${className}`}
      >
        {formattedTime}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="text-4xl max-md:text-2xl font-extralight text-[var(--text-secondary)] leading-none">
        {formattedTime}
      </div>
      {showDate && (
        <div className="text-xs text-[var(--text-secondary)] mt-1">
          {formattedDate}
        </div>
      )}
    </div>
  )
})
