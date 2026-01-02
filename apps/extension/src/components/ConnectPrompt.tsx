import { Modal, Button } from 'antd'
import { LinkOutlined, SyncOutlined, CloseOutlined } from '@ant-design/icons'
import { Trans, useTranslation } from 'react-i18next'

interface ConnectPromptProps {
  open: boolean
  localTaskCount: number
  loading?: boolean
  onConnectAndMigrate: () => void
  onConnectWithoutMigrate: () => void
  onCancel: () => void
}

export function ConnectPrompt({
  open,
  localTaskCount,
  loading = false,
  onConnectAndMigrate,
  onConnectWithoutMigrate,
  onCancel,
}: ConnectPromptProps) {
  const { t } = useTranslation('common')
  const hasLocalTasks = localTaskCount > 0

  return (
    <Modal
      open={open}
      centered
      closable={false}
      footer={null}
      width={400}
      destroyOnClose={false}
      className="connect-prompt-modal"
    >
      <div className="p-6 text-center">
        {/* Icon */}
        <div className="text-5xl mb-4">
          <LinkOutlined className="text-[var(--accent)]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {t('connectPrompt.title')}
        </h2>

        {/* Description */}
        <p className="text-[var(--text-secondary)] mb-6">
          {hasLocalTasks ? (
            <Trans
              i18nKey="connectPrompt.descriptionWithTasks"
              values={{ count: localTaskCount }}
              components={{
                strong: (
                  <span className="font-semibold text-[var(--text-primary)]" />
                ),
              }}
            />
          ) : (
            t('connectPrompt.descriptionNoTasks')
          )}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {hasLocalTasks && (
            <Button
              type="primary"
              size="large"
              block
              onClick={onConnectAndMigrate}
              disabled={loading}
              icon={<SyncOutlined spin={loading} />}
              className="!h-12 !rounded-lg !bg-[var(--accent)] hover:!bg-[var(--accent)] hover:!opacity-90"
            >
              {t('connectPrompt.connectAndSync')}
            </Button>
          )}

          <Button
            type={hasLocalTasks ? 'default' : 'primary'}
            size="large"
            block
            onClick={onConnectWithoutMigrate}
            disabled={loading}
            icon={<LinkOutlined />}
            className={
              hasLocalTasks
                ? '!h-12 !rounded-lg !bg-[var(--bg-card)] !text-[var(--text-primary)] !border-[var(--border)] hover:!bg-[var(--bg-secondary)]'
                : '!h-12 !rounded-lg !bg-[var(--accent)] hover:!bg-[var(--accent)] hover:!opacity-90'
            }
          >
            {hasLocalTasks
              ? t('connectPrompt.connectWithoutSync')
              : t('connectPrompt.connectOnly')}
          </Button>

          <Button
            type="text"
            size="large"
            block
            onClick={onCancel}
            disabled={loading}
            icon={<CloseOutlined />}
            className="!h-12 !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] hover:!bg-transparent"
          >
            {t('button.maybeLater')}
          </Button>
        </div>

        {/* Note for local tasks */}
        {hasLocalTasks && (
          <p className="text-xs text-[var(--text-secondary)] mt-4 opacity-60">
            {t('connectPrompt.syncNote')}
          </p>
        )}
      </div>
    </Modal>
  )
}
