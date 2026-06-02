import { memo } from 'react'
import { RightOutlined, TagOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatShortDate } from '@/utils/date'
import { isOverdue } from '@/utils/taskFilters'
import { getPriorityColor } from '@/constants/task'
import { isInboxProject } from '@/utils/project'
import { renderMarkdownLinks } from '@/utils/renderMarkdownLinks'
import { contentToSummary } from '@/utils/contentRendering'
import { ProjectColorDot } from '../common/ProjectColorDot'
import { TaskCheckbox } from '../common/TaskCheckbox'
import { StartPomodoroButton } from '../common'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import type { Task, Project } from '@/types'

interface TaskItemProps {
  task: Task
  project?: Project
  parentTitle?: string
  expandable?: boolean
  expanded?: boolean
  /** 作为子任务嵌套展示：字号/行距略缩小，体现层级 */
  nested?: boolean
  onToggleExpand?: () => void
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  /** 从列表直接开启番茄钟（绑定该任务并切到 Focus） */
  onStartPomodoro?: (task: Task) => void
}

export const TaskItem = memo(function TaskItem({
  task,
  project,
  parentTitle,
  expandable,
  expanded,
  nested,
  onToggleExpand,
  onComplete,
  onEdit,
  onStartPomodoro,
}: TaskItemProps) {
  const { t } = useTranslation()
  const { completing, handleComplete } = useTaskCompletion(onComplete)
  const priorityColor = getPriorityColor(task.priority)

  const isInbox = isInboxProject(project)
  const projectName = isInbox
    ? t('settings:defaultProject.inbox')
    : project?.name

  const summary = task.content ? contentToSummary(task.content) : ''

  return (
    <div
      onClick={() => onEdit(task)}
      className={`
        group flex items-start justify-between px-3 -mx-3 rounded-lg cursor-pointer
        transition-all duration-200 ease-out
        hover:bg-[var(--overlay-hover-surface)] hover:-translate-y-0.5
        ${nested ? 'py-2' : 'py-3'}
        ${completing ? 'animate-[taskComplete_0.8s_ease-in-out_forwards] overflow-hidden' : ''}
      `}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {expandable && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand?.()
            }}
            className="flex items-center justify-center w-4 h-4 mt-0.5 shrink-0 -ml-7 mr-3 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RightOutlined
              className={`text-[8px] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}
        <span onClick={(e) => e.stopPropagation()}>
          <TaskCheckbox
            completing={completing}
            onComplete={() => handleComplete(task)}
            priorityColor={priorityColor}
          />
        </span>

        <div className="flex-1 min-w-0">
          {parentTitle && (
            <div className="text-xs text-[var(--text-secondary)] leading-tight mb-0.5 inline-flex items-center gap-0.5 bg-[var(--bg-secondary)] rounded px-1.5 py-0.5 w-fit">
              <span className="opacity-60">↳</span> {parentTitle}
            </div>
          )}
          <div
            className={`
              text-[var(--text-primary)] leading-relaxed break-words font-hand
              ${summary ? 'mb-0.5' : 'mb-1'}
              ${completing ? 'task-strike-through text-[var(--text-secondary)]' : ''}
            `}
            style={{
              fontSize: `calc(${nested ? '0.85rem' : '0.9375rem'} * var(--font-hand-scale, 1))`,
            }}
          >
            {renderMarkdownLinks(task.title)}
          </div>
          {summary && (
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-1 mb-1">
              {summary}
            </div>
          )}
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
            {task.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-xs text-[var(--text-secondary)]"
              >
                <TagOutlined className="text-[10px] opacity-70" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 列表行只保留「开启番茄钟」，删除等编辑操作收进任务详情抽屉内 */}
      {onStartPomodoro && (
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <StartPomodoroButton task={task} onStart={onStartPomodoro} />
        </div>
      )}
    </div>
  )
})
