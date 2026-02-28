import { useState, useCallback } from 'react'
import { Button } from 'antd'
import { BulbOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { BuddyPanel } from './BuddyPanel'
import { BuddySettingsModal } from './BuddySettingsModal'

export function BuddyButton() {
  const { t } = useTranslation('buddy')
  const [hasOpened, setHasOpened] = useState(false)
  const [visible, setVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleToggle = useCallback(() => {
    if (!visible) {
      setHasOpened(true)
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [visible])

  const handleOpenSettings = useCallback(() => {
    setVisible(false)
    setSettingsOpen(true)
  }, [])

  return (
    <>
      <Button
        shape="circle"
        icon={<BulbOutlined />}
        onClick={handleToggle}
        className="!fixed !bottom-4 !right-4 !z-50 !w-10 !h-10 !shadow-md !bg-[var(--bg-primary)] !border-[var(--border)] !text-[var(--text-secondary)] hover:!text-[var(--accent)]"
        title={t('button')}
      />

      {hasOpened && (
        <BuddyPanel
          visible={visible}
          onClose={() => setVisible(false)}
          onOpenSettings={handleOpenSettings}
        />
      )}

      <BuddySettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
