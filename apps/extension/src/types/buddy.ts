/** 情绪类型 */
export type Mood = 'good' | 'okay' | 'low'

/** AI 服务配置（OpenAI 兼容） */
export interface AIConfig {
  /** API 地址，如 https://api.openai.com/v1 */
  baseUrl: string
  /** API Key */
  apiKey: string
  /** 模型名称，如 gpt-4o-mini */
  model: string
}

/** 优先级级别 */
export type PriorityLevel = 'high' | 'medium' | 'low' | 'none'

/** Buddy 操作建议 */
export type BuddyAction =
  | {
      type: 'set_priority'
      taskId: string
      taskTitle: string
      priority: PriorityLevel
    }
  | {
      type: 'add_subtasks'
      taskId: string
      taskTitle: string
      subtitles: string[]
    }

/** 操作执行状态 */
export type ActionStatus = 'idle' | 'executing' | 'done' | 'error'

/** Buddy 对话消息 */
export interface BuddyMessage {
  role: 'user' | 'assistant'
  content: string
  actions?: BuddyAction[]
}
