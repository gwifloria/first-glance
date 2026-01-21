import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlockedPageStyles } from './useBlockedPageStyles'
import { KaomojiDisplay } from './KaomojiDisplay'
import { ChillModePanel } from './ChillModePanel'
import { GoHomeButton } from './GoHomeButton'
import { KAOMOJI, getChillStage, getRandomMessage } from './constants'
import './animations.css'

export function BlockedPage() {
  const { t } = useTranslation('blocked')
  const styles = useBlockedPageStyles()

  const [isHovering, setIsHovering] = useState(false)
  const [chillState, setChillState] = useState({
    isHolding: false,
    stageIndex: -1,
    stageMessage: '',
  })

  const messages = t('messages', { returnObjects: true }) as string[]
  const message = useMemo(
    () => (Array.isArray(messages) ? getRandomMessage(messages) : ''),
    [messages]
  )

  // Determine expression based on chill state or hover
  const expression = useMemo(() => {
    if (chillState.stageIndex >= 0) {
      return getChillStage(chillState.stageIndex * 50).kaomoji
    }
    return isHovering ? KAOMOJI.SHY : KAOMOJI.STERN
  }, [chillState.stageIndex, isHovering])

  // Determine bubble text
  const bubbleText = chillState.isHolding
    ? chillState.stageMessage
    : t('speechBubble')

  // Animation key for text transition
  const animationKey = chillState.isHolding
    ? `stage-${chillState.stageIndex}`
    : undefined

  return (
    <div
      className={`
        relative min-h-screen overflow-hidden
        flex items-center justify-center
        bg-[var(--bg-primary)]
      `}
    >
      {/* Background pulse layer - changes to warning pulse when holding */}
      <div
        className={`absolute inset-0 ${
          chillState.isHolding
            ? `${styles.warningBg} animate-warning-pulse`
            : `${styles.pulseBg} animate-pulse-slow`
        }`}
      />

      {/* Paper texture for journal themes */}
      {styles.showTexture && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-8 animate-fade-in-up">
        {/* Kaomoji area */}
        <KaomojiDisplay
          expression={expression}
          bubbleText={bubbleText}
          isShaking={chillState.isHolding}
          animationKey={animationKey}
        />

        {/* Message */}
        <h1
          className={`
            text-2xl sm:text-3xl font-semibold mb-3
            ${styles.text}
          `}
        >
          {message}
        </h1>
        <p className={`text-base mb-10 ${styles.textSecondary}`}>
          {t('subtitle')}
        </p>

        {/* Button */}
        <GoHomeButton onHoverChange={setIsHovering} />

        {/* Hint */}
        <p className={`text-xs mt-8 opacity-50 ${styles.textSecondary}`}>
          {t('hint')}
        </p>

        {/* Chill Mode */}
        <ChillModePanel onStateChange={setChillState} />
      </div>
    </div>
  )
}
