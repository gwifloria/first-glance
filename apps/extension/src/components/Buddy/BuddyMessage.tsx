import { type ReactNode } from 'react'

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

interface BuddyMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function BuddyMessage({ role, content }: BuddyMessageProps) {
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
      </div>
    </div>
  )
}
