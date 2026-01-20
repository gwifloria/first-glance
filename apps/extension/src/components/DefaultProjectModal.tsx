import { useState, useEffect } from 'react'
import { Modal, Select, Form } from 'antd'
import { useTranslation } from 'react-i18next'
import { getSettings, setSettings } from '@/services/settingsStorage'
import { filterActiveProjects } from '@/utils/project'
import type { Project } from '@/types'

interface DefaultProjectModalProps {
  open: boolean
  onClose: () => void
  projects: Project[]
}

export function DefaultProjectModal({
  open,
  onClose,
  projects,
}: DefaultProjectModalProps) {
  const { t } = useTranslation('settings')
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null)

  // 加载默认项目设置
  useEffect(() => {
    if (open) {
      getSettings().then((settings) => {
        setDefaultProjectId(settings.defaultProjectId)
      })
    }
  }, [open])

  // 过滤出未关闭的项目
  const availableProjects = filterActiveProjects(projects)

  const handleChange = async (value: string) => {
    await setSettings({ defaultProjectId: value })
    setDefaultProjectId(value)
  }

  // 当前值：使用设置的值，默认为收集箱
  const currentValue = defaultProjectId || 'inbox'

  return (
    <Modal
      title={t('defaultProject.label')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Form layout="vertical" className="mt-4">
        <Form.Item>
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
