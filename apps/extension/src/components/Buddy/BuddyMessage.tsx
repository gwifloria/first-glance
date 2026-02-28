import { type ReactNode, useState } from 'react'
import { Button } from 'antd'
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { BuddyAction, ActionStatus } from '@/types/buddy'

/**
 * 轻量 Markdown 渲染
 * 支持：**加粗**、行内 `code`、换行
 */
function renderSimpleMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n')
  const result: ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    if (i > 0) result.push(<br key={`br-${i}`} />)
    result.push(...renderInline(lines[i], `line-${i}`))
  }

  return result
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // 匹配 **bold** 和 `code`
  const pattern = /(\*\*(.+?)\*\*)|(`(.+?)`)/g
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let idx = 0

  while ((match = pattern.exec(text)) !== null) {
    // 前面的普通文本
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      nodes.push(
        <strong
          key={`${keyPrefix}-b-${idx}`}
          className="font-semibold bg-[var(--accent)]/10 rounded-sm px-0.5"
        >
          {match[2]}
        </strong>
      )
    } else if (match[4]) {
      // `code`
      nodes.push(
        <code
          key={`${keyPrefix}-c-${idx}`}
          className="px-1 py-0.5 rounded bg-[var(--bg-primary)] text-xs"
        >
          {match[4]}
        </code>
      )
    }

    lastIndex = match.index + match[0].length
    idx++
  }

  // 剩余文本
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

const PRIORITY_LABELS: Record<string, string> = {
  high: '⬆️',
  medium: '➡️',
  low: '⬇️',
  none: '⏺',
}

/** 操作描述文本 */
function ActionCard({
  action,
  status,
  onExecute,
}: {
  action: BuddyAction
  status: ActionStatus
  onExecute: () => void
}) {
  const { t } = useTranslation('buddy')

  const buttonContent =
    status === 'executing' ? (
      <LoadingOutlined />
    ) : status === 'done' ? (
      <CheckOutlined />
    ) : null

  const doneText =
    action.type === 'set_priority'
      ? t('action.priorityUpdated')
      : t('action.subtasksAdded', {
          count: action.type === 'add_subtasks' ? action.subtitles.length : 0,
        })

  const buttonText =
    status === 'done'
      ? doneText
      : action.type === 'add_subtasks'
        ? t('action.addAll')
        : t('action.adopt')

  if (action.type === 'set_priority') {
    return (
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--text-secondary)] truncate">
            {action.taskTitle}
          </div>
          <div className="text-xs text-[var(--text-primary)]">
            {t('action.setPriority', {
              level: `${PRIORITY_LABELS[action.priority] ?? ''} ${t(`action.priority.${action.priority}`)}`,
            })}
          </div>
        </div>
        <Button
          type="text"
          size="small"
          onClick={onExecute}
          disabled={status === 'executing' || status === 'done'}
          className="!text-xs !h-6 !px-2 !text-[var(--accent)]"
          icon={buttonContent}
        >
          {status !== 'executing' && buttonText}
        </Button>
      </div>
    )
  }

  // add_subtasks
  return (
    <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
      <div className="text-xs text-[var(--text-secondary)] truncate mb-1">
        {action.taskTitle}
      </div>
      <div className="flex flex-col gap-0.5 mb-1.5">
        {action.subtitles.map((sub, i) => (
          <div
            key={i}
            className="text-xs text-[var(--text-primary)] pl-2 before:content-['·'] before:mr-1 before:text-[var(--text-secondary)]"
          >
            {sub}
          </div>
        ))}
      </div>
      <Button
        type="text"
        size="small"
        onClick={onExecute}
        disabled={status === 'executing' || status === 'done'}
        className="!text-xs !h-6 !px-2 !text-[var(--accent)]"
        icon={buttonContent}
      >
        {status !== 'executing' && buttonText}
      </Button>
    </div>
  )
}

interface BuddyMessageProps {
  role: 'user' | 'assistant'
  content: string
  actions?: BuddyAction[]
  onAction?: (action: BuddyAction) => Promise<void>
}

export function BuddyMessage({
  role,
  content,
  actions,
  onAction,
}: BuddyMessageProps) {
  const [statuses, setStatuses] = useState<Record<number, ActionStatus>>({})

  const handleExecute = async (action: BuddyAction, index: number) => {
    if (!onAction) return
    setStatuses((prev) => ({ ...prev, [index]: 'executing' }))
    try {
      await onAction(action)
      setStatuses((prev) => ({ ...prev, [index]: 'done' }))
    } catch {
      setStatuses((prev) => ({ ...prev, [index]: 'error' }))
    }
  }

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="text-sm leading-relaxed py-2 px-3 rounded-xl bg-[var(--accent)] text-white max-w-[85%]">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="text-sm text-[var(--text-primary)] leading-relaxed py-2 px-3 rounded-xl bg-[var(--bg-secondary)] max-w-[85%]">
        {renderSimpleMarkdown(content)}
        {actions && actions.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-[var(--border)]">
            {actions.map((action, i) => (
              <ActionCard
                key={`${action.type}-${action.taskId}-${i}`}
                action={action}
                status={statuses[i] ?? 'idle'}
                onExecute={() => handleExecute(action, i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
