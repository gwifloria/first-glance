import { useState, useCallback } from 'react'
import { Popover, Button } from 'antd'
import { BulbOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { BuddyPanel } from './BuddyPanel'
import { BuddySettingsModal } from './BuddySettingsModal'

interface BuddyButtonProps {
  className?: string
}

export function BuddyButton({ className }: BuddyButtonProps) {
  const { t } = useTranslation('buddy')
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleOpenSettings = useCallback(() => {
    setOpen(false)
    setSettingsOpen(true)
  }, [])

  return (
    <>
      <Popover
        content={<BuddyPanel onOpenSettings={handleOpenSettings} />}
        trigger="click"
        placement="topRight"
        open={open}
        onOpenChange={setOpen}
        arrow={false}
        styles={{
          body: {
            padding: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <Button
          type="text"
          size="small"
          icon={<BulbOutlined />}
          className={`!text-[var(--text-secondary)] hover:!text-[var(--text-primary)] ${className}`}
          title={t('button')}
        />
      </Popover>

      <BuddySettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
