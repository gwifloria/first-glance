import { memo } from 'react'
import { CloseOutlined, LinkOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import type { ServiceProvider } from '@/services/authManager'
import { getAvailableProviders } from '@/services/authManager'

interface ConnectPromptProps {
  open: boolean
  loading?: boolean
  onConnect: (provider: ServiceProvider) => void
  onCancel: () => void
}

/** 滴答清单 Logo - 蓝色圆环 + 橙色对勾 */
const DidaListLogo = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8">
    {/* 蓝色圆弧（右上有缺口） */}
    <circle
      cx="24"
      cy="24"
      r="20"
      stroke="#4285F4"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="108 18"
      transform="rotate(-45 24 24)"
    />
    {/* 橙色对勾 */}
    <path
      d="M14 24L21 31L35 17"
      stroke="#FBBC04"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

/** Todoist Logo - 红色背景 + 白色条纹 */
const TodoistLogo = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8">
    <rect width="48" height="48" rx="10" fill="#E44332" />
    <g fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
      <path d="M12 18L24 25L36 18" />
      <path d="M12 26L24 33L36 26" />
    </g>
  </svg>
)

/** 服务商配置 */
const SERVICE_CONFIG: Record<
  ServiceProvider,
  {
    nameKey: string
    descKey: string
    Logo: React.FC
  }
> = {
  didaList: {
    nameKey: 'serviceSelector.didaList',
    descKey: 'serviceSelector.didaListDesc',
    Logo: DidaListLogo,
  },
  todoist: {
    nameKey: 'serviceSelector.todoist',
    descKey: 'serviceSelector.todoistDesc',
    Logo: TodoistLogo,
  },
}

export const ConnectPrompt = memo(function ConnectPrompt({
  open,
  loading = false,
  onConnect,
  onCancel,
}: ConnectPromptProps) {
  const { t } = useTranslation('common')
  const availableProviders = getAvailableProviders()

  return (
    <Modal
      open={open}
      centered
      closable={false}
      footer={null}
      width={400}
      className="connect-prompt-modal"
      destroyOnClose
    >
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">
            <LinkOutlined className="text-[var(--accent)]" />
          </div>

          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {t('connectPrompt.title')}
          </h2>

          <p className="text-[var(--text-secondary)]">
            {t('connectPrompt.description')}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {availableProviders.map((provider) => {
            const { Logo, nameKey, descKey } = SERVICE_CONFIG[provider]
            return (
              <Button
                key={provider}
                size="large"
                block
                onClick={() => onConnect(provider)}
                loading={loading}
                className="!h-14 !rounded-lg !flex !items-center !justify-start !px-4 hover:!border-[var(--accent)]"
              >
                <div className="mr-3 flex-shrink-0">
                  <Logo />
                </div>
                <div className="text-left">
                  <div className="font-medium text-[var(--text-primary)]">
                    {t(nameKey)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {t(descKey)}
                  </div>
                </div>
              </Button>
            )
          })}

          {availableProviders.length === 0 && (
            <p className="text-center text-[var(--text-secondary)] py-4">
              {t('serviceSelector.noProviders')}
            </p>
          )}

          <Button
            type="text"
            size="large"
            block
            onClick={onCancel}
            disabled={loading}
            icon={<CloseOutlined />}
            className="!h-12 !text-[var(--text-secondary)] hover:!text-[var(--text-primary)]"
          >
            {t('button.maybeLater')}
          </Button>
        </div>
      </div>
    </Modal>
  )
})
