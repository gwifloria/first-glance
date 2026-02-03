import type { ReactNode } from 'react'

/**
 * 将文本中的 Markdown 链接 [text](url) 转换为可点击的 <a> 标签
 * 其他文本保持原样
 */
export function renderMarkdownLinks(text: string): ReactNode {
  // 匹配 [显示文本](URL) 格式
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let keyIndex = 0

  while ((match = linkRegex.exec(text)) !== null) {
    // 添加链接前的普通文本
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    // 添加链接
    const [, linkText, url] = match
    parts.push(
      <a
        key={keyIndex++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--accent)] hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {linkText}
      </a>
    )

    lastIndex = match.index + match[0].length
  }

  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  // 如果没有链接，直接返回原文本
  if (parts.length === 0) {
    return text
  }

  return <>{parts}</>
}
