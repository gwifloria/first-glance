import { useState, useEffect } from 'react'
import { Modal, Button } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { shouldShowOnboarding, completeOnboarding } from '@/utils/onboarding'
import { ThemeToggle } from './common/ThemeToggle'

interface OnboardingProps {
  onComplete?: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation('onboarding')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    shouldShowOnboarding()
      .then((shouldShow) => {
        if (shouldShow) {
          setVisible(true)
        }
      })
      .catch((err) => {
        console.error('[Onboarding] 检查引导状态失败:', err)
      })
  }, [])

  const handleComplete = async () => {
    try {
      await completeOnboarding()
    } catch (err) {
      console.error('[Onboarding] 保存完成状态失败:', err)
    }
    setVisible(false)
    onComplete?.()
  }

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      width={400}
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-0"
    >
      <div className="p-8 text-center">
        {/* 图标 */}
        <div className="mb-4">
          <BgColorsOutlined className="text-4xl text-[var(--text-primary)]" />
        </div>

        {/* 标题 */}
        <h2 className="text-xl font-medium text-[var(--text-primary)] mb-3">
          {t('welcome.title')}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          {t('welcome.description')}
        </p>

        {/* 主题选择 */}
        <div className="flex justify-center mb-8">
          <ThemeToggle size="lg" />
        </div>

        {/* 开始按钮 */}
        <Button
          type="primary"
          size="large"
          onClick={handleComplete}
          className="!w-full onboarding-btn-primary"
        >
          {t('common:button.start')}
        </Button>
      </div>
    </Modal>
  )
}
