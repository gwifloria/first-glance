import type { AIConfig, BuddyMessage, Mood } from '@/types/buddy'
import type { Task } from '@/types'

const REQUEST_TIMEOUT = 30_000
const TEST_TIMEOUT = 15_000

const PRIORITY_LABEL: Record<number, string> = {
  5: '高',
  3: '中',
  1: '低',
  0: '无',
}

/**
 * 格式化单个任务为文本行
 */
function formatTask(t: Task): string {
  const priorityLabel: Record<number, string> = {
    5: '高',
    3: '中',
    1: '低',
    0: '无',
  }
  const parts: string[] = [`- ${t.title}`]
  if (t.priority > 0)
    parts.push(`[优先级:${priorityLabel[t.priority] ?? '无'}]`)
  if (t.dueDate) parts.push(`[截止:${t.dueDate.slice(0, 10)}]`)
  return parts.join(' ')
}

/**
 * 构建任务摘要
 * focusTasks 非空时区分焦点/其他；为空时列出全部任务
 */
function buildTaskSummary(focusTasks: Task[], allTasks: Task[]): string {
  if (allTasks.length === 0) return '当前没有待办任务。'

  // 无焦点区分时，直接列出全部任务
  if (focusTasks.length === 0) {
    const shown = allTasks.slice(0, 15)
    const lines = ['当前用户的任务列表：', ...shown.map(formatTask)]
    if (allTasks.length > 15) {
      lines.push(`...还有 ${allTasks.length - 15} 个任务`)
    }
    return lines.join('\n')
  }

  // 有焦点任务时，区分焦点和其他
  const focusIds = new Set(focusTasks.map((t) => t.id))
  const otherTasks = allTasks.filter((t) => !focusIds.has(t.id))

  const sections: string[] = []

  sections.push(
    '【当前焦点任务】（用户正在关注的任务，优先围绕这些建议）',
    ...focusTasks.map(formatTask)
  )

  if (otherTasks.length > 0) {
    const shown = otherTasks.slice(0, 10)
    sections.push('', '【其他待办任务】', ...shown.map(formatTask))
    if (otherTasks.length > 10) {
      sections.push(`...还有 ${otherTasks.length - 10} 个任务`)
    }
  }

  return sections.join('\n')
}

/**
 * 构建系统提示词
 */
function buildSystemPrompt(
  mood: Mood,
  focusTasks: Task[],
  allTasks: Task[]
): string {
  const taskSummary = buildTaskSummary(focusTasks, allTasks)

  const moodStrategies: Record<Mood, string> = {
    good: `用户状态不错，精力充沛。推荐优先级最高或最紧急的任务，鼓励挑战重要的工作。`,
    okay: `用户状态一般。推荐中等难度、容易完成并产生成就感的任务，避免推荐压力大的任务。`,
    low: `用户状态低落，精力不足。找到用户可能拖延的任务，引导将大任务拆解为 1-5 分钟的小步骤。语气温和鼓励，不要施加压力。`,
  }

  const focusHint =
    focusTasks.length > 0
      ? '- 优先围绕【当前焦点任务】给出具体的下一步行动建议'
      : '- 给出具体的下一步行动建议'

  const actionsInstruction =
    allTasks.length > 0
      ? `

操作建议格式（可选）：
当你有具体的操作建议时（如调整优先级、拆解任务为小步骤），在回复末尾附加操作区段。
格式要求：
\`\`\`
:::actions
set_priority|任务标题|high
add_subtask|任务标题|步骤1,步骤2,步骤3
:::
\`\`\`
- set_priority: 调整优先级，可选值 high/medium/low/none
- add_subtask: 拆解任务为子任务/步骤，用逗号分隔
- 任务标题必须与用户任务列表中的标题完全一致
- 只在有明确建议时才输出此区段，日常对话不需要
- 每个操作占一行`
      : ''

  return `你是一个任务规划助手，帮助用户决定下一步该做什么。

${taskSummary}

用户当前情绪状态：${mood === 'good' ? '状态不错' : mood === 'okay' ? '一般' : '有点累'}

策略：${moodStrategies[mood]}

要求：
- 简洁回复，3-5 句话
${focusHint}
- 引用用户实际的任务名称
- 如果用户没有任务，给出轻松的鼓励
- 使用用户的语言回复（如果任务标题是中文就用中文，英文就用英文）${actionsInstruction}`
}

/**
 * 测试 AI 配置是否可用
 * 发送一个极简请求验证连通性
 */
export async function testAIConfig(config: AIConfig): Promise<void> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      if (response.status === 401) throw new Error('API Key invalid')
      if (response.status === 404) throw new Error('Model not found')
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Timeout')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 发送 Buddy 请求到 OpenAI 兼容 API
 */
export async function sendBuddyRequest(
  config: AIConfig,
  mood: Mood,
  focusTasks: Task[],
  allTasks: Task[],
  history: BuddyMessage[] = [],
  signal?: AbortSignal
): Promise<string> {
  const systemPrompt = buildSystemPrompt(mood, focusTasks, allTasks)

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]

  // 如果没有用户消息，添加一个触发消息
  if (history.length === 0) {
    const moodText =
      mood === 'good'
        ? '我现在状态不错'
        : mood === 'okay'
          ? '我状态一般'
          : '我有点累'
    messages.push({
      role: 'user' as const,
      content: `${moodText}，推荐我接下来做什么？`,
    })
  }

  const baseUrl = config.baseUrl.replace(/\/+$/, '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  // 外部 signal 触发时也 abort
  if (signal) {
    if (signal.aborted) {
      controller.abort()
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查配置')
      }
      throw new Error(`请求失败 (${response.status})`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('AI 返回了空内容')
    }

    return content.trim()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // 外部信号触发的 abort（用户主动取消），原样抛出让调用方静默处理
      if (signal?.aborted) throw error
      throw new Error('请求超时，请稍后重试')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
