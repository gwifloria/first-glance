import { useState, useCallback } from 'react'
import { Button } from 'antd'
import { BulbOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { BuddyPanel } from './BuddyPanel'
import { BuddySettingsModal } from './BuddySettingsModal'

interface BuddyButtonProps {
  /** FocusView 传 true，ListView 不传或 false */
  useFocusContext?: boolean
}

export function BuddyButton({ useFocusContext }: BuddyButtonProps) {
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
        onClick={() => setOpen(!open)}
        className="!fixed !bottom-4 !right-4 !z-50 !w-10 !h-10 !shadow-md !bg-[var(--bg-primary)] !border-[var(--border)] !text-[var(--text-secondary)] hover:!text-[var(--accent)]"
        title={t('button')}
      />

      {open && (
        <BuddyPanel
          onClose={() => setOpen(false)}
          onOpenSettings={handleOpenSettings}
          useFocusContext={useFocusContext}
        />
      )}

      <BuddySettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
