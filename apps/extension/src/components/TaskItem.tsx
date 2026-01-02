import { Button, Popconfirm } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { formatDateStr, extractDateStr, formatShortDate } from '@/utils/date'
import { getPriorityColor } from '@/constants/task'
import { ProjectColorDot } from './ProjectColorDot'
import { TaskCheckbox } from './common/TaskCheckbox'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import type { Task, Project } from '@/types'

interface TaskItemProps {
  task: Task
  project?: Project
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
}

export function TaskItem({
  task,
  project,
  onComplete,
  onDelete,
  onEdit,
}: TaskItemProps) {
  const { completing, handleComplete } = useTaskCompletion(onComplete)

  const isOverdue = () => {
    if (!task.dueDate) return false
    const taskDate = extractDateStr(task.dueDate)
    const todayStr = formatDateStr(new Date())
    return taskDate < todayStr
  }

  const priorityColor = getPriorityColor(task.priority)

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
          <div
            className={`
              text-sm text-[var(--text-primary)] leading-relaxed break-words mb-1
              ${completing ? 'line-through text-[var(--text-secondary)]' : ''}
            `}
          >
            {task.title}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {project && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--bg-secondary)] rounded text-xs">
                <ProjectColorDot color={project.color} size="xs" />
                <span className="text-[var(--text-secondary)]">
                  #{project.name}
                </span>
              </span>
            )}
            {task.dueDate && (
              <span
                className={`text-xs ${isOverdue() ? 'text-[var(--danger)]/70' : 'text-[var(--accent)]'}`}
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
          className="!w-7 !h-7 !text-[var(--text-secondary)] hover:!text-[var(--accent)] hover:!bg-[var(--accent-light)]"
        />
        <Popconfirm
          title="确定删除此任务？"
          onConfirm={() => onDelete(task)}
          okText="删除"
          cancelText="取消"
        >
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            className="!w-7 !h-7 !text-[var(--text-secondary)] hover:!text-[var(--danger)]/70 hover:!bg-[var(--danger)]/5"
          />
        </Popconfirm>
      </div>
    </div>
  )
}
