import { useState } from 'react'
import { Button, Space, Popconfirm } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { Task, Project } from '@/types'

interface TaskItemProps {
  task: Task
  project?: Project
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
}

const getPriorityColor = (priority: number) => {
  if (priority >= 5) return 'var(--priority-high)'
  if (priority >= 3) return 'var(--priority-medium)'
  if (priority >= 1) return 'var(--priority-low)'
  return 'var(--border)'
}

export function TaskItem({
  task,
  project,
  onComplete,
  onDelete,
  onEdit,
}: TaskItemProps) {
  const [completing, setCompleting] = useState(false)

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    const taskDate = dateStr.slice(0, 10)
    const [, month, day] = taskDate.split('-')
    return `${parseInt(month)}/${parseInt(day)}`
  }

  const isOverdue = () => {
    if (!task.dueDate) return false
    const taskDate = task.dueDate.slice(0, 10)
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return taskDate < todayStr
  }

  const handleComplete = () => {
    setCompleting(true)
    setTimeout(() => onComplete(task), 300)
  }

  const priorityColor = getPriorityColor(task.priority)

  return (
    <div
      className={`
        group flex items-start justify-between py-3 transition-all
        ${completing ? 'animate-[taskComplete_0.3s_ease_forwards]' : ''}
      `}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* 圆形复选框 */}
        <div
          onClick={handleComplete}
          style={{ borderColor: priorityColor }}
          className={`
            w-5 h-5 rounded-full border-2 bg-transparent cursor-pointer
            transition-all shrink-0 mt-0.5 flex items-center justify-center
            hover:bg-[var(--accent-light)]
            ${completing ? '!bg-[var(--accent)] !border-[var(--accent)]' : ''}
          `}
        >
          <div
            className={`
              w-2 h-2 rounded-full bg-[var(--border)] transition-opacity
              ${completing ? 'opacity-100 !bg-white' : 'opacity-0 group-hover:opacity-100'}
            `}
          />
        </div>

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
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: project.color || 'var(--accent)' }}
                />
                <span className="text-[var(--text-secondary)]">
                  #{project.name}
                </span>
              </span>
            )}
            {task.dueDate && (
              <span
                className={`text-xs ${isOverdue() ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}
              >
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <Space
        size={4}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
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
            className="!w-7 !h-7 !text-[var(--text-secondary)] hover:!text-[var(--danger)] hover:!bg-red-500/10"
          />
        </Popconfirm>
      </Space>
    </div>
  )
}
