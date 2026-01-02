import { Modal } from 'antd'
import { LinkOutlined, SyncOutlined, CloseOutlined } from '@ant-design/icons'

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
  const hasLocalTasks = localTaskCount > 0

  return (
    <Modal
      open={open}
      centered
      closable={false}
      footer={null}
      width={400}
      className="connect-prompt-modal"
    >
      <div className="p-6 text-center">
        {/* Icon */}
        <div className="text-5xl mb-4">
          <LinkOutlined className="text-[var(--accent)]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Connect to DidaList
        </h2>

        {/* Description */}
        <p className="text-[var(--text-secondary)] mb-6">
          {hasLocalTasks ? (
            <>
              You have{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {localTaskCount}
              </span>{' '}
              local task{localTaskCount > 1 ? 's' : ''}. Would you like to sync
              them to DidaList?
            </>
          ) : (
            <>Sync your tasks with DidaList for full functionality.</>
          )}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {hasLocalTasks && (
            <button
              onClick={onConnectAndMigrate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer border-0 text-sm font-medium"
            >
              <SyncOutlined spin={loading} />
              <span>Connect & Sync Tasks</span>
            </button>
          )}

          <button
            onClick={onConnectWithoutMigrate}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-opacity disabled:opacity-50 cursor-pointer text-sm font-medium ${
              hasLocalTasks
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)]'
                : 'bg-[var(--accent)] text-white border-0 hover:opacity-90'
            }`}
          >
            <LinkOutlined />
            <span>
              {hasLocalTasks
                ? 'Connect Without Syncing'
                : 'Connect to DidaList'}
            </span>
          </button>

          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border-0 text-sm"
          >
            <CloseOutlined />
            <span>Maybe Later</span>
          </button>
        </div>

        {/* Note for local tasks */}
        {hasLocalTasks && (
          <p className="text-xs text-[var(--text-secondary)] mt-4 opacity-60">
            Synced tasks will be added to your DidaList inbox
          </p>
        )}
      </div>
    </Modal>
  )
}
