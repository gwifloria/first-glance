import { useState } from 'react'
import { Button } from 'antd'
import { FolderOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppMode } from '@/contexts/useAppMode'
import { DefaultProjectModal } from '../DefaultProjectModal'
import type { Project } from '@/types'

interface SidebarFooterProps {
  collapsed: boolean
  projects: Project[]
}

export function SidebarFooter({ collapsed, projects }: SidebarFooterProps) {
  const { t } = useTranslation('sidebar')
  const { isGuest } = useAppMode()
  const [defaultProjectOpen, setDefaultProjectOpen] = useState(false)

  // 游客模式不显示默认项目设置
  if (isGuest) {
    return null
  }

  return (
    <div className="p-3 border-t border-[var(--border)]">
      <Button
        type="text"
        block
        onClick={() => setDefaultProjectOpen(true)}
        title={collapsed ? t('action.defaultProject') : undefined}
        icon={<FolderOutlined />}
        className={`sidebar-settings-btn ${collapsed ? 'collapsed' : ''}`}
      >
        {!collapsed && t('action.defaultProject')}
      </Button>

      <DefaultProjectModal
        open={defaultProjectOpen}
        onClose={() => setDefaultProjectOpen(false)}
        projects={projects}
      />
    </div>
  )
}
