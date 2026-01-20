import { useState } from 'react'
import { Button, Popconfirm } from 'antd'
import {
  LinkOutlined,
  DisconnectOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppMode } from '@/contexts/useAppMode'
import { useConnectPrompt } from '@/contexts/useConnectPrompt'
import { ThemeToggle } from '../common/ThemeToggle'
import { BlocksiteModal } from '../BlocksiteModal'

export function FocusTopBar() {
  const { t } = useTranslation('common')
  const { isGuest, disconnect } = useAppMode()
  const { openConnectPrompt } = useConnectPrompt()
  const [blocksiteOpen, setBlocksiteOpen] = useState(false)

  return (
    <div className="flex justify-between items-center p-6 relative z-10">
      <div /> {/* 保持布局平衡 */}
      <div className="flex items-center gap-3">
        {isGuest ? (
          <Button
            type="primary"
            shape="round"
            size="small"
            onClick={openConnectPrompt}
            icon={<LinkOutlined />}
          >
            {t('button.connect')}
          </Button>
        ) : (
          <Popconfirm
            title={t('disconnectConfirm.title')}
            description={t('disconnectConfirm.description')}
            onConfirm={disconnect}
            okText={t('button.confirm')}
            cancelText={t('button.cancel')}
          >
            <Button
              type="text"
              size="small"
              icon={<DisconnectOutlined />}
              className="!text-[var(--text-secondary)] hover:!text-[var(--text-primary)]"
            >
              {t('button.disconnect')}
            </Button>
          </Popconfirm>
        )}
        <Button
          type="text"
          size="small"
          icon={<StopOutlined />}
          onClick={() => setBlocksiteOpen(true)}
          className="!text-[var(--text-secondary)] hover:!text-[var(--text-primary)]"
        />
        <ThemeToggle variant="minimal" size="sm" />

        <BlocksiteModal
          open={blocksiteOpen}
          onClose={() => setBlocksiteOpen(false)}
        />
      </div>
    </div>
  )
}
