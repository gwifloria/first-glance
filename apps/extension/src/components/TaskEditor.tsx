import { Modal, Form, Input, Select } from 'antd'
import { FlagOutlined } from '@ant-design/icons'
import { PRIORITY_OPTIONS } from '@/constants/task'
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
  open: boolean
  onCancel: () => void
  onSave: (taskId: string | null, values: Partial<Task>) => void
}

export function TaskEditor({
  task,
  projects,
  open,
  onCancel,
  onSave,
}: TaskEditorProps) {
  const [form] = Form.useForm()
  const isNew = !task

  const handleOk = async () => {
    const values = await form.validateFields()
    const formattedValues: Partial<Task> = {
      title: values.title,
      content: values.content,
      priority: values.priority,
      projectId: values.projectId,
      dueDate: task?.dueDate, // 保留原有日期，不提供编辑
    }
    onSave(task?.id || null, formattedValues)
    form.resetFields()
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={
        <span className="text-lg font-medium text-[var(--text-primary)]">
          {isNew ? '新建任务' : '编辑任务'}
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="保存"
      cancelText="取消"
      destroyOnClose
      width={480}
      className={MODAL_STYLE}
      okButtonProps={{ className: MODAL_OK_BUTTON_STYLE }}
      cancelButtonProps={{ className: MODAL_CANCEL_BUTTON_STYLE }}
    >
      <Form
        form={form}
        layout="vertical"
        className={FORM_LAYOUT_STYLE}
        initialValues={{
          title: task?.title || '',
          content: task?.content || '',
          priority: task?.priority || 0,
          projectId: task?.projectId || projects[0]?.id,
        }}
      >
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入任务标题' }]}
        >
          <Input placeholder="任务标题" className={FORM_INPUT_STYLE} />
        </Form.Item>

        <Form.Item name="content" label="描述">
          <Input.TextArea
            rows={3}
            placeholder="任务描述（可选）"
            className={`${FORM_INPUT_STYLE} !py-3 [&_.ant-input]:!min-h-[72px]`}
          />
        </Form.Item>

        {/* 所属项目 */}
        <Form.Item name="projectId" label="所属项目" className="!mb-4">
          <Select className={FORM_SELECT_STYLE}>
            {projects
              .filter((p) => !p.closed)
              .map((project) => (
                <Select.Option key={project.id} value={project.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: project.color || 'var(--accent)' }}
                    />
                    {project.name}
                  </span>
                </Select.Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="优先级" className="!mb-0">
          <Select
            className={FORM_SELECT_STYLE}
            optionLabelProp="label"
            options={PRIORITY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: (
                <span className="flex items-center gap-2">
                  <FlagOutlined style={{ color: opt.color }} />
                  {opt.label}
                </span>
              ),
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
