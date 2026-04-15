import { CrownFilled } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import { usePremium } from '@/hooks/usePremium'

interface PremiumBadgeProps {
  size?: number
}

export function PremiumBadge({ size = 10 }: PremiumBadgeProps) {
  const { t } = useTranslation('premium')
  const { isPremium, openPremiumModal } = usePremium()

  if (isPremium) return null

  return (
    <Tooltip title={t('badge')}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          openPremiumModal()
        }}
        className="inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer"
      >
        <CrownFilled style={{ fontSize: size, color: '#faad14' }} />
      </button>
    </Tooltip>
  )
}
