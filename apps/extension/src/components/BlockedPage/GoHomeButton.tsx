import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface GoHomeButtonProps {
  onHoverChange?: (isHovering: boolean) => void
}

export function GoHomeButton({ onHoverChange }: GoHomeButtonProps) {
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
