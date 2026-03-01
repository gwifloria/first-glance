import { useState, useEffect } from 'react'
import { Modal, Select, Form } from 'antd'
import { useTranslation } from 'react-i18next'
import { getSettings, setSettings } from '@/services/settingsStorage'
import { filterActiveProjects, isInboxProject } from '@/utils/project'
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

  // 过滤出未关闭的项目（包含 inbox）
  const availableProjects = filterActiveProjects(projects)

  const inboxProject = availableProjects.find(isInboxProject)

  const handleChange = async (value: string) => {
    await setSettings({ defaultProjectId: value })
    setDefaultProjectId(value)
  }

  // 当前值：使用设置的值，默认为 inbox project
  const currentValue = defaultProjectId || inboxProject?.id

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
            {availableProjects.map((project) => {
              const isInbox = isInboxProject(project)
              return (
                <Select.Option key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          project.color || (isInbox ? '#888' : 'var(--accent)'),
                      }}
                    />
                    <span>
                      {isInbox ? t('defaultProject.inbox') : project.name}
                    </span>
                  </div>
                </Select.Option>
              )
            })}
          </Select>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {t('defaultProject.hint')}
          </p>
        </Form.Item>
      </Form>
    </Modal>
  )
}
