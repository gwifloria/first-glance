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

/** Buddy 对话消息 */
export interface BuddyMessage {
  role: 'user' | 'assistant'
  content: string
}
