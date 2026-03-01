import { useState, useEffect } from 'react'
import { Modal, Input, Button, message } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getSettings, setSettings } from '@/services/settingsStorage'
import { testAIConfig } from '@/services/aiService'
import type { AIConfig } from '@/types/buddy'

const PRESETS = [
  {
    label: 'ChatGPT',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  {
    label: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
  },
  {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
] as const

interface BuddySettingsModalProps {
  open: boolean
  onClose: () => void
}

export function BuddySettingsModal({ open, onClose }: BuddySettingsModalProps) {
  const { t } = useTranslation('buddy')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testPassed, setTestPassed] = useState(false)

  // 打开时加载当前配置
  useEffect(() => {
    if (open) {
      getSettings().then((settings) => {
        const config = settings.aiConfig
        setBaseUrl(config?.baseUrl ?? '')
        setApiKey(config?.apiKey ?? '')
        setModel(config?.model ?? '')
      })
      setTestPassed(false)
    }
  }, [open])

  // 输入变化时重置测试状态
  useEffect(() => {
    setTestPassed(false)
  }, [baseUrl, apiKey, model])

  const isComplete = !!(baseUrl.trim() && apiKey.trim() && model.trim())

  const handleTest = async () => {
    if (!isComplete) return
    setTesting(true)
    setTestPassed(false)
    try {
      await testAIConfig({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
      })
      setTestPassed(true)
      message.success(t('settings.testSuccess'))
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error'
      message.error(t('settings.testFail', { reason }))
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const aiConfig: AIConfig | undefined = isComplete
        ? {
            baseUrl: baseUrl.trim(),
            apiKey: apiKey.trim(),
            model: model.trim(),
          }
        : undefined

      await setSettings({ aiConfig })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={t('settings.title')}
      open={open}
      onCancel={onClose}
      footer={
        <div className="flex justify-between">
          <Button
            onClick={handleTest}
            loading={testing}
            disabled={!isComplete}
            icon={
              testPassed ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : undefined
            }
          >
            {testing ? t('settings.testing') : t('settings.test')}
          </Button>
          <Button type="primary" onClick={handleSave} loading={saving}>
            OK
          </Button>
        </div>
      }
      width="90vw"
      style={{ maxWidth: 400 }}
    >
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              type={baseUrl === preset.baseUrl ? 'primary' : 'default'}
              ghost={baseUrl === preset.baseUrl}
              onClick={() => {
                setBaseUrl(preset.baseUrl)
                setModel(preset.model)
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">
            {t('settings.baseUrl')}
          </label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={t('settings.baseUrlPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">
            {t('settings.apiKey')}
          </label>
          <Input.Password
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t('settings.apiKeyPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">
            {t('settings.model')}
          </label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t('settings.modelPlaceholder')}
          />
        </div>
      </div>
    </Modal>
  )
}
