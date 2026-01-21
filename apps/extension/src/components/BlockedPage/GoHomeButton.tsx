import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlockedPageStyles } from './useBlockedPageStyles'

interface GoHomeButtonProps {
  onHoverChange?: (isHovering: boolean) => void
}

export function GoHomeButton({ onHoverChange }: GoHomeButtonProps) {
  const { t } = useTranslation('blocked')
  const styles = useBlockedPageStyles()
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
      className={`
        relative overflow-hidden
        px-8 py-3 rounded-full
        font-medium text-lg
        transition-all duration-300 cursor-pointer
        ${styles.buttonBase}
      `}
    >
      {/* Fill animation */}
      <div
        className={`
          absolute inset-0 origin-left
          transition-transform duration-500
          ${styles.buttonFill}
          ${isHovering ? 'scale-x-100' : 'scale-x-0'}
        `}
      />

      {/* Default text */}
      <span
        className={`
          relative z-10
          transition-opacity duration-300
          ${isHovering ? 'opacity-0' : 'opacity-100'}
        `}
      >
        {t('buttonDefault')}
      </span>

      {/* Hover text */}
      <span
        className={`
          absolute inset-0 z-10
          flex items-center justify-center
          transition-opacity duration-300
          ${isHovering ? 'opacity-100' : 'opacity-0'}
          ${styles.buttonHoverText}
        `}
      >
        {t('buttonHover')}
      </span>
    </button>
  )
}
