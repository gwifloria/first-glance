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
