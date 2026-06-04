import { Dropdown } from 'antd'
import { InboxOutlined, FolderOutlined } from '@ant-design/icons'
import {
  describeDestination,
  filterActiveProjects,
  isInboxProject,
} from '@/utils/project'
import type { Project } from '@/types'
import './MetaChip.css'

interface ProjectChipProps {
  /** 当前选中的 projectId（undefined = 默认/收集箱） */
  value: string | undefined
  onChange: (projectId: string | undefined) => void
  projects: Project[]
  /** 收集箱展示文案 */
  inboxLabel: string
}

/**
 * 可点改的目的地 chip：与日期/优先级 chip 对齐，让 FocusView 临时改写入清单成为可能。
 * 收集箱/项目用不同图标；下拉列出所有未关闭项目。
 */
export function ProjectChip({
  value,
  onChange,
  projects,
  inboxLabel,
}: ProjectChipProps) {
  const dest = describeDestination(value, projects, inboxLabel)
  const Icon = dest.isInbox ? InboxOutlined : FolderOutlined

  const items = filterActiveProjects(projects).map((project) => {
    const inbox = isInboxProject(project)
    return {
      key: project.id,
      label: (
        <span className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background: project.color || (inbox ? '#888' : 'var(--accent)'),
            }}
          />
          {inbox ? inboxLabel : project.name}
        </span>
      ),
    }
  })

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items,
        selectable: true,
        selectedKeys: value ? [value] : [],
        onClick: ({ key }) => onChange(key),
      }}
    >
      <span className="meta-chip meta-chip--button" title={dest.name}>
        <Icon className="meta-chip__icon" />
        <span className="meta-chip__name">{dest.name}</span>
      </span>
    </Dropdown>
  )
}
