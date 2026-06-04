import { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Radio, DatePicker, message } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { getPriorityOptions, FILTER_NAMES } from '@/constants/task'
import { getSettings } from '@/services/settingsStorage'
import { extractDateStr } from '@/utils/date'
import { isInboxProject, resolveDefaultProjectId } from '@/utils/project'
import { MODAL_STYLE, MODAL_BUTTON_STYLE } from '@/constants/styles'
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
  // 编辑时是否动过日期：没动就保留任务原 dueDate（含时间），避免被规范化成纯日期丢掉时间
  const [dateTouched, setDateTouched] = useState(false)
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
          // 默认清单；收集箱当作未指定，回退到本地解析出的 inbox 项目用于表单展示
          const settings = await getSettings()
          projectId =
            resolveDefaultProjectId(settings.defaultProjectId, projects) ??
            inboxProject?.id
        }
      }

      // 日期默认值：新建时跟随当前视图（今天/明天），编辑时取任务已有日期；其余无日期
      let dueDate: Dayjs | null = null
      if (isNew) {
        if (filter === FILTER_NAMES.TODAY) dueDate = dayjs()
        else if (filter === FILTER_NAMES.TOMORROW)
          dueDate = dayjs().add(1, 'day')
      } else if (task?.dueDate) {
        dueDate = dayjs(extractDateStr(task.dueDate))
      }

      form.setFieldsValue({
        title: task?.title || '',
        priority: task?.priority || 0,
        projectId,
        dueDate,
      })
      // 必须在 setFieldsValue 之后重置：setFieldsValue 会触发 onValuesChange 把 dateTouched
      // 误置真，这里同步覆盖回 false（同一批 React 更新，false 最终生效），否则编辑含时间任务仍会丢时间
      setDateTouched(false)
    }

    initForm()
  }, [open, task, isNew, filter, inboxProject?.id, projects, form])

  const handleOk = async () => {
    if (saving) return
    setSaving(true)
    try {
      const values = await form.validateFields()

      // 新建或用户改过日期：用表单值（全天纯日期/清空为无日期）；
      // 编辑且没动日期：保留任务原 dueDate（可能含时间），不规范化成纯日期。
      const due = values.dueDate as Dayjs | null | undefined
      const dueDate =
        isNew || dateTouched
          ? due
            ? due.format('YYYY-MM-DD')
            : undefined
          : task?.dueDate

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
      destroyOnHidden
      width={400}
      className={MODAL_STYLE}
      okButtonProps={{ className: MODAL_BUTTON_STYLE, loading: saving }}
      cancelButtonProps={{ className: MODAL_BUTTON_STYLE }}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(changed) => {
          if ('dueDate' in changed) setDateTouched(true)
        }}
      >
        <Form.Item
          name="title"
          label={t('editor.labelTitle')}
          rules={[
            { required: true, message: t('validation.titleRequired') },
            { whitespace: true, message: t('validation.titleRequired') },
          ]}
        >
          <Input placeholder={t('editor.placeholderTitle')} />
        </Form.Item>

        <Form.Item
          name="projectId"
          label={t('editor.labelProject')}
          className="!mb-4"
        >
          <Select>
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
          name="dueDate"
          label={t('editor.labelDate')}
          className="!mb-4"
        >
          <DatePicker
            className="!w-full"
            format="YYYY/MM/DD"
            placeholder={t('editor.placeholderDate')}
            inputReadOnly
            allowClear
          />
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
