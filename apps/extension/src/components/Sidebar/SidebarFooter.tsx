import { useState } from 'react'
import { Button, Tooltip } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import { DefaultProjectModal } from '../DefaultProjectModal'

interface SidebarFooterProps {
  collapsed?: boolean
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  const { t } = useTranslation('sidebar')
  const { data } = useTaskContext()
  const [modalOpen, setModalOpen] = useState(false)

  const button = (
    <Button
      type="text"
      size="small"
      icon={<SettingOutlined />}
      onClick={() => setModalOpen(true)}
      className={`${collapsed ? '!w-full !justify-center' : 'w-full justify-start'} text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
    >
      {!collapsed && t('action.defaultProject')}
    </Button>
  )

  return (
    <div className="p-2 border-t border-[var(--border)]">
      {collapsed ? (
        <Tooltip title={t('action.defaultProject')} placement="right">
          {button}
        </Tooltip>
      ) : (
        button
      )}

      <DefaultProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projects={data.projects}
      />
    </div>
  )
}
