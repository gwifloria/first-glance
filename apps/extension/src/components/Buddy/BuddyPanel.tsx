import { useState, useCallback } from 'react'
import { Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import { getSettings } from '@/services/settingsStorage'
import { sendBuddyRequest } from '@/services/aiService'
import type { Mood } from '@/types/buddy'
import type { Task } from '@/types'
import { MoodSelector } from './MoodSelector'
import { BuddyMessage } from './BuddyMessage'

type PanelState = 'no-config' | 'select-mood' | 'loading' | 'result' | 'error'

interface BuddyPanelProps {
  onOpenSettings: () => void
}

export function BuddyPanel({ onOpenSettings }: BuddyPanelProps) {
  const { t } = useTranslation('buddy')
  const { data } = useTaskContext()

  const [state, setState] = useState<PanelState>('select-mood')
  const [reply, setReply] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastMood, setLastMood] = useState<Mood | null>(null)
  const [configChecked, setConfigChecked] = useState(false)

  // 检查 AI 配置
  const checkConfig = useCallback(async () => {
    const settings = await getSettings()
    const config = settings.aiConfig
    const hasConfig = !!(config?.baseUrl && config?.apiKey && config?.model)
    if (!hasConfig) {
      setState('no-config')
    } else {
      setState('select-mood')
    }
    setConfigChecked(true)
    return hasConfig ? config : null
  }, [])

  // 首次渲染时检查配置
  if (!configChecked) {
    checkConfig()
  }

  const handleMoodSelect = useCallback(
    async (mood: Mood) => {
      setLastMood(mood)
      setState('loading')
      setReply(null)
      setError(null)

      try {
        const settings = await getSettings()
        const config = settings.aiConfig
        if (!config?.baseUrl || !config?.apiKey || !config?.model) {
          setState('no-config')
          return
        }

        const tasks = (data.tasks ?? []) as Task[]
        const result = await sendBuddyRequest(config, mood, tasks)
        setReply(result)
        setState('result')
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error'))
        setState('error')
      }
    },
    [data.tasks, t]
  )

  const handleRetry = useCallback(() => {
    if (lastMood) {
      handleMoodSelect(lastMood)
    }
  }, [lastMood, handleMoodSelect])

  const handleReset = useCallback(() => {
    setState('select-mood')
    setReply(null)
    setError(null)
    setLastMood(null)
  }, [])

  return (
    <div className="w-80 py-3 px-4 flex flex-col gap-3">
      {state === 'no-config' && (
        <div className="flex flex-col items-center gap-3 py-2">
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

      {state === 'select-mood' && <MoodSelector onSelect={handleMoodSelect} />}

      {state === 'loading' && (
        <BuddyMessage content={null} loading={true} error={null} />
      )}

      {state === 'result' && (
        <div className="flex flex-col gap-3">
          <BuddyMessage content={reply} loading={false} error={null} />
          <Button
            type="text"
            size="small"
            onClick={handleReset}
            className="!text-[var(--text-secondary)] self-center"
          >
            {t('reset')}
          </Button>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col gap-3">
          <BuddyMessage content={null} loading={false} error={error} />
          <div className="flex justify-center gap-2">
            <Button type="text" size="small" onClick={handleRetry}>
              {t('retry')}
            </Button>
            <Button type="text" size="small" onClick={handleReset}>
              {t('reset')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
