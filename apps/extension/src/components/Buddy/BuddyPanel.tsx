import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Input, Spin, message } from 'antd'
import {
  CloseOutlined,
  SettingOutlined,
  SendOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import { getSettings, subscribeSettings } from '@/services/settingsStorage'
import { sendBuddyRequest } from '@/services/aiService'
import type { Mood, BuddyMessage as BuddyMessageType } from '@/types/buddy'
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
  onClose: () => void
  onOpenSettings: () => void
  useFocusContext?: boolean
}

export function BuddyPanel({
  onClose,
  onOpenSettings,
  useFocusContext,
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

  // 获取当前任务数据
  const getTasksForAI = useCallback(() => {
    const allTasks = (data.tasks ?? []) as Task[]
    const focusTasks = useFocusContext ? (views.focusTasks as Task[]) : []
    return { focusTasks, allTasks }
  }, [data.tasks, views.focusTasks, useFocusContext])

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

  // 选择 mood 后发起首次 AI 请求
  const handleMoodSelect = useCallback(
    async (selectedMood: Mood) => {
      setMood(selectedMood)
      setPhase('chatting')
      setLoading(true)

      try {
        const config = await getValidConfig()
        if (!config) return

        const { focusTasks, allTasks } = getTasksForAI()
        const reply = await sendBuddyRequest(
          config,
          selectedMood,
          focusTasks,
          allTasks
        )
        setMessages([{ role: 'assistant', content: reply }])
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : t('error')
        setMessages([{ role: 'assistant', content: `⚠️ ${errorMsg}` }])
      } finally {
        setLoading(false)
      }
    },
    [getValidConfig, getTasksForAI, t]
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
          newMessages
        )
        setMessages([...newMessages, { role: 'assistant', content: reply }])
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
    [mood, loading, messages, getValidConfig, getTasksForAI, t]
  )

  // 添加任务
  const handleAddTask = useCallback(
    async (title: string) => {
      if (!title.trim()) return

      try {
        const settings = await getSettings()
        const projectId =
          settings.defaultProjectId &&
          !settings.defaultProjectId.startsWith('inbox')
            ? settings.defaultProjectId
            : undefined
        await actions.createTask({ title: title.trim(), projectId })
        setInputValue('')
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
    <div className="fixed bottom-16 right-4 z-50 w-[360px] h-[480px] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          🤖 {t('button')}
        </span>
        <div className="flex items-center gap-1">
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
