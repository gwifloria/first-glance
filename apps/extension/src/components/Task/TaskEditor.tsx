import { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Radio, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { getPriorityOptions, FILTER_NAMES } from '@/constants/task'
import { getSettings } from '@/services/settingsStorage'
import { formatDateTimeWithTimezone } from '@/utils/date'
import { isInboxProject } from '@/utils/project'
import {
  FORM_INPUT_STYLE,
  FORM_SELECT_STYLE,
  MODAL_STYLE,
  MODAL_OK_BUTTON_STYLE,
  MODAL_CANCEL_BUTTON_STYLE,
  FORM_LAYOUT_STYLE,
} from '@/constants/styles'
import type { Task, Project } from '@/types'

interface TaskEditorProps {
  task: Task | null
  projects: Project[]
  filter?: string
  open: boolean
  onCancel: () => void
  onSave: (taskId: string | null, values: Partial<Task>) => void
}

export function TaskEditor({
  task,
  projects,
  filter,
  open,
  onCancel,
  onSave,
}: TaskEditorProps) {
  const { t } = useTranslation('task')
  const { t: tSettings } = useTranslation('settings')
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const isNew = !task
  const priorityOptions = getPriorityOptions(t)

  const inboxProject = projects.find(isInboxProject)

  // 弹窗打开时初始化表单
  useEffect(() => {
    if (!open) return

    const initForm = async () => {
      let projectId = task?.projectId

      // 新建任务时计算默认 projectId
      if (isNew) {
        if (filter === 'inbox') {
          projectId = inboxProject?.id
        } else if (filter?.startsWith('project:')) {
          projectId = filter.replace('project:', '')
        } else {
          const settings = await getSettings()
          const isDefaultInbox =
            !settings.defaultProjectId ||
            settings.defaultProjectId.startsWith('inbox')
          projectId = isDefaultInbox
            ? inboxProject?.id
            : (settings.defaultProjectId ?? undefined)
        }
      }

      form.setFieldsValue({
        title: task?.title || '',
        priority: task?.priority || 0,
        projectId,
      })
    }

    initForm()
  }, [open, task, isNew, filter, inboxProject?.id, form])

  const handleOk = async () => {
    if (saving) return
    setSaving(true)
    try {
      const values = await form.validateFields()

      // 新建任务时根据 filter 设置 dueDate
      let dueDate = task?.dueDate
      if (isNew) {
        if (filter === FILTER_NAMES.TODAY) {
          dueDate = formatDateTimeWithTimezone(new Date())
        } else if (filter === FILTER_NAMES.TOMORROW) {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          dueDate = formatDateTimeWithTimezone(tomorrow)
        }
      }

      await onSave(task?.id || null, {
        title: values.title?.trim(),
        priority: values.priority,
        projectId: values.projectId,
        dueDate,
      })
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error(t('common:message.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={
        <span className="text-lg font-medium text-[var(--text-primary)]">
          {isNew ? t('editor.titleNew') : t('editor.titleEdit')}
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={t('common:button.save')}
      cancelText={t('common:button.cancel')}
      destroyOnClose
      width={400}
      className={MODAL_STYLE}
      okButtonProps={{ className: MODAL_OK_BUTTON_STYLE, loading: saving }}
      cancelButtonProps={{ className: MODAL_CANCEL_BUTTON_STYLE }}
    >
      <Form form={form} layout="vertical" className={FORM_LAYOUT_STYLE}>
        <Form.Item
          name="title"
          label={t('editor.labelTitle')}
          rules={[
            { required: true, message: t('validation.titleRequired') },
            { whitespace: true, message: t('validation.titleRequired') },
          ]}
        >
          <Input
            placeholder={t('editor.placeholderTitle')}
            className={FORM_INPUT_STYLE}
          />
        </Form.Item>

        <Form.Item
          name="projectId"
          label={t('editor.labelProject')}
          className="!mb-4"
        >
          <Select className={FORM_SELECT_STYLE}>
            {projects
              .filter((p) => !p.closed)
              .map((project) => {
                const isInbox = isInboxProject(project)
                return (
                  <Select.Option key={project.id} value={project.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            project.color ||
                            (isInbox ? '#888' : 'var(--accent)'),
                        }}
                      />
                      {isInbox
                        ? tSettings('defaultProject.inbox')
                        : project.name}
                    </span>
                  </Select.Option>
                )
              })}
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label={t('editor.labelPriority')}
          className="!mb-0"
        >
          <Radio.Group className="flex gap-4">
            {priorityOptions.map((opt) => (
              <Radio key={opt.value} value={opt.value}>
                <span style={{ color: opt.color }}>{opt.label}</span>
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}
