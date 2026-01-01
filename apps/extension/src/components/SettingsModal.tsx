import { Modal, Select, Form } from 'antd'
import { useSettings } from '@/contexts/SettingsContext'
import { filterActiveProjects } from '@/utils/project'
import type { Project } from '@/types'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  projects: Project[]
}

export function SettingsModal({ open, onClose, projects }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings()

  // 过滤出未关闭的项目
  const availableProjects = filterActiveProjects(projects)

  const handleChange = (value: string) => {
    updateSettings({ defaultProjectId: value })
  }

  // 当前值：使用设置的值，默认为收集箱
  const currentValue = settings.defaultProjectId || 'inbox'

  return (
    <Modal
      title="设置"
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      className="[&_.ant-modal-content]:!bg-[var(--bg-card)] [&_.ant-modal-header]:!bg-transparent [&_.ant-modal-title]:!text-[var(--text-primary)]"
    >
      <Form layout="vertical" className="mt-4">
        <Form.Item
          label={
            <span className="text-[var(--text-primary)]">新任务默认清单</span>
          }
        >
          <Select
            value={currentValue}
            onChange={handleChange}
            className="w-full"
            popupClassName="[&_.ant-select-item]:!text-[var(--text-primary)]"
          >
            {/* 收集箱选项 */}
            <Select.Option key="inbox" value="inbox">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#888' }}
                />
                <span>收集箱</span>
              </div>
            </Select.Option>
            {availableProjects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: project.color || 'var(--accent)' }}
                  />
                  <span>{project.name}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            在智能清单中快速添加任务时，将使用此清单
          </p>
        </Form.Item>
      </Form>
    </Modal>
  )
}
