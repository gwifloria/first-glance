import { useState, useEffect } from 'react'
import { Dropdown, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { FolderOutlined, DownOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import {
  getSettings,
  setSettings,
  subscribeSettings,
} from '@/services/settingsStorage'
import { filterActiveProjects, isInboxProject } from '@/utils/project'
import { ProjectColorDot } from '../common/ProjectColorDot'
import { SurfaceIconButton, StampBadge } from '../common'

interface SidebarFooterProps {
  collapsed?: boolean
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  const { t } = useTranslation('settings')
  const { data } = useTaskContext()
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null)
  // 自增 key：每次切换成功 +1，用于重挂载 StampBadge 重放盖章动画
  const [stampKey, setStampKey] = useState(0)

  // 订阅 settings：FocusView 的项目 chip 也写 defaultProjectId，需实时回灌保持两处一致
  useEffect(() => {
    getSettings().then((s) => setDefaultProjectId(s.defaultProjectId))
    return subscribeSettings((s) => setDefaultProjectId(s.defaultProjectId))
  }, [])

  const availableProjects = filterActiveProjects(data.projects)
  const inboxProject = availableProjects.find(isInboxProject)
  // 当前默认清单：未设置时回退到收集箱
  const currentId = defaultProjectId || inboxProject?.id
  const current = availableProjects.find((p) => p.id === currentId)
  const currentName =
    current && !isInboxProject(current)
      ? current.name
      : t('defaultProject.inbox')

  const handleSelect = async (id: string) => {
    // 收集箱归一为 null，与 FocusView/ListView 的写入一致，不把 inbox 真实 id 存进默认清单
    const normalized = isInboxProject(
      availableProjects.find((p) => p.id === id)
    )
      ? null
      : id
    await setSettings({ defaultProjectId: normalized })
    setDefaultProjectId(normalized)
    setStampKey((k) => k + 1)
  }

  const items: MenuProps['items'] = availableProjects.map((p) => {
    const inbox = isInboxProject(p)
    return {
      key: p.id,
      label: (
        <span className="flex items-center gap-2">
          <ProjectColorDot color={inbox ? '#888' : p.color} size="xs" />
          {inbox ? t('defaultProject.inbox') : p.name}
        </span>
      ),
    }
  })

  const trigger = (
    <SurfaceIconButton
      surface="sidebar"
      size="small"
      icon={<FolderOutlined />}
      className={
        collapsed ? '!w-full !justify-center' : 'w-full !justify-start'
      }
    >
      {!collapsed && (
        <span className="flex-1 flex items-center gap-1 min-w-0 text-left">
          <span className="truncate">{currentName}</span>
          <DownOutlined className="text-[10px] opacity-60 shrink-0" />
        </span>
      )}
    </SurfaceIconButton>
  )

  return (
    <div className="relative p-2 border-t border-[var(--border)]">
      {stampKey > 0 && (
        <StampBadge
          key={stampKey}
          text={t('defaultProject.saved')}
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-10"
        />
      )}
      <Dropdown
        trigger={['click']}
        placement={collapsed ? 'topRight' : 'top'}
        menu={{
          items,
          selectable: true,
          selectedKeys: currentId ? [currentId] : [],
          onClick: ({ key }) => handleSelect(key),
        }}
      >
        <Tooltip
          title={t('defaultProject.label')}
          placement={collapsed ? 'right' : 'top'}
        >
          {trigger}
        </Tooltip>
      </Dropdown>
    </div>
  )
}
