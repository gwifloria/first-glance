import { memo } from 'react'
import { Button, Popconfirm } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatShortDate } from '@/utils/date'
import { isOverdue } from '@/utils/taskFilters'
import { getPriorityColor } from '@/constants/task'
import { isInboxProject } from '@/utils/project'
import { renderMarkdownLinks } from '@/utils/renderMarkdownLinks'
import { ProjectColorDot } from '../ProjectColorDot'
import { TaskCheckbox } from '../common/TaskCheckbox'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import type { Task, Project } from '@/types'

interface TaskItemProps {
  task: Task
  project?: Project
  parentTitle?: string
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
}

export const TaskItem = memo(function TaskItem({
  task,
  project,
  parentTitle,
  onComplete,
  onDelete,
  onEdit,
}: TaskItemProps) {
  const { t } = useTranslation()
  const { completing, handleComplete } = useTaskCompletion(onComplete)
  const priorityColor = getPriorityColor(task.priority)

  const isInbox = isInboxProject(project)
  const projectName = isInbox
    ? t('settings:defaultProject.inbox')
    : project?.name

  return (
    <div
      className={`
        group flex items-start justify-between py-3 px-3 -mx-3 rounded-lg
        transition-all duration-200 ease-out
        hover:bg-black/[0.02] hover:-translate-y-0.5
        ${completing ? 'animate-[taskComplete_0.4s_ease-out_forwards]' : ''}
      `}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <TaskCheckbox
          completing={completing}
          onComplete={() => handleComplete(task)}
          priorityColor={priorityColor}
        />

        <div className="flex-1 min-w-0">
          {parentTitle && (
            <div className="text-xs text-[var(--text-secondary)] leading-tight mb-0.5">
              {parentTitle}
            </div>
          )}
          <div
            className={`
              text-sm text-[var(--text-primary)] leading-relaxed break-words mb-1 font-hand
              ${completing ? 'line-through text-[var(--text-secondary)]' : ''}
            `}
          >
            {renderMarkdownLinks(task.title)}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {project && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--bg-secondary)] rounded text-xs">
                <ProjectColorDot
                  color={isInbox ? '#888' : project.color}
                  size="xs"
                />
                <span className="text-[var(--text-secondary)]">
                  #{projectName}
                </span>
              </span>
            )}
            {task.dueDate && (
              <span
                className={`text-xs ${isOverdue(task.dueDate) ? 'text-[var(--danger)]/70' : 'text-[var(--accent)]'}`}
              >
                {formatShortDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(task)}
          className="!w-7 !h-7"
          aria-label={t('common:button.edit')}
        />
        <Popconfirm
          title={t('task:confirm.delete')}
          onConfirm={() => onDelete(task)}
          okText={t('common:button.delete')}
          cancelText={t('common:button.cancel')}
        >
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            className="!w-7 !h-7"
            aria-label={t('common:button.delete')}
          />
        </Popconfirm>
      </div>
    </div>
  )
})
