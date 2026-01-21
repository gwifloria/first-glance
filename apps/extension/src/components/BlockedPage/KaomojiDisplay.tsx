import { useBlockedPageStyles } from './useBlockedPageStyles'

interface KaomojiDisplayProps {
  expression: string
  bubbleText: string
  isShaking?: boolean
  animationKey?: string
}

export function KaomojiDisplay({
  expression,
  bubbleText,
  isShaking = false,
  animationKey,
}: KaomojiDisplayProps) {
  const styles = useBlockedPageStyles()

  return (
    <div className="relative inline-block mb-8">
      {/* Speech bubble */}
      <div
        className={`
          absolute -top-10 left-1/2 -translate-x-1/2
          px-4 py-2 rounded-full
          font-bold text-sm whitespace-nowrap
          animate-bounce-subtle
          ${styles.bubbleBg}
        `}
      >
        <span
          key={animationKey}
          className={animationKey ? 'animate-text-fade-in inline-block' : ''}
        >
          {bubbleText}
        </span>
        {/* Bubble tail */}
        <div
          className={`
            absolute -bottom-2 left-1/2 -translate-x-1/2
            w-0 h-0
            border-l-[6px] border-r-[6px] border-t-[8px]
            border-l-transparent border-r-transparent
            ${styles.bubbleTail}
          `}
        />
      </div>

      {/* Kaomoji */}
      <div
        className={`
          text-5xl sm:text-6xl font-mono tracking-wider
          transition-all duration-300
          ${styles.text}
          ${isShaking ? 'animate-shake' : ''}
        `}
      >
        {expression}
      </div>
    </div>
  )
}
