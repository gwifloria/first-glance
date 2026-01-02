import { useState } from 'react'
import { Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { SettingsModal } from './SettingsModal'
import type { Project } from '@/types'

interface SidebarFooterProps {
  collapsed: boolean
  projects: Project[]
}

export function SidebarFooter({ collapsed, projects }: SidebarFooterProps) {
  const { t } = useTranslation('sidebar')
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="p-3 border-t border-[var(--border)]">
      <Button
        type="text"
        block
        onClick={() => setSettingsOpen(true)}
        title={collapsed ? t('action.settings') : undefined}
        icon={<SettingOutlined />}
        className={`sidebar-settings-btn ${collapsed ? 'collapsed' : ''}`}
      >
        {!collapsed && t('action.settings')}
      </Button>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projects={projects}
      />
    </div>
  )
}
