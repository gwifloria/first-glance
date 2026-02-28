import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Input, Spin, message } from 'antd'
import {
  CloseOutlined,
  SettingOutlined,
  SendOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import { getSettings, subscribeSettings } from '@/services/settingsStorage'
import { sendBuddyRequest } from '@/services/aiService'
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

const MOOD_OPTIONS: { key: Mood; emoji: string; labelKey: string }[] = [
  { key: 'good', emoji: '😊', labelKey: 'mood.good' },
  { key: 'okay', emoji: '😐', labelKey: 'mood.okay' },
  { key: 'low', emoji: '😔', labelKey: 'mood.low' },
]

function MoodSelector({ onSelect }: { onSelect: (mood: Mood) => void }) {
  const { t } = useTranslation('buddy')

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {t('mood.title')}
      </div>
      <div className="flex gap-2">
        {MOOD_OPTIONS.map(({ key, emoji, labelKey }) => (
          <Button
            key={key}
            type="text"
            onClick={() => onSelect(key)}
            className="!flex !flex-col !items-center !gap-1 !h-auto !py-2 !px-3 !rounded-xl hover:!bg-[var(--bg-secondary)]"
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {t(labelKey)}
            </span>
          </Button>
        ))}
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
  const { t } = useTranslation('buddy')
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

  // 首次挂载检查 AI 配置
  useEffect(() => {
    getSettings().then((settings) => {
      const config = settings.aiConfig
      const hasConfig = !!(config?.baseUrl && config?.apiKey && config?.model)
      setPhase(hasConfig ? 'select-mood' : 'no-config')
    })
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

  // 选择 mood 后发起首次 AI 请求
  const handleMoodSelect = useCallback(
    async (selectedMood: Mood) => {
      setMood(selectedMood)
      setPhase('chatting')
      setLoading(true)

      abortRef.current?.abort()
      abortRef.current = new AbortController()

      try {
        const config = await getValidConfig()
        if (!config) return

        const { focusTasks, allTasks } = getTasksForAI()
        const reply = await sendBuddyRequest(
          config,
          selectedMood,
          focusTasks,
          allTasks,
          [],
          abortRef.current.signal
        )
        setMessages([processReply(reply)])
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : t('error')
        setMessages([{ role: 'assistant', content: `⚠️ ${errorMsg}` }])
      } finally {
        setLoading(false)
      }
    },
    [getValidConfig, getTasksForAI, processReply, t]
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
      abortRef.current = new AbortController()

      try {
        const config = await getValidConfig()
        if (!config) return

        const { focusTasks, allTasks } = getTasksForAI()
        const reply = await sendBuddyRequest(
          config,
          mood,
          focusTasks,
          allTasks,
          newMessages,
          abortRef.current!.signal
        )
        setMessages([...newMessages, processReply(reply)])
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
    [mood, loading, messages, getValidConfig, getTasksForAI, processReply, t]
  )

  // 执行操作建议
  const handleExecuteAction = useCallback(
    async (action: BuddyAction) => {
      if (action.type === 'set_priority') {
        const numericPriority = priorityToNumber[action.priority]
        await actions.updateTask(action.taskId, { priority: numericPriority })
        message.success(t('action.priorityUpdated'))
      } else if (action.type === 'add_subtasks') {
        // 统一使用 createTask({ parentId }) 创建真正的子任务
        const task = (data.tasks as Task[]).find((t) => t.id === action.taskId)
        for (const subtitle of action.subtitles) {
          await actions.createTask({
            title: subtitle,
            projectId: task?.projectId,
            parentId: action.taskId,
          })
        }
        message.success(
          t('action.subtasksAdded', { count: action.subtitles.length })
        )
      }
    },
    [actions, data.tasks, t]
  )

  // 添加任务
  const handleAddTask = useCallback(
    async (title: string) => {
      if (!title.trim()) return
      setInputValue('')

      try {
        const settings = await getSettings()
        const projectId =
          settings.defaultProjectId &&
          !settings.defaultProjectId.startsWith('inbox')
            ? settings.defaultProjectId
            : undefined
        await actions.createTask({ title: title.trim(), projectId })
        message.success(t('taskAdded'))
      } catch {
        message.error(t('error'))
      }
    },
    [actions, t]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(inputValue)
    }
  }

  return (
    <div
      className={`fixed bottom-16 right-4 z-50 w-[360px] h-[480px] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg overflow-hidden ${!visible ? 'hidden' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          🤖 {t('button')}
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
            {/* 首次建议后显示快捷引导 */}
            {!loading &&
              messages.length === 1 &&
              messages[0].role === 'assistant' && (
                <button
                  onClick={() => handleSend(t('suggestion.breakDown'))}
                  className="self-start text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t('suggestion.breakDown')}
                </button>
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
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAddTask(inputValue)}
              disabled={!inputValue.trim() || loading}
              title={t('input.addTask')}
              className="!text-[var(--text-secondary)]"
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
