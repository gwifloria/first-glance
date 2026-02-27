import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Mood } from '@/types/buddy'

const MOOD_OPTIONS: { key: Mood; emoji: string; labelKey: string }[] = [
  { key: 'good', emoji: '\uD83D\uDE0A', labelKey: 'mood.good' },
  { key: 'okay', emoji: '\uD83D\uDE10', labelKey: 'mood.okay' },
  { key: 'low', emoji: '\uD83D\uDE14', labelKey: 'mood.low' },
]

interface MoodSelectorProps {
  onSelect: (mood: Mood) => void
  disabled?: boolean
}

export function MoodSelector({ onSelect, disabled }: MoodSelectorProps) {
  const { t } = useTranslation('buddy')

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {t('mood.title')}
      </div>
      <div className="flex gap-2">
        {MOOD_OPTIONS.map(({ key, emoji, labelKey }) => (
          <Button
            key={key}
            type="text"
            disabled={disabled}
            onClick={() => onSelect(key)}
            className="!flex !flex-col !items-center !gap-1 !h-auto !py-2 !px-3 !rounded-xl hover:!bg-[var(--bg-secondary)]"
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {t(labelKey)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
