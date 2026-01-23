import { Button, Popconfirm } from 'antd'
import { LinkOutlined, DisconnectOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppMode } from '@/contexts/useAppMode'
import { useConnectPrompt } from '@/contexts/useConnectPrompt'

interface ConnectButtonProps {
  className?: string
}

/**
 * 连接/断开按钮
 * 游客模式显示 Connect，已连接显示 Disconnect
 */
export function ConnectButton({ className }: ConnectButtonProps) {
  const { t } = useTranslation('common')
  const { isGuest, disconnect } = useAppMode()
  const { openConnectPrompt } = useConnectPrompt()

  if (isGuest) {
    return (
      <Button
        type="text"
        size="small"
        icon={<LinkOutlined />}
        onClick={openConnectPrompt}
        className={`!text-[var(--accent)] hover:!text-[var(--accent)] hover:!bg-[var(--accent)]/10 ${className}`}
      >
        Connect
      </Button>
    )
  }

  return (
    <Popconfirm
      title={t('disconnectConfirm.title')}
      description={t('disconnectConfirm.description')}
      onConfirm={disconnect}
      okText={t('button.confirm')}
      cancelText={t('button.cancel')}
      placement="bottomRight"
    >
      <Button
        type="text"
        size="small"
        icon={<DisconnectOutlined />}
        className={`!text-[var(--text-secondary)] hover:!text-[var(--text-primary)] ${className}`}
      >
        Disconnect
      </Button>
    </Popconfirm>
  )
}
