import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChillModePanel } from './ChillModePanel'
import './animations.css'
import { KAOMOJI, getChillStage } from './constants'

// --- KaomojiDisplay（内联，仅此处使用） ---

function KaomojiDisplay({
  expression,
  bubbleText,
  isShaking = false,
  animationKey,
}: {
  expression: string
  bubbleText: string
  isShaking?: boolean
  animationKey?: string
}) {
  return (
    <div className="relative inline-block mb-8">
      {/* Speech bubble */}
      <div className="blocked-bubble animate-bounce-subtle">
        <span
          key={animationKey}
          className={animationKey ? 'animate-text-fade-in inline-block' : ''}
        >
          {bubbleText}
        </span>
        {/* Bubble tail */}
        <div className="blocked-bubble-tail" />
      </div>

      {/* Kaomoji */}
      <div className={`blocked-kaomoji ${isShaking ? 'animate-shake' : ''}`}>
        {expression}
      </div>
    </div>
  )
}

// --- GoHomeButton（内联，仅此处使用） ---

function GoHomeButton({
  onHoverChange,
}: {
  onHoverChange?: (isHovering: boolean) => void
}) {
  const { t } = useTranslation('blocked')
  const [isHovering, setIsHovering] = useState(false)

  const handleGoHome = () => {
    window.location.href = chrome.runtime.getURL('src/newtab/index.html')
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
    onHoverChange?.(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    onHoverChange?.(false)
  }

  return (
    <button
      onClick={handleGoHome}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="blocked-home-btn"
    >
      {/* Fill animation */}
      <div
        className="blocked-home-btn-fill"
        style={{ transform: isHovering ? 'scaleX(1)' : 'scaleX(0)' }}
      />

      {/* Default text */}
      <span
        className="relative z-10 transition-opacity duration-300"
        style={{ opacity: isHovering ? 0 : 1 }}
      >
        {t('buttonDefault')}
      </span>

      {/* Hover text */}
      <span
        className="blocked-home-btn-hover-text"
        style={{ opacity: isHovering ? 1 : 0 }}
      >
        {t('buttonHover')}
      </span>
    </button>
  )
}

// --- BlockedPage ---

export function BlockedPage() {
  const { t } = useTranslation('blocked')

  // 从 hash 中提取被屏蔽的原始 URL（由 blockingRules regexSubstitution 写入）
  const originalUrl = useMemo(() => {
    const raw = window.location.hash.slice(1)
    return raw && /^https?:\/\//.test(raw) ? raw : ''
  }, [])

  const [isHovering, setIsHovering] = useState(false)
  const [chillState, setChillState] = useState({
    isHolding: false,
    stageIndex: -1,
    stageMessage: '',
  })

  // 固定随机索引，避免 hold 过程中消息频繁变化
  const [randomIndex] = useState(() => Math.floor(Math.random() * 100))
  const messages = t('messages', { returnObjects: true }) as string[]
  const message = Array.isArray(messages)
    ? messages[randomIndex % messages.length]
    : ''

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
    <div className="blocked-page">
      {/* Background pulse layer - changes to warning pulse when holding */}
      <div
        className={`absolute inset-0 ${
          chillState.isHolding
            ? 'bg-[var(--blocked-warning-bg)] animate-warning-pulse'
            : 'bg-[var(--blocked-pulse-bg)] animate-pulse-slow'
        }`}
      />

      {/* Paper texture */}
      <div className="absolute inset-0 opacity-30 pointer-events-none paper-texture" />

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
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3 text-[var(--text-primary)]">
          {message}
        </h1>
        <p className="text-base mb-10 text-[var(--text-secondary)]">
          {t('subtitle')}
        </p>

        {/* Button */}
        <GoHomeButton onHoverChange={setIsHovering} />

        {/* Hint */}
        <p className="text-xs mt-8 opacity-50 text-[var(--text-secondary)]">
          {t('hint')}
        </p>

        {/* Chill Mode */}
        <ChillModePanel
          originalUrl={originalUrl}
          onStateChange={setChillState}
        />
      </div>
    </div>
  )
}
