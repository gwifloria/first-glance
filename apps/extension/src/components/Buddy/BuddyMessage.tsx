import { type ReactNode, useState, useEffect, useRef } from 'react'
import { Button, Checkbox, Tooltip } from 'antd'
import {
  CheckOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppMode } from '@/contexts'
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
  high: '↑',
  medium: '→',
  low: '↓',
  none: '·',
}

/** 操作描述文本 */
function ActionCard({
  action,
  status,
  onExecute,
  undoFn,
  onUndo,
}: {
  action: BuddyAction
  status: ActionStatus
  onExecute: (modifiedAction: BuddyAction) => void
  undoFn?: () => Promise<void>
  onUndo?: () => void
}) {
  const { t } = useTranslation('buddy')
  const { isGuest } = useAppMode()

  // 子任务多选状态
  const [selected, setSelected] = useState<Set<number>>(
    () =>
      new Set(
        action.type === 'add_subtasks' ? action.subtitles.map((_, i) => i) : []
      )
  )

  const buttonContent =
    status === 'executing' ? (
      <LoadingOutlined />
    ) : status === 'done' ? (
      <CheckOutlined />
    ) : status === 'error' ? (
      <WarningOutlined />
    ) : null

  const handleClick = () => {
    if (action.type === 'add_subtasks') {
      const filteredSubtitles = action.subtitles.filter((_, i) =>
        selected.has(i)
      )
      onExecute({ ...action, subtitles: filteredSubtitles })
    } else {
      onExecute(action)
    }
  }

  const noSelection = action.type === 'add_subtasks' && selected.size === 0

  const getButtonText = () => {
    if (status === 'error') return t('action.retry')
    if (status === 'done') {
      return action.type === 'set_priority'
        ? t('action.priorityUpdated')
        : t('action.subtasksAdded', { count: selected.size })
    }
    if (action.type === 'add_subtasks') {
      return selected.size === action.subtitles.length
        ? t('action.addAll')
        : t('action.addSelected', { count: selected.size })
    }
    return t('action.adopt')
  }

  const isDisabled =
    isGuest || status === 'executing' || status === 'done' || noSelection

  const renderButton = () => {
    const btnClassName =
      status === 'error'
        ? '!text-xs !h-6 !px-2 !text-red-500'
        : '!text-xs !h-6 !px-2 !text-[var(--accent)]'

    const btn = (
      <Button
        type="text"
        size="small"
        onClick={handleClick}
        disabled={isDisabled}
        className={btnClassName}
        icon={buttonContent}
      >
        {status !== 'executing' && getButtonText()}
      </Button>
    )

    if (isGuest && status === 'idle') {
      return (
        <Tooltip title={t('action.guestDisabled')}>
          <span>{btn}</span>
        </Tooltip>
      )
    }

    return btn
  }

  const renderUndoButton = () => {
    if (status !== 'done' || !undoFn || !onUndo) return null
    return (
      <button
        onClick={onUndo}
        className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] ml-1"
      >
        {t('action.undo')}
      </button>
    )
  }

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
        <div className="flex items-center">
          {renderButton()}
          {renderUndoButton()}
        </div>
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
          <Checkbox
            key={i}
            checked={selected.has(i)}
            onChange={(e) => {
              setSelected((prev) => {
                const next = new Set(prev)
                if (e.target.checked) {
                  next.add(i)
                } else {
                  next.delete(i)
                }
                return next
              })
            }}
            disabled={status === 'executing' || status === 'done'}
            className="!text-xs"
          >
            {sub}
          </Checkbox>
        ))}
      </div>
      {renderButton()}
    </div>
  )
}

interface BuddyMessageProps {
  role: 'user' | 'assistant'
  content: string
  actions?: BuddyAction[]
  onAction?: (action: BuddyAction) => Promise<(() => Promise<void>) | void>
}

export function BuddyMessage({
  role,
  content,
  actions,
  onAction,
}: BuddyMessageProps) {
  const [statuses, setStatuses] = useState<Record<number, ActionStatus>>({})
  const [undoFns, setUndoFns] = useState<Record<number, () => Promise<void>>>(
    {}
  )
  const timerRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  // 清理定时器
  useEffect(() => {
    const refs = timerRefs.current
    return () => {
      Object.values(refs).forEach(clearTimeout)
    }
  }, [])

  const handleExecute = async (action: BuddyAction, index: number) => {
    if (!onAction) return
    setStatuses((prev) => ({ ...prev, [index]: 'executing' }))
    try {
      const undoFn = await onAction(action)
      setStatuses((prev) => ({ ...prev, [index]: 'done' }))
      if (undoFn) {
        setUndoFns((prev) => ({ ...prev, [index]: undoFn }))
        // 5 秒后自动清除 undo
        timerRefs.current[index] = setTimeout(() => {
          setUndoFns((prev) => {
            const next = { ...prev }
            delete next[index]
            return next
          })
          delete timerRefs.current[index]
        }, 5000)
      }
    } catch {
      setStatuses((prev) => ({ ...prev, [index]: 'error' }))
    }
  }

  const handleUndo = async (index: number) => {
    const undoFn = undoFns[index]
    if (!undoFn) return
    // 清除定时器
    if (timerRefs.current[index]) {
      clearTimeout(timerRefs.current[index])
      delete timerRefs.current[index]
    }
    setStatuses((prev) => ({ ...prev, [index]: 'executing' }))
    try {
      await undoFn()
      // 撤销成功，恢复到 idle
      setStatuses((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
      setUndoFns((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
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
                onExecute={(modifiedAction) => handleExecute(modifiedAction, i)}
                undoFn={undoFns[i]}
                onUndo={() => handleUndo(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
