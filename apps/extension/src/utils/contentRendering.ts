/**
 * 任务内容渲染工具：markdown/HTML 解析、HTML 净化、纯文本摘要
 */

// 简单 markdown → HTML 转换
function markdownToHtml(text: string): string {
  return (
    text
      // 标题
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // checkbox 列表
      .replace(/^[-*] \[x\] (.+)$/gm, '<li><s>$1</s></li>')
      .replace(/^[-*] \[ \] (.+)$/gm, '<li>$1</li>')
      // 普通列表
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      // 连续 <li> 包裹为 <ul>
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      // 高亮（滴答清单 ::text:: 语法）
      .replace(/::(.+?)::/g, '<mark>$1</mark>')
      // 加粗 / 删除线 / 行内代码（不处理单 * 斜体，项目规范禁用 italic）
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // 链接
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      // 换行
      .replace(/\n/g, '<br>')
      .trim()
  )
}

// 清理 HTML 中的危险内容
function sanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(
      /<(?!\/?(?:p|br|strong|em|b|i|ul|ol|li|s|del|a|h[1-6]|span|code|mark)\b)[^>]+>/gi,
      ''
    )
    .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/href\s*=\s*["']?javascript:[^"'\s>]*/gi, 'href="#"')
    .replace(/href\s*=\s*["']?data:[^"'\s>]*/gi, 'href="#"')
    .trim()
}

/** 内容可能是 HTML 或 markdown，统一转为安全 HTML */
export function parseContent(content: string): string {
  const isHtml = /<[a-z][a-z0-9]*(\s[^>]*)?\s*\/?>/i.test(content)
  return isHtml ? sanitizeHtml(content) : markdownToHtml(content)
}

/** 从原始内容直接生成纯文本摘要，避免 markdownToHtml → stripTags 的无用转换 */
export function contentToSummary(content: string): string {
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/^#{1,3} /gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/::/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*] (\[.\] )?/gm, '')
    .replace(/\n/g, ' ')
    .trim()
}
