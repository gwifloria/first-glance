import { useState, type ReactNode } from 'react'
import { Modal, Input, Button, message, Tag } from 'antd'
import {
  CrownOutlined,
  CheckCircleFilled,
  CustomerServiceOutlined,
  SkinOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usePremium } from '@/hooks/usePremium'

const STORE_URL =
  'https://gwifloria-studio.lemonsqueezy.com/checkout/buy/c9428bc2-22e5-4ec1-a3d7-568aa6498164'

interface PremiumModalProps {
  open: boolean
  onClose: () => void
}

function FeatureCard({
  icon,
  title,
  description,
  preview,
  comingSoon,
}: {
  icon: ReactNode
  title: string
  description: string
  preview?: ReactNode
  comingSoon?: boolean
}) {
  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] ${
        comingSoon ? 'opacity-50' : ''
      }`}
    >
      <div className="text-lg text-[var(--accent)] shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {title}
          </span>
          {comingSoon && (
            <Tag className="!text-[10px] !px-1.5 !py-0 !leading-4 !border-[var(--border)] !bg-transparent !text-[var(--text-secondary)]">
              Coming soon
            </Tag>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5 leading-relaxed">
          {description}
        </p>
        {preview && <div className="mt-2">{preview}</div>}
      </div>
    </div>
  )
}

export function PremiumModal({ open, onClose }: PremiumModalProps) {
  const { t } = useTranslation('premium')
  const { t: tCommon } = useTranslation('common')
  const { isPremium, activateLicense, deactivate } = usePremium()
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    const key = licenseKey.trim()
    if (!key) return

    setLoading(true)
    try {
      const result = await activateLicense(key)
      if (result.success) {
        message.success(t('activateSuccess'))
        setLicenseKey('')
        onClose()
      } else {
        const errorKey =
          result.error === 'network_error' ? 'networkError' : 'invalidKey'
        message.error(t(errorKey))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    await deactivate()
    message.success(t('deactivated'))
  }

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <CrownOutlined style={{ color: '#faad14' }} />
          {t('title')}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 480 }}
    >
      <div className="flex flex-col gap-4 mt-4">
        {isPremium ? (
          <>
            <div className="flex items-center gap-2 text-[var(--success)]">
              <CheckCircleFilled />
              <span className="text-sm font-medium">{t('activated')}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] m-0">
              {t('activatedDesc')}
            </p>
            <Button size="small" onClick={handleDeactivate}>
              {t('deactivate')}
            </Button>
          </>
        ) : (
          <>
            {/* 价格标签 */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {t('price')}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {t('priceNote')}
              </span>
            </div>

            {/* Feature Cards */}
            <div className="flex flex-col gap-2">
              <FeatureCard
                icon={<CustomerServiceOutlined />}
                title={t('feature.ambientSounds')}
                description={t('feature.ambientSoundsDesc')}
                comingSoon
              />

              <FeatureCard
                icon={<SkinOutlined />}
                title={t('feature.premiumThemes')}
                description={t('feature.premiumThemesDesc')}
                comingSoon
              />

              <FeatureCard
                icon={<ClockCircleOutlined />}
                title={t('feature.enhancedClock')}
                description={t('feature.enhancedClockDesc')}
                comingSoon
              />
            </div>

            {/* CTA */}
            <Button
              type="primary"
              block
              size="large"
              href={STORE_URL}
              target="_blank"
              icon={<CrownOutlined />}
            >
              {t('purchase')} — {t('price')}
            </Button>

            {/* License Key 输入 */}
            <div className="border-t border-[var(--border)] pt-4">
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                {t('licenseLabel')}
              </label>
              <div className="flex gap-2">
                <Input
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder={t('licensePlaceholder')}
                  onPressEnter={handleActivate}
                />
                <Button
                  type="primary"
                  onClick={handleActivate}
                  loading={loading}
                  disabled={!licenseKey.trim()}
                >
                  {tCommon('button.confirm')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
