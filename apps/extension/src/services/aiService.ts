import type { AIConfig, BuddyMessage, Mood } from '@/types/buddy'
import type { Task } from '@/types'

const REQUEST_TIMEOUT = 30_000
const TEST_TIMEOUT = 15_000

type Lang = 'zh' | 'en'

/** 从 i18n language 标识归一化为 zh/en */
export function normalizeLang(lang: string): Lang {
  return lang.startsWith('zh') ? 'zh' : 'en'
}

const PRIORITY_LABEL: Record<Lang, Record<number, string>> = {
  zh: { 5: '高', 3: '中', 1: '低', 0: '无' },
  en: { 5: 'High', 3: 'Medium', 1: 'Low', 0: 'None' },
}

/**
 * 格式化单个任务为文本行
 * @internal 仅供测试使用
 */
export function formatTask(t: Task, lang: Lang = 'zh'): string {
  const labels = PRIORITY_LABEL[lang]
  const priorityKey = lang === 'zh' ? '优先级' : 'Priority'
  const dueKey = lang === 'zh' ? '截止' : 'Due'
  const parts: string[] = [`- ${t.title}`]
  if (t.priority > 0)
    parts.push(`[${priorityKey}:${labels[t.priority] ?? labels[0]}]`)
  if (t.dueDate) parts.push(`[${dueKey}:${t.dueDate.slice(0, 10)}]`)
  return parts.join(' ')
}

/**
 * 构建 parentId → 子任务列表 的映射
 * @internal 仅供测试使用
 */
export function buildChildrenMap(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    if (t.parentId) {
      const list = map.get(t.parentId)
      if (list) {
        list.push(t)
      } else {
        map.set(t.parentId, [t])
      }
    }
  }
  return map
}

/**
 * 格式化任务及其子任务为文本行
 */
function formatTaskWithChildren(
  t: Task,
  childrenMap: Map<string, Task[]>,
  lang: Lang = 'zh'
): string[] {
  const lines = [formatTask(t, lang)]
  const children = childrenMap.get(t.id)
  if (children && children.length > 0) {
    for (const child of children) {
      lines.push(`  - ${child.title}`)
    }
  }
  return lines
}

const SUMMARY_TEXT = {
  zh: {
    noTasks: '当前没有待办任务。',
    taskList: '当前用户的任务列表：',
    focusHeader: '【当前焦点任务】（用户正在关注的任务，优先围绕这些建议）',
    otherHeader: '【其他待办任务】',
    moreItems: (n: number) => `...还有 ${n} 个任务`,
  },
  en: {
    noTasks: 'No tasks at the moment.',
    taskList: "User's current task list:",
    focusHeader:
      '[Focus Tasks] (tasks the user is currently focusing on, prioritize suggestions around these)',
    otherHeader: '[Other Tasks]',
    moreItems: (n: number) => `...and ${n} more tasks`,
  },
} as const

/**
 * 构建任务摘要
 * focusTasks 非空时区分焦点/其他；为空时列出全部任务
 * 包含已有子任务信息，避免 AI 建议重复的子任务
 * @internal 仅供测试使用
 */
export function buildTaskSummary(
  focusTasks: Task[],
  allTasks: Task[],
  lang: Lang = 'zh'
): string {
  const txt = SUMMARY_TEXT[lang]
  if (allTasks.length === 0) return txt.noTasks

  const childrenMap = buildChildrenMap(allTasks)
  // 顶层任务：没有 parentId 的任务
  const topLevelTasks = allTasks.filter((t) => !t.parentId)

  // 无焦点区分时，直接列出全部任务
  if (focusTasks.length === 0) {
    const shown = topLevelTasks.slice(0, 15)
    const lines = [
      txt.taskList,
      ...shown.flatMap((t) => formatTaskWithChildren(t, childrenMap, lang)),
    ]
    if (topLevelTasks.length > 15) {
      lines.push(txt.moreItems(topLevelTasks.length - 15))
    }
    return lines.join('\n')
  }

  // 有焦点任务时，区分焦点和其他
  const focusIds = new Set(focusTasks.map((t) => t.id))
  // 焦点中只取顶层任务
  const focusTopLevel = focusTasks.filter((t) => !t.parentId)
  const otherTasks = topLevelTasks.filter((t) => !focusIds.has(t.id))

  const sections: string[] = []

  sections.push(
    txt.focusHeader,
    ...focusTopLevel.flatMap((t) =>
      formatTaskWithChildren(t, childrenMap, lang)
    )
  )

  if (otherTasks.length > 0) {
    const shown = otherTasks.slice(0, 10)
    sections.push(
      '',
      txt.otherHeader,
      ...shown.flatMap((t) => formatTaskWithChildren(t, childrenMap, lang))
    )
    if (otherTasks.length > 10) {
      sections.push(txt.moreItems(otherTasks.length - 10))
    }
  }

  return sections.join('\n')
}

const PROMPT_TEXT = {
  zh: {
    role: '你是一个任务规划助手，帮助用户决定下一步该做什么。',
    moodLabel: '用户当前情绪状态：',
    moodValues: { good: '状态不错', okay: '一般', low: '有点累' } as Record<
      Mood,
      string
    >,
    strategyLabel: '策略：',
    strategies: {
      good: '用户状态不错，精力充沛。推荐优先级最高或最紧急的任务，鼓励挑战重要的工作。',
      okay: '用户状态一般。推荐中等难度、容易完成并产生成就感的任务，避免推荐压力大的任务。',
      low: '用户状态低落，精力不足。找到用户可能拖延的任务，引导将大任务拆解为 1-5 分钟的小步骤。语气温和鼓励，不要施加压力。',
    } as Record<Mood, string>,
    requirements: '要求：',
    concise: '- 简洁回复，3-5 句话',
    focusHint: '- 优先围绕【当前焦点任务】给出具体的下一步行动建议',
    generalHint: '- 给出具体的下一步行动建议',
    referTasks: '- 引用用户实际的任务名称',
    noTaskEncourage: '- 如果用户没有任务，给出轻松的鼓励',
    matchLang: '- 使用中文回复',
    actionsInstruction: `
操作建议格式（可选）：
当你有具体的操作建议时（如调整优先级、拆解任务为小步骤），在回复末尾附加操作区段。
格式要求：
:::actions
set_priority|任务标题|high
add_subtask|任务标题|步骤1,步骤2,步骤3
:::
- set_priority: 调整优先级，可选值 high/medium/low/none
- add_subtask: 拆解任务为子任务/步骤，用逗号分隔（不要建议已存在的子任务）
- 每次只对 1 个任务建议拆解，子任务不超过 3-5 个，聚焦最关键的下一步
- 任务标题必须与用户任务列表中的标题完全一致
- 只在有明确建议时才输出此区段，日常对话不需要
- 每个操作占一行`,
    triggerPrefix: {
      good: '我现在状态不错',
      okay: '我状态一般',
      low: '我有点累',
    } as Record<Mood, string>,
    triggerSuffix: '，推荐我接下来做什么？',
  },
  en: {
    role: 'You are a task planning assistant helping the user decide what to do next.',
    moodLabel: "User's current mood: ",
    moodValues: {
      good: 'Feeling good',
      okay: 'So-so',
      low: 'A bit tired',
    } as Record<Mood, string>,
    strategyLabel: 'Strategy: ',
    strategies: {
      good: 'The user is feeling energetic. Recommend the highest-priority or most urgent tasks, and encourage tackling important work.',
      okay: 'The user is feeling average. Recommend moderate tasks that are easy to complete and provide a sense of achievement. Avoid high-pressure tasks.',
      low: 'The user is feeling low on energy. Find tasks the user might be procrastinating on, and guide them to break large tasks into 1-5 minute small steps. Use a warm, encouraging tone without pressure.',
    } as Record<Mood, string>,
    requirements: 'Requirements:',
    concise: '- Keep replies concise, 3-5 sentences',
    focusHint:
      '- Prioritize suggestions around [Focus Tasks] with specific next-step actions',
    generalHint: '- Provide specific next-step action suggestions',
    referTasks: "- Reference the user's actual task names",
    noTaskEncourage:
      '- If the user has no tasks, offer lighthearted encouragement',
    matchLang: '- Reply in English',
    actionsInstruction: `
Action suggestions format (optional):
When you have specific action suggestions (e.g., adjusting priority, breaking down tasks into small steps), append an actions section at the end of your reply.
Format:
:::actions
set_priority|Task Title|high
add_subtask|Task Title|Step 1,Step 2,Step 3
:::
- set_priority: adjust priority, values: high/medium/low/none
- add_subtask: break down task into subtasks/steps, comma-separated (do not suggest subtasks that already exist)
- Only break down 1 task at a time, limit to 3-5 subtasks, focus on the most critical next steps
- Task title must exactly match the title in the user's task list
- Only output this section when you have clear suggestions, not needed for casual conversation
- One action per line`,
    triggerPrefix: {
      good: "I'm feeling good",
      okay: "I'm feeling so-so",
      low: "I'm a bit tired",
    } as Record<Mood, string>,
    triggerSuffix: ', what should I do next?',
  },
} as const

/**
 * 构建系统提示词
 */
function buildSystemPrompt(
  mood: Mood,
  focusTasks: Task[],
  allTasks: Task[],
  lang: Lang = 'zh'
): string {
  const txt = PROMPT_TEXT[lang]
  const taskSummary = buildTaskSummary(focusTasks, allTasks, lang)

  const focusHint = focusTasks.length > 0 ? txt.focusHint : txt.generalHint
  const actionsInstruction = allTasks.length > 0 ? txt.actionsInstruction : ''

  return `${txt.role}

${taskSummary}

${txt.moodLabel}${txt.moodValues[mood]}

${txt.strategyLabel}${txt.strategies[mood]}

${txt.requirements}
${txt.concise}
${focusHint}
${txt.referTasks}
${txt.noTaskEncourage}
${txt.matchLang}${actionsInstruction}`
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

const ERROR_TEXT = {
  zh: {
    invalidKey: 'API Key 无效，请检查配置',
    requestFailed: (code: number) => `请求失败 (${code})`,
    emptyResponse: 'AI 返回了空内容',
    timeout: '请求超时，请稍后重试',
  },
  en: {
    invalidKey: 'Invalid API Key, please check your settings',
    requestFailed: (code: number) => `Request failed (${code})`,
    emptyResponse: 'AI returned empty content',
    timeout: 'Request timed out, please try again',
  },
} as const

/**
 * 发送 Buddy 请求到 OpenAI 兼容 API
 */
export async function sendBuddyRequest(
  config: AIConfig,
  mood: Mood,
  focusTasks: Task[],
  allTasks: Task[],
  history: BuddyMessage[] = [],
  signal?: AbortSignal,
  lang: Lang = 'zh'
): Promise<string> {
  const systemPrompt = buildSystemPrompt(mood, focusTasks, allTasks, lang)
  const txt = PROMPT_TEXT[lang]
  const errTxt = ERROR_TEXT[lang]

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]

  // 如果没有用户消息，添加一个触发消息
  if (history.length === 0) {
    messages.push({
      role: 'user' as const,
      content: `${txt.triggerPrefix[mood]}${txt.triggerSuffix}`,
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
        throw new Error(errTxt.invalidKey)
      }
      throw new Error(errTxt.requestFailed(response.status))
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error(errTxt.emptyResponse)
    }

    return content.trim()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // 外部信号触发的 abort（用户主动取消），原样抛出让调用方静默处理
      if (signal?.aborted) throw error
      throw new Error(errTxt.timeout)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
