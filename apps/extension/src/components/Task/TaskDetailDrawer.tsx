import { useState } from 'react'
import {
  Drawer,
  Select,
  Input,
  DatePicker,
  Radio,
  Popconfirm,
  Button,
  Checkbox,
} from 'antd'
import dayjs from 'dayjs'
import {
  DeleteOutlined,
  FolderOutlined,
  CalendarOutlined,
  FlagOutlined,
  TagOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getPriorityOptions, getPriorityColor } from '@/constants/task'
import { isInboxProject } from '@/utils/project'
import { extractDateStr } from '@/utils/date'
import { parseContent } from '@/utils/contentRendering'
import { TASK_DETAIL_PROSE_CLASS } from '@/constants/styles'
import { useTaskContext } from '@/contexts/TaskContext'
import { ProjectColorDot } from '../common/ProjectColorDot'
import { TaskCheckbox } from '../common/TaskCheckbox'
import { useJournalToast } from '../common'
import type { Task, Project } from '@/types'

interface TaskDetailDrawerProps {
  task: Task | null
  projects: Project[]
  open: boolean
  onClose: () => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void | Promise<void>
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
}

/** 元信息行：左侧图标+标签（次字色），右侧值（点击进入编辑） */
function MetaRow({
  icon,
  label,
  align = 'end',
  children,
}: {
  icon: React.ReactNode
  label: string
  align?: 'start' | 'end'
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 min-h-[34px]">
      <span className="flex items-center gap-2 w-[68px] shrink-0 text-[var(--text-secondary)]">
        <span className="text-[13px] leading-none">{icon}</span>
        <span className="text-xs">{label}</span>
      </span>
      <div
        className={`flex-1 min-w-0 flex items-center gap-1.5 ${
          align === 'end' ? 'justify-end' : 'justify-start'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

// borderless Select 让值看起来像文字、点了才下拉；右对齐、贴右内边距给箭头留位
const META_SELECT_CLASS =
  '!w-auto max-w-full [&_.ant-select-selector]:!px-0 [&_.ant-select-selection-item]:!text-sm [&_.ant-select-selection-item]:!text-[var(--text-primary)] [&_.ant-select-selection-item]:!pr-5'

export function TaskDetailDrawer({
  task,
  projects,
  open,
  onClose,
  onUpdate,
  onComplete,
  onDelete,
}: TaskDetailDrawerProps) {
  const { t } = useTranslation('task')
  const { t: tSettings } = useTranslation('settings')
  const { data } = useTaskContext()
  const { showSaved } = useJournalToast()
  const priorityOptions = getPriorityOptions(t)

  // 可编辑字段用本地态承载：onUpdate 后父级的 detailTask 快照不会刷新，
  // 本地态保证抽屉里所见即所得。切换任务时父级用 key 重挂载，故 lazy init 即可
  const [title, setTitle] = useState(task?.title ?? '')
  const [projectId, setProjectId] = useState<string | undefined>(
    task?.projectId
  )
  const [priority, setPriority] = useState(task?.priority ?? 0)
  const [dueDate, setDueDate] = useState<string | undefined>(task?.dueDate)
  // 正文：本地态承载原始 markdown，点击进入编辑、失焦保存
  const [content, setContent] = useState(task?.content ?? '')
  const [editingContent, setEditingContent] = useState(false)
  const [tags, setTags] = useState<string[]>(task?.tags ?? [])

  if (!task) return null

  // 子任务：parentId 关联的真实任务 + content 内嵌的 checklist items
  const childTasks = data.tasks.filter((t) => t.parentId === task.id)
  const parsedContent = content ? parseContent(content) : ''

  const project = projects.find((p) => p.id === projectId)
  const isInbox = isInboxProject(project)
  const hasSubtasks = childTasks.length > 0 || (task.items?.length ?? 0) > 0
  const openProjects = projects.filter((p) => !p.closed)
  // 标签建议：汇总全部任务里出现过的标签去重，供下拉补全
  const allTags = Array.from(
    new Set(data.tasks.flatMap((tk) => tk.tags ?? []))
  ).sort()

  // 改动先暂存在本地态，点「保存」才提交；取消/关闭则丢弃。
  // 日期比较归一到 YYYY-MM-DD，避免「同一天但格式不同」误判为脏
  const dueKey = (d?: string) => (d ? extractDateStr(d) : '')
  const trimmedTitle = title.trim()
  const tagsChanged = JSON.stringify(tags) !== JSON.stringify(task.tags ?? [])

  const handleSave = () => {
    const updates: Partial<Task> = {}
    if (trimmedTitle && trimmedTitle !== task.title)
      updates.title = trimmedTitle
    if (projectId !== task.projectId) updates.projectId = projectId
    if (priority !== (task.priority ?? 0)) updates.priority = priority
    if (dueKey(dueDate) !== dueKey(task.dueDate)) updates.dueDate = dueDate
    if (content !== (task.content ?? '')) updates.content = content
    if (tagsChanged) updates.tags = tags
    onClose()
    // 乐观关闭后再提交，提交完成弹手帐 toast 告知已存
    if (Object.keys(updates).length > 0) {
      Promise.resolve(onUpdate(task.id, updates)).then(() =>
        showSaved(t('detail.saved'))
      )
    }
  }

  // 关闭即丢弃：把本地态重置回任务原值（抽屉用 destroyOnHidden，但组件本身常驻，
  // 故手动重置，保证下次打开同一任务不残留未保存改动）
  const discardAndClose = () => {
    setTitle(task.title)
    setProjectId(task.projectId)
    setPriority(task.priority ?? 0)
    setDueDate(task.dueDate)
    setContent(task.content ?? '')
    setTags(task.tags ?? [])
    setEditingContent(false)
    onClose()
  }

  // 手帐风模块分隔：加粗虚线（repeating-gradient 控制 dash 长度，比 CSS dashed 更克制有意）
  const divider = (
    <div
      className="h-0.5"
      style={{
        background:
          'repeating-linear-gradient(to right, var(--border) 0 8px, transparent 8px 15px)',
      }}
    />
  )

  return (
    <Drawer
      open={open}
      onClose={discardAndClose}
      placement="right"
      width={480}
      destroyOnHidden
      maskClosable
      classNames={{ section: 'card-surface' }}
      styles={{
        mask: { background: 'rgba(0, 0, 0, 0.35)' },
        // 贴右满高、零间隙：只圆左侧两角，阴影向左投到压暗的页面上
        section: {
          borderRadius: '20px 0 0 20px',
          overflow: 'hidden',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.16)',
        },
        header: { borderBottom: 'none', paddingBottom: 8 },
        footer: { borderTop: '1px dashed var(--border)' },
        close: { color: 'var(--text-secondary)' },
      }}
      footer={
        <div className="flex items-center justify-between">
          <Popconfirm
            title={t('confirm.delete')}
            onConfirm={() => {
              onDelete(task)
              onClose()
            }}
            okText={t('common:button.delete')}
            cancelText={t('common:button.cancel')}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="!px-2"
            >
              {t('common:button.delete')}
            </Button>
          </Popconfirm>
          <div className="flex gap-2">
            <Button onClick={discardAndClose}>
              {t('common:button.cancel')}
            </Button>
            <Button type="primary" onClick={handleSave}>
              {t('common:button.save')}
            </Button>
          </div>
        </div>
      }
      title={
        <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] min-w-0">
          <ProjectColorDot
            color={isInbox ? '#888' : project?.color}
            size="xs"
          />
          <span className="truncate">
            #
            {isInbox
              ? tSettings('defaultProject.inbox')
              : (project?.name ?? '')}
          </span>
        </span>
      }
    >
      <div className="flex flex-col gap-5">
        {/* 标题 + 完成 */}
        <div className="flex items-center gap-3">
          <TaskCheckbox
            className="!mt-0"
            completing={false}
            onComplete={() => {
              onComplete(task)
              onClose()
            }}
            priorityColor={getPriorityColor(priority)}
          />
          <Input.TextArea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (!title.trim()) setTitle(task.title)
            }}
            autoSize
            variant="borderless"
            className="!px-0 !py-0 !text-[17px] !font-semibold !text-[var(--text-primary)] !leading-snug"
          />
        </div>

        {/* 正文：点击进入编辑（原始 markdown），失焦保存 */}
        {editingContent ? (
          <Input.TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => setEditingContent(false)}
            autoFocus
            autoSize={{ minRows: 3 }}
            variant="borderless"
            placeholder={t('editor.placeholderContent')}
            className="!px-0 !text-[15px] !leading-[1.7] !text-[var(--text-primary)]"
          />
        ) : parsedContent ? (
          <div
            onClick={() => setEditingContent(true)}
            className={`cursor-text ${TASK_DETAIL_PROSE_CLASS}`}
            dangerouslySetInnerHTML={{ __html: parsedContent }}
          />
        ) : (
          <Button
            type="text"
            onClick={() => setEditingContent(true)}
            className="!px-0 !h-auto !justify-start w-fit !text-[15px] !text-[var(--text-secondary)] hover:!text-[var(--text-primary)]"
          >
            {t('editor.placeholderContent')}
          </Button>
        )}

        {/* 子任务（只读） */}
        {hasSubtasks && (
          <div className="flex flex-col gap-2.5">
            {childTasks.map((child) => (
              <div key={child.id} className="flex items-center gap-2.5">
                <TaskCheckbox
                  completing={false}
                  onComplete={() => onComplete(child)}
                />
                <span
                  className={`text-sm ${
                    child.status === 2
                      ? 'line-through text-[var(--text-secondary)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {child.title}
                </span>
              </div>
            ))}
            {task.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5">
                <Checkbox checked={item.status !== 0} disabled />
                <span
                  className={`text-sm ${
                    item.status !== 0
                      ? 'line-through text-[var(--text-secondary)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {divider}

        {/* 元信息：项目 / 日期 / 优先级 可改，标签只读 */}
        <div className="flex flex-col">
          <MetaRow icon={<FolderOutlined />} label={t('editor.labelProject')}>
            <Select
              value={projectId}
              onChange={(v) => setProjectId(v)}
              variant="borderless"
              popupMatchSelectWidth={false}
              className={META_SELECT_CLASS}
            >
              {openProjects.map((p) => {
                const inbox = isInboxProject(p)
                return (
                  <Select.Option key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <ProjectColorDot
                        color={inbox ? '#888' : p.color}
                        size="xs"
                      />
                      {inbox ? tSettings('defaultProject.inbox') : p.name}
                    </span>
                  </Select.Option>
                )
              })}
            </Select>
          </MetaRow>

          <MetaRow icon={<CalendarOutlined />} label={t('detail.date')}>
            <DatePicker
              value={dueDate ? dayjs(extractDateStr(dueDate)) : null}
              onChange={(d) =>
                setDueDate(d ? d.format('YYYY-MM-DD') : undefined)
              }
              variant="borderless"
              format="YYYY/MM/DD"
              placement="bottomRight"
              suffixIcon={
                <DownOutlined className="!text-[10px] !text-[var(--text-secondary)]" />
              }
              inputReadOnly
              allowClear
              placeholder={t('detail.noDate')}
              className="!w-auto !px-0 [&_.ant-picker-input>input]:!text-sm [&_.ant-picker-input>input]:!w-[88px] [&_.ant-picker-input>input]:!text-right [&_.ant-picker-input>input]:!text-[var(--text-primary)]"
            />
          </MetaRow>

          <MetaRow
            icon={<FlagOutlined />}
            label={t('editor.labelPriority')}
            align="start"
          >
            <Radio.Group
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="!flex !gap-3"
            >
              {priorityOptions.map((opt) => (
                <Radio key={opt.value} value={opt.value}>
                  <span className="text-sm" style={{ color: opt.color }}>
                    {opt.label}
                  </span>
                </Radio>
              ))}
            </Radio.Group>
          </MetaRow>

          <MetaRow
            icon={<TagOutlined />}
            label={t('detail.labels')}
            align="start"
          >
            <Select
              mode="tags"
              value={tags}
              onChange={(v) => setTags(v)}
              variant="borderless"
              placeholder={t('detail.addLabel')}
              options={allTags.map((tg) => ({ value: tg, label: tg }))}
              suffixIcon={null}
              popupMatchSelectWidth={false}
              className="!w-full [&_.ant-select-selector]:!px-0"
            />
          </MetaRow>
        </div>
      </div>
    </Drawer>
  )
}
