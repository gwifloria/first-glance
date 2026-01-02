import { useState, useEffect } from 'react'
import { Modal } from 'antd'
import {
  RocketOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
} from '@ant-design/icons'

const ONBOARDING_KEY = 'onboarding_completed'

interface OnboardingProps {
  onComplete: () => void
}

const steps = [
  {
    icon: <RocketOutlined className="text-4xl text-[var(--text-primary)]" />,
    title: '欢迎使用',
    description: '将新标签页变成你的专注任务面板，无需登录即可开始使用。',
  },
  {
    icon: <AppstoreOutlined className="text-4xl text-[var(--text-primary)]" />,
    title: '专注模式',
    description:
      '大时钟配合今日重点任务，让你一眼看到最重要的事。最多添加 3 个专注任务。',
  },
  {
    icon: (
      <CheckCircleOutlined className="text-4xl text-[var(--text-primary)]" />
    ),
    title: '快捷操作',
    description: '点击任务左侧圆圈完成任务，简单高效。',
  },
  {
    icon: <BgColorsOutlined className="text-4xl text-[var(--text-primary)]" />,
    title: '个性主题',
    description: '多种主题可选，点击右上角切换。连接滴答清单可解锁更多功能。',
  },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [visible, setVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

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
          {step.title}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
          {step.description}
        </p>

        {/* 按钮 */}
        <div className="flex gap-3">
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 text-sm text-[var(--text-secondary)] bg-transparent border border-[var(--border)] rounded-xl cursor-pointer hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
            >
              跳过
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${isLastStep ? 'w-full' : 'flex-1'} py-2.5 text-sm text-white bg-[var(--text-primary)] border-0 rounded-xl cursor-pointer hover:opacity-90 transition-opacity`}
          >
            {isLastStep ? '开始使用' : '下一步'}
          </button>
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
