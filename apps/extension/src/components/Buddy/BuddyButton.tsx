import { useState, useCallback, useEffect } from 'react'
import { Button } from 'antd'
import { BulbOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getSettings, subscribeSettings } from '@/services/settingsStorage'
import { BuddyPanel } from './BuddyPanel'
import { BuddySettingsModal } from './BuddySettingsModal'

export function BuddyButton() {
  const { t } = useTranslation('buddy')
  const [hasConfig, setHasConfig] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [visible, setVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 检查 AI 配置，并监听变化
  useEffect(() => {
    const check = (config?: {
      baseUrl?: string
      apiKey?: string
      model?: string
    }) => !!(config?.baseUrl && config?.apiKey && config?.model)

    getSettings().then((s) => setHasConfig(check(s.aiConfig)))
    return subscribeSettings((s) => setHasConfig(check(s.aiConfig)))
  }, [])

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

  if (!hasConfig) return null

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
