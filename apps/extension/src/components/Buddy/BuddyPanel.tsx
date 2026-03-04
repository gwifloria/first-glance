import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Button, Input, Spin, message } from 'antd'
import {
  CloseOutlined,
  SettingOutlined,
  SendOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import { getSettings, subscribeSettings } from '@/services/settingsStorage'
import { sendBuddyRequest, normalizeLang } from '@/services/aiService'
import { extractActions, priorityToNumber } from '@/services/buddyActionParser'
import type {
  Mood,
  BuddyMessage as BuddyMessageType,
  BuddyAction,
} from '@/types/buddy'
import type { Task } from '@/types'
import { BuddyMessage } from './BuddyMessage'

type PanelPhase = 'no-config' | 'select-mood' | 'chatting'

// --- MoodSelector（内联，仅此处使用） ---

const MOOD_OPTIONS: { key: Mood; kaomoji: string; labelKey: string }[] = [
  { key: 'good', kaomoji: '(◕‿◕)', labelKey: 'mood.good' },
  { key: 'okay', kaomoji: '(￣_￣)', labelKey: 'mood.okay' },
  { key: 'low', kaomoji: '(´-ω-`)', labelKey: 'mood.low' },
]

function MoodSelector({ onSelect }: { onSelect: (mood: Mood) => void }) {
  const { t } = useTranslation('buddy')

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {t('mood.title')}
      </div>
      <div className="flex gap-2">
        {MOOD_OPTIONS.map(({ key, kaomoji, labelKey }) => (
          <Button
            key={key}
            type="text"
            onClick={() => onSelect(key)}
            className="!flex !flex-col !items-center !gap-1 !h-auto !py-2 !px-3 !rounded-xl hover:!bg-[var(--bg-secondary)]"
          >
            <span className="text-base">{kaomoji}</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {t(labelKey)}
            </span>
          </Button>
        ))}
      </div>
      <div className="text-[11px] text-[var(--text-secondary)] text-center max-w-[280px] leading-relaxed opacity-70">
        {t('mood.hint')}
      </div>
    </div>
  )
}

// --- BuddyPanel ---

interface BuddyPanelProps {
  visible: boolean
  onClose: () => void
  onOpenSettings: () => void
}

export function BuddyPanel({
  visible,
  onClose,
  onOpenSettings,
}: BuddyPanelProps) {
  const { t, i18n } = useTranslation('buddy')
  const { data, actions, views } = useTaskContext()

  const [phase, setPhase] = useState<PanelPhase>('select-mood')
  const [messages, setMessages] = useState<BuddyMessageType[]>([])
  const [mood, setMood] = useState<Mood | null>(null)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 卸载时取消进行中的请求
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // 检查 AI 配置，并监听变化
  useEffect(() => {
    const check = (config?: {
      baseUrl?: string
      apiKey?: string
      model?: string
    }) => {
      const hasConfig = !!(config?.baseUrl && config?.apiKey && config?.model)
      setPhase((prev) => {
        // 配置就绪：从 no-config 进入 select-mood
        if (hasConfig && prev === 'no-config') return 'select-mood'
        // 配置清空：回到 no-config
        if (!hasConfig && prev !== 'no-config') return 'no-config'
        return prev
      })
    }
    getSettings().then((s) => check(s.aiConfig))
    return subscribeSettings((s) => check(s.aiConfig))
  }, [])

  // 任务数据源变化时重置对话（如 disconnect 后任务清空）
  const prevTaskCountRef = useRef(data.tasks.length)
  useEffect(() => {
    const prev = prevTaskCountRef.current
    const curr = data.tasks.length
    prevTaskCountRef.current = curr
    // 从有任务变成无任务（disconnect），且当前在对话中 → 自动重置
    if (prev > 0 && curr === 0 && phase === 'chatting') {
      abortRef.current?.abort()
      setMessages([])
      setMood(null)
      setInputValue('')
      setLoading(false)
      setPhase('select-mood')
    }
  }, [data.tasks.length, phase])

  // 重置对话
  const handleReset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setMood(null)
    setInputValue('')
    setLoading(false)
    setPhase('select-mood')
  }, [])

  // 获取当前任务数据
  const getTasksForAI = useCallback(() => {
    const allTasks = (data.tasks ?? []) as Task[]
    const focusTasks = (views.focusTasks as Task[]) ?? []
    return { focusTasks, allTasks }
  }, [data.tasks, views.focusTasks])

  // 校验 AI 配置，无效时切到 no-config
  const getValidConfig = useCallback(async () => {
    const settings = await getSettings()
    const config = settings.aiConfig
    if (!config?.baseUrl || !config?.apiKey || !config?.model) {
      setPhase('no-config')
      return null
    }
    return config
  }, [])

  // 处理 AI 回复：提取 actions 并生成消息
  const processReply = useCallback(
    (reply: string): BuddyMessageType => {
      const allTasks = (data.tasks ?? []) as Task[]
      const { cleanText, actions: parsedActions } = extractActions(
        reply,
        allTasks
      )
      return {
        role: 'assistant',
        content: cleanText,
        actions: parsedActions.length > 0 ? parsedActions : undefined,
      }
    },
    [data.tasks]
  )

  // 核心：发送 AI 请求并返回处理后的消息
  const lang = useMemo(() => normalizeLang(i18n.language), [i18n.language])
  const fetchReply = useCallback(
    async (
      requestMood: Mood,
      history: BuddyMessageType[],
      signal: AbortSignal
    ): Promise<BuddyMessageType | null> => {
      const config = await getValidConfig()
      if (!config) return null
      const { focusTasks, allTasks } = getTasksForAI()
      const reply = await sendBuddyRequest(
        config,
        requestMood,
        focusTasks,
        allTasks,
        history,
        signal,
        lang
      )
      return processReply(reply)
    },
    [getValidConfig, getTasksForAI, processReply, lang]
  )

  // 选择 mood 后发起首次 AI 请求
  const handleMoodSelect = useCallback(
    async (selectedMood: Mood) => {
      setMood(selectedMood)
      setPhase('chatting')
      setLoading(true)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const msg = await fetchReply(selectedMood, [], controller.signal)
        if (msg) setMessages([msg])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const errorMsg = err instanceof Error ? err.message : t('error')
        setMessages([{ role: 'assistant', content: `⚠️ ${errorMsg}` }])
      } finally {
        setLoading(false)
      }
    },
    [fetchReply, t]
  )

  // 发送用户消息
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !mood || loading) return

      const userMsg: BuddyMessageType = { role: 'user', content: text.trim() }
      const newMessages = [...messages, userMsg]
      setMessages(newMessages)
      setInputValue('')
      setLoading(true)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const msg = await fetchReply(mood, newMessages, controller.signal)
        if (msg) setMessages([...newMessages, msg])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const errorMsg = err instanceof Error ? err.message : t('error')
        setMessages([
          ...newMessages,
          { role: 'assistant', content: `⚠️ ${errorMsg}` },
        ])
      } finally {
        setLoading(false)
      }
    },
    [mood, loading, messages, fetchReply, t]
  )

  // 执行操作建议，返回可选的 undo 函数
  const handleExecuteAction = useCallback(
    async (action: BuddyAction): Promise<(() => Promise<void>) | void> => {
      if (action.type === 'set_priority') {
        // 保存旧优先级
        const oldTask = (data.tasks as Task[]).find(
          (t) => t.id === action.taskId
        )
        const oldPriority = oldTask?.priority ?? 0

        const numericPriority = priorityToNumber[action.priority]
        await actions.updateTask(action.taskId, { priority: numericPriority })
        message.success(t('action.priorityUpdated'))

        // 返回 undo 函数
        return async () => {
          await actions.updateTask(action.taskId, { priority: oldPriority })
          message.success(t('action.priorityReverted'))
        }
      } else if (action.type === 'add_subtasks') {
        // 统一使用 createTask({ parentId }) 创建真正的子任务
        const task = (data.tasks as Task[]).find((t) => t.id === action.taskId)
        const createdTasks: Task[] = []
        for (const subtitle of action.subtitles) {
          const created = await actions.createTask({
            title: subtitle,
            projectId: task?.projectId,
            parentId: action.taskId,
          })
          createdTasks.push(created)
        }
        message.success(
          t('action.subtasksAdded', { count: action.subtitles.length })
        )

        // 返回 undo 函数：删除刚创建的子任务
        return async () => {
          for (const created of createdTasks) {
            await actions.deleteTask(created)
          }
          message.success(t('action.subtasksReverted'))
        }
      }
    },
    [actions, data.tasks, t]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(inputValue)
    }
  }

  return (
    <div
      className={`fixed bottom-16 right-4 z-50 w-[360px] max-sm:w-[calc(100vw-2rem)] h-[480px] max-h-[70vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg overflow-hidden ${!visible ? 'hidden' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {t('button')}
        </span>
        <div className="flex items-center gap-1">
          {phase === 'chatting' && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleReset}
              title={t('newChat')}
              className="!text-[var(--text-secondary)]"
            />
          )}
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
            className="!text-[var(--text-secondary)]"
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="!text-[var(--text-secondary)]"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {phase === 'no-config' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="text-sm text-[var(--text-secondary)] text-center">
              {t('configMissing')}
            </div>
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={onOpenSettings}
              className="!text-[var(--accent)]"
            >
              {t('settings.title')}
            </Button>
          </div>
        )}

        {phase === 'select-mood' && (
          <div className="flex items-center justify-center h-full">
            <MoodSelector onSelect={handleMoodSelect} />
          </div>
        )}

        {phase === 'chatting' && (
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <BuddyMessage
                key={`${i}-${msg.role}`}
                role={msg.role}
                content={msg.content}
                actions={msg.actions}
                onAction={handleExecuteAction}
              />
            ))}
            {loading && (
              <div className="flex items-center gap-2 py-2">
                <Spin size="small" />
                <span className="text-xs text-[var(--text-secondary)]">
                  {t('thinking')}
                </span>
              </div>
            )}
            {/* 首次建议后显示快捷引导（仅当首条消息无操作建议时） */}
            {!loading &&
              messages.length === 1 &&
              messages[0].role === 'assistant' &&
              !messages[0].actions?.length && (
                <Button
                  type="text"
                  size="small"
                  onClick={() => handleSend(t('suggestion.breakDown'))}
                  className="self-start !text-xs !px-3 !py-1.5 !rounded-full !border !border-[var(--border)] !text-[var(--text-secondary)] hover:!bg-[var(--bg-secondary)] hover:!text-[var(--text-primary)]"
                >
                  {t('suggestion.breakDown')}
                </Button>
              )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - only in chatting phase */}
      {phase === 'chatting' && (
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('input.placeholder')}
              disabled={loading}
              className="flex-1"
              size="small"
            />
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || loading}
              title={t('input.send')}
            />
          </div>
        </div>
      )}
    </div>
  )
}
