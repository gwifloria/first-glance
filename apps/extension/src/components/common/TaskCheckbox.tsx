import { Button } from 'antd'
import { CheckOutlined } from '@ant-design/icons'

interface TaskCheckboxProps {
  completing: boolean
  onComplete: () => void
  variant?: 'default' | 'focus'
  priorityColor?: string
  disabled?: boolean
  /** 额外类名，用于按需覆盖默认对齐（如抽屉标题需取消 mt-0.5） */
  className?: string
}

export function TaskCheckbox({
  completing,
  onComplete,
  variant = 'default',
  priorityColor = 'var(--accent)',
  disabled = false,
  className = '',
}: TaskCheckboxProps) {
  if (variant === 'focus') {
    return (
      <Button
        type="default"
        size="small"
        onClick={onComplete}
        disabled={disabled || completing}
        icon={
          completing ? (
            <CheckOutlined className="!text-xs !text-[var(--accent)]" />
          ) : undefined
        }
        className={`
          !w-6 !h-6 !min-w-0 !p-0 !rounded-md !border-2 !border-[var(--text-secondary)] !flex !items-center !justify-center
          !bg-transparent hover:!border-[var(--accent)] hover:!bg-[var(--accent-light)]
          !transition-all !duration-300 !ease-out
          !-rotate-6 hover:!rotate-0 hover:!scale-110
          ${completing ? '!opacity-50 !rotate-0' : ''}
        `}
      />
    )
  }

  // Default variant uses a custom div for the circular checkbox style
  return (
    <div
      onClick={disabled ? undefined : onComplete}
      style={{ borderColor: priorityColor }}
      className={`
        w-5 h-5 rounded-full border-2 bg-transparent cursor-pointer
        transition-all duration-300 ease-out shrink-0 mt-0.5 flex items-center justify-center
        -rotate-12 hover:rotate-0 hover:bg-[var(--accent-light)] hover:scale-110
        ${completing ? '!bg-[var(--accent)] !border-[var(--accent)] !rotate-0' : ''}
        ${className}
      `}
    >
      <div
        className={`
          w-2 h-2 rounded-full bg-[var(--text-secondary)] transition-opacity
          ${completing ? 'opacity-100 !bg-white' : 'opacity-0 group-hover:opacity-100'}
        `}
      />
    </div>
  )
}
