import { Modal, Select, Form } from 'antd'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/hooks/useSettings'
import { filterActiveProjects } from '@/utils/project'
import type { Project } from '@/types'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  projects: Project[]
}

export function SettingsModal({ open, onClose, projects }: SettingsModalProps) {
  const { t } = useTranslation('settings')
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
      title={t('title')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Form layout="vertical" className="mt-4">
        <Form.Item label={t('defaultProject.label')}>
          <Select
            value={currentValue}
            onChange={handleChange}
            className="w-full"
          >
            {/* 收集箱选项 */}
            <Select.Option key="inbox" value="inbox">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#888' }}
                />
                <span>{t('defaultProject.inbox')}</span>
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
            {t('defaultProject.hint')}
          </p>
        </Form.Item>
      </Form>
    </Modal>
  )
}
