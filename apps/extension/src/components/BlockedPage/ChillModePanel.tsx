import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CoffeeOutlined } from '@ant-design/icons'
import { useBlockedPageStyles } from './useBlockedPageStyles'
import { getChillStage } from './constants'

interface ChillModePanelProps {
  onStateChange?: (state: {
    isHolding: boolean
    stageIndex: number
    stageMessage: string
  }) => void
}

export function ChillModePanel({ onStateChange }: ChillModePanelProps) {
  const { t } = useTranslation('blocked')
  const styles = useBlockedPageStyles()

  const [showUnlockOption, setShowUnlockOption] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Get current stage message
  const getStageMessage = useCallback(
    (index: number) => {
      if (index < 0) return ''
      const stages = t('chillMode.stages', { returnObjects: true }) as string[]
      if (!Array.isArray(stages)) return ''
      return stages[index] || ''
    },
    [t]
  )

  const enterChillMode = useCallback(async () => {
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes
    await chrome.storage.local.set({
      chill_mode: { active: true, expiresAt },
    })
    // Go back to the blocked site
    window.history.back()
  }, [])

  const handleHoldStart = useCallback(() => {
    setIsHolding(true)
    onStateChange?.({
      isHolding: true,
      stageIndex: 0,
      stageMessage: getStageMessage(0),
    })

    let progress = 0
    intervalRef.current = setInterval(() => {
      progress += 1
      setHoldProgress(progress)

      const stage = getChillStage(progress)
      onStateChange?.({
        isHolding: true,
        stageIndex: stage.stageIndex,
        stageMessage: getStageMessage(stage.stageIndex),
      })

      if (progress >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        enterChillMode()
      }
    }, 100) // 10 seconds = 100 intervals of 100ms
  }, [enterChillMode, getStageMessage, onStateChange])

  const handleHoldEnd = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsHolding(false)
    setHoldProgress(0)
    onStateChange?.({ isHolding: false, stageIndex: -1, stageMessage: '' })
  }, [onStateChange])

  // Calculate remaining seconds for display
  const remainingSeconds = Math.ceil((100 - holdProgress) / 10)

  return (
    <div className="mt-8">
      {!showUnlockOption && !isHolding ? (
        <button
          onClick={() => setShowUnlockOption(true)}
          className={`text-xs opacity-30 hover:opacity-60 underline decoration-dashed cursor-pointer ${styles.textSecondary}`}
        >
          {t('chillMode.trigger')}
        </button>
      ) : (
        <div className="inline-flex flex-col items-center justify-center gap-3">
          {/* Circular progress */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-10"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - holdProgress / 100)}
                className={`transition-all duration-100 ${
                  isHolding ? 'opacity-60' : 'opacity-30'
                }`}
              />
            </svg>
            {/* Center text */}
            <span
              className={`text-lg font-mono ${isHolding ? 'opacity-80' : 'opacity-40'}`}
            >
              {remainingSeconds}s
            </span>
          </div>

          {/* Button */}
          <button
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            className={`
              px-4 py-2 rounded-xl
              font-medium text-sm
              transition-all duration-300 cursor-pointer
              flex items-center gap-2
              select-none
              ${isHolding ? styles.chillButtonHolding : styles.chillButtonDefault}
            `}
          >
            <CoffeeOutlined />
            {isHolding ? t('chillMode.holding') : t('chillMode.button')}
          </button>
        </div>
      )}
    </div>
  )
}
