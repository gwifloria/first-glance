import { CrownFilled } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import { usePremium } from '@/hooks/usePremium'

type PremiumBadgeVariant = 'icon' | 'label'

interface PremiumBadgeProps {
  /**
   * - `icon`（默认）：单个皇冠按钮 + tooltip，点击打开 PremiumModal
   * - `label`：皇冠 + "Premium 功能" 文字，非交互，用作小标题右侧标识
   */
  variant?: PremiumBadgeVariant
  size?: number
}

export function PremiumBadge({
  variant = 'icon',
  size = 10,
}: PremiumBadgeProps) {
  const { t } = useTranslation('premium')
  const { isPremium, openPremiumModal } = usePremium()

  if (isPremium) return null

  if (variant === 'label') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-premium">
        <CrownFilled style={{ fontSize: size }} />
        {t('badge')}
      </span>
    )
  }

  return (
    <Tooltip title={t('badge')}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          openPremiumModal()
        }}
        className="inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer"
      >
        <CrownFilled
          style={{ fontSize: size, color: 'var(--color-premium-gold)' }}
        />
      </button>
    </Tooltip>
  )
}
