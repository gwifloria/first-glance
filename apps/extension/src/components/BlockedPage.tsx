import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks'

const KAOMOJI = {
  STERN: '( ￣^￣ )',
  SHY: '( ///_/// )',
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

export function BlockedPage() {
  const { t } = useTranslation('blocked')
  const { theme, themeType } = useTheme()
  const [isHovering, setIsHovering] = useState(false)

  const messages = t('messages', { returnObjects: true }) as string[]
  const message = useMemo(
    () => (Array.isArray(messages) ? getRandomMessage(messages) : ''),
    [messages]
  )

  const isDark = theme.type === 'modern' && themeType === 'dark'
  const expression = isHovering ? KAOMOJI.SHY : KAOMOJI.STERN

  const handleGoHome = () => {
    window.location.href = chrome.runtime.getURL('src/newtab/index.html')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--bg-primary)]">
      {/* Background pulse layer */}
      <div
        className={`absolute inset-0 animate-pulse-slow ${
          isDark ? 'bg-rose-900/10' : 'bg-[var(--accent)]/10'
        }`}
      />

      {/* Paper texture for journal themes */}
      {theme.showTexture && (
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
        <div className="relative inline-block mb-8">
          {/* Speech bubble */}
          <div
            className={`absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap animate-bounce-subtle ${
              isDark
                ? 'bg-white text-black'
                : 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
            }`}
          >
            {t('speechBubble')}
            {/* Bubble tail */}
            <div
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${
                isDark ? 'border-t-white' : 'border-t-[var(--text-primary)]'
              }`}
            />
          </div>

          {/* Kaomoji */}
          <div
            className={`text-5xl sm:text-6xl font-mono tracking-wider transition-all duration-300 ${
              isDark ? 'text-white' : 'text-[var(--text-primary)]'
            }`}
          >
            {expression}
          </div>
        </div>

        {/* Message */}
        <h1
          className={`text-2xl sm:text-3xl font-semibold mb-3 ${
            isDark ? 'text-white' : 'text-[var(--text-primary)]'
          }`}
        >
          {message}
        </h1>
        <p
          className={`text-base mb-10 ${
            isDark ? 'text-gray-400' : 'text-[var(--text-secondary)]'
          }`}
        >
          {t('subtitle')}
        </p>

        {/* Button */}
        <button
          onClick={handleGoHome}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`relative overflow-hidden px-8 py-3 rounded-full font-medium text-lg transition-all duration-300 cursor-pointer ${
            isDark
              ? 'bg-white text-black hover:shadow-lg hover:shadow-white/20'
              : 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:shadow-lg'
          }`}
        >
          {/* Fill animation */}
          <div
            className={`absolute inset-0 origin-left transition-transform duration-500 ${
              isDark ? 'bg-rose-200' : 'bg-[var(--accent)]'
            } ${isHovering ? 'scale-x-100' : 'scale-x-0'}`}
          />

          {/* Default text */}
          <span
            className={`relative z-10 transition-opacity duration-300 ${
              isHovering ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {t('buttonDefault')}
          </span>

          {/* Hover text */}
          <span
            className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            } ${isDark ? 'text-black' : 'text-[var(--bg-primary)]'}`}
          >
            {t('buttonHover')}
          </span>
        </button>

        {/* Hint */}
        <p
          className={`text-xs mt-8 opacity-50 ${
            isDark ? 'text-gray-400' : 'text-[var(--text-secondary)]'
          }`}
        >
          {t('hint')}
        </p>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(3deg); }
          50% { transform: translateX(-50%) translateY(-5px) rotate(3deg); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
