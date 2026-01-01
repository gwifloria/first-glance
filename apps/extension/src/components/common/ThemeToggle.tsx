import { useTheme } from '@/contexts/ThemeContext'
import { THEME_OPTIONS } from '@/constants/theme'

interface ThemeToggleProps {
  variant?: 'default' | 'minimal'
  size?: 'sm' | 'md'
}

export function ThemeToggle({
  variant = 'default',
  size = 'sm',
}: ThemeToggleProps) {
  const { themeType, setThemeType } = useTheme()

  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const activeScale = size === 'sm' ? 'scale-110' : 'scale-125'
  const borderClass =
    variant === 'minimal' ? 'border border-black/5' : 'border-0'
  const ringClass = variant === 'minimal' ? 'ring-1' : 'ring-2'
  const opacityClass = variant === 'minimal' ? 'opacity-60' : 'opacity-70'

  return (
    <div className="flex items-center gap-1.5">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.type}
          onClick={() => setThemeType(option.type)}
          title={option.name}
          className={`
            ${sizeClass} rounded-full transition-all cursor-pointer p-0 ${borderClass}
            ${
              themeType === option.type
                ? `${ringClass} ring-offset-1 ring-[var(--text-secondary)] ${activeScale}`
                : `${opacityClass} hover:opacity-100 hover:${activeScale}`
            }
          `}
          style={{ backgroundColor: option.color }}
        />
      ))}
    </div>
  )
}
