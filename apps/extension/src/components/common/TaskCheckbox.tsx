import { CheckOutlined } from '@ant-design/icons'

interface TaskCheckboxProps {
  completing: boolean
  onComplete: () => void
  variant?: 'default' | 'focus'
  priorityColor?: string
  disabled?: boolean
}

export function TaskCheckbox({
  completing,
  onComplete,
  variant = 'default',
  priorityColor = 'var(--accent)',
  disabled = false,
}: TaskCheckboxProps) {
  if (variant === 'focus') {
    return (
      <button
        onClick={onComplete}
        disabled={disabled || completing}
        className={`
          w-6 h-6 rounded border-2 border-[var(--border)] flex items-center justify-center
          cursor-pointer transition-all bg-transparent
          hover:border-[var(--accent)] hover:bg-[var(--accent-light)]
          ${completing ? 'opacity-50' : ''}
        `}
      >
        {completing && (
          <CheckOutlined className="text-xs text-[var(--accent)]" />
        )}
      </button>
    )
  }

  return (
    <div
      onClick={disabled ? undefined : onComplete}
      style={{ borderColor: priorityColor }}
      className={`
        w-5 h-5 rounded-full border-2 bg-transparent cursor-pointer
        transition-all shrink-0 mt-0.5 flex items-center justify-center
        hover:bg-[var(--accent-light)]
        ${completing ? '!bg-[var(--accent)] !border-[var(--accent)]' : ''}
      `}
    >
      <div
        className={`
          w-2 h-2 rounded-full bg-[var(--border)] transition-opacity
          ${completing ? 'opacity-100 !bg-white' : 'opacity-0 group-hover:opacity-100'}
        `}
      />
    </div>
  )
}
