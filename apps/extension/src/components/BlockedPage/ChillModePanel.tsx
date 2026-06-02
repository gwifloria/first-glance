import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getChillStage } from './constants'
import { CoffeeCup } from '@/components/common/CoffeeCup'
import {
  CHILL_MODE_DURATION_MS,
  CHILL_MODE_HOLD_INTERVAL_MS,
  CHILL_MODE_HOLD_STEPS,
} from '@/constants'
import { STORAGE_KEYS } from '@/services/storageKeys'

interface ChillModePanelProps {
  originalUrl?: string
  onStateChange?: (state: {
    isHolding: boolean
    stageIndex: number
    stageMessage: string
  }) => void
}

export function ChillModePanel({
  originalUrl,
  onStateChange,
}: ChillModePanelProps) {
  const { t } = useTranslation('blocked')

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
    const expiresAt = Date.now() + CHILL_MODE_DURATION_MS
    await chrome.storage.local.set({
      [STORAGE_KEYS.CHILL_MODE]: { active: true, expiresAt },
    })
    // 等待 background 清除屏蔽规则后再导航
    await new Promise((resolve) => setTimeout(resolve, 100))
    // 优先跳转到被屏蔽的原始 URL，否则回退到上一页
    if (originalUrl) {
      window.location.href = originalUrl
    } else {
      window.history.back()
    }
  }, [originalUrl])

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

      if (progress >= CHILL_MODE_HOLD_STEPS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        enterChillMode()
      }
    }, CHILL_MODE_HOLD_INTERVAL_MS)
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

  const fillPercent = holdProgress / CHILL_MODE_HOLD_STEPS

  // Calculate remaining seconds for display (使用 floor 避免显示延迟感)
  const remainingSeconds = Math.floor(
    ((CHILL_MODE_HOLD_STEPS - holdProgress) * CHILL_MODE_HOLD_INTERVAL_MS) /
      1000
  )

  return (
    <div className="mt-8">
      {!showUnlockOption && !isHolding ? (
        <button
          onClick={() => setShowUnlockOption(true)}
          className="text-xs opacity-30 hover:opacity-60 underline decoration-dashed cursor-pointer text-[var(--text-secondary)]"
        >
          {t('chillMode.trigger')}
        </button>
      ) : (
        <div className="inline-flex flex-col items-center justify-center gap-3">
          {/* 咖啡杯注满动画 */}
          <div className="relative flex items-center justify-center">
            <CoffeeCup
              fillPercent={fillPercent}
              size={64}
              className={`transition-opacity duration-200 ${
                isHolding ? '' : 'opacity-50'
              }`}
            />
            {/* 倒计时叠加在杯子下方 */}
            <span
              className={`absolute -bottom-5 text-xs font-mono ${
                isHolding ? 'opacity-60' : 'opacity-30'
              }`}
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
            onTouchCancel={handleHoldEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`blocked-chill-btn ${isHolding ? 'holding' : ''} mt-2`}
          >
            {isHolding ? t('chillMode.holding') : t('chillMode.button')}
          </button>
        </div>
      )}
    </div>
  )
}
