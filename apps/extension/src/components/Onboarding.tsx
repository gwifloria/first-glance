import { useState, useEffect } from 'react'
import { Modal, Button } from 'antd'
import {
  RocketOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const ONBOARDING_KEY = 'onboarding_completed'

interface OnboardingProps {
  onComplete: () => void
}

const stepIcons = [
  <RocketOutlined className="text-4xl text-[var(--text-primary)]" />,
  <AppstoreOutlined className="text-4xl text-[var(--text-primary)]" />,
  <CheckCircleOutlined className="text-4xl text-[var(--text-primary)]" />,
  <BgColorsOutlined className="text-4xl text-[var(--text-primary)]" />,
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation('onboarding')
  const [visible, setVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { key: 'step1', icon: stepIcons[0] },
    { key: 'step2', icon: stepIcons[1] },
    { key: 'step3', icon: stepIcons[2] },
    { key: 'step4', icon: stepIcons[3] },
  ]

  useEffect(() => {
    // 检查是否已完成引导
    chrome.storage.local.get(ONBOARDING_KEY, (result) => {
      if (!result[ONBOARDING_KEY]) {
        setVisible(true)
      }
    })
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    chrome.storage.local.set({ [ONBOARDING_KEY]: true })
    setVisible(false)
    onComplete()
  }

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      width={400}
      className="[&_.ant-modal-content]:!bg-[var(--bg-card)] [&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-0"
    >
      <div className="p-8 text-center">
        {/* 步骤指示器 */}
        <div className="flex justify-center gap-1.5 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-[var(--text-primary)]'
                  : 'bg-[var(--border)]'
              }`}
            />
          ))}
        </div>

        {/* 图标 */}
        <div className="mb-4">{step.icon}</div>

        {/* 标题 */}
        <h2 className="text-xl font-medium text-[var(--text-primary)] mb-3">
          {t(`${step.key}.title`)}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
          {t(`${step.key}.description`)}
        </p>

        {/* 按钮 */}
        <div className="flex gap-3">
          {!isLastStep && (
            <Button
              type="default"
              size="large"
              onClick={handleSkip}
              className="!flex-1 !rounded-xl !text-[var(--text-secondary)] !border-[var(--border)] hover:!text-[var(--text-primary)] hover:!border-[var(--text-secondary)]"
            >
              {t('common:button.skip')}
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            onClick={handleNext}
            className={`${isLastStep ? '!w-full' : '!flex-1'} !rounded-xl !bg-[var(--text-primary)] hover:!bg-[var(--text-primary)] hover:!opacity-90`}
          >
            {isLastStep ? t('common:button.start') : t('common:button.next')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * 检查是否需要显示引导
 */
export async function shouldShowOnboarding(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(ONBOARDING_KEY, (result) => {
      resolve(!result[ONBOARDING_KEY])
    })
  })
}

/**
 * 重置引导状态（用于测试）
 */
export function resetOnboarding(): void {
  chrome.storage.local.remove(ONBOARDING_KEY)
}
