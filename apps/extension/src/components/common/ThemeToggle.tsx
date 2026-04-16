import { CrownFilled } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import { usePremium } from '@/hooks/usePremium'
import { THEME_OPTIONS } from '@/constants/theme'

interface ThemeToggleProps {
  variant?: 'default' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CONFIG = {
  sm: { size: 'w-3 h-3', scale: 'scale-110', gap: 'gap-1.5' },
  md: { size: 'w-4 h-4', scale: 'scale-125', gap: 'gap-1.5' },
  lg: { size: 'w-6 h-6', scale: 'scale-110', gap: 'gap-2' },
}

export function ThemeToggle({
  variant = 'default',
  size = 'sm',
}: ThemeToggleProps) {
  const { themeType, setThemeType } = useTheme()
  const { isPremium } = usePremium()
  const { t } = useTranslation('premium')

  const {
    size: sizeClass,
    scale: activeScale,
    gap: gapClass,
  } = SIZE_CONFIG[size]
  const borderClass =
    variant === 'minimal' ? 'border border-black/5' : 'border-0'
  const ringClass = variant === 'minimal' ? 'ring-1' : 'ring-2'
  const opacityClass = variant === 'minimal' ? 'opacity-60' : 'opacity-70'

  return (
    <div className={`flex items-center ${gapClass}`}>
      {THEME_OPTIONS.map((option) => {
        const isLocked = option.premium && !isPremium
        return (
          <Tooltip
            key={option.type}
            title={isLocked ? t('themeLocked') : option.name}
          >
            <div className="relative">
              <button
                onClick={() => setThemeType(option.type)}
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
              {isLocked && (
                <CrownFilled
                  className="absolute -top-1 -right-1 pointer-events-none"
                  style={{ fontSize: 8, color: '#faad14' }}
                />
              )}
            </div>
          </Tooltip>
        )
      })}
    </div>
  )
}
