import { useState } from 'react'
import { Button, Popconfirm } from 'antd'
import {
  LinkOutlined,
  DisconnectOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppMode } from '@/contexts/useAppMode'
import { useConnectPrompt } from '@/contexts/useConnectPrompt'
import { useTaskContext } from '@/contexts/TaskContext'
import { ThemeToggle } from '../common/ThemeToggle'
import { SettingsModal } from '../SettingsModal'

export function FocusTopBar() {
  const { t } = useTranslation('common')
  const { isGuest, disconnect } = useAppMode()
  const { openConnectPrompt } = useConnectPrompt()
  const { data } = useTaskContext()
  const [settingsOpen, setSettingsOpen] = useState(false)

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
          icon={<SettingOutlined />}
          onClick={() => setSettingsOpen(true)}
          className="!text-[var(--text-secondary)] hover:!text-[var(--text-primary)]"
        />
        <ThemeToggle variant="minimal" size="sm" />

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          projects={data.projects}
        />
      </div>
    </div>
  )
}
