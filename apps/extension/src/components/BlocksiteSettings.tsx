import { useState, useEffect, useCallback, useMemo } from 'react'
import { Input, Tag, Space, message, Button } from 'antd'
import { PlusOutlined, CoffeeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getSettings, setSettings } from '@/services/settingsStorage'

interface ChillModeState {
  active: boolean
  expiresAt: number
}

/**
 * 域名格式校验
 * 支持：example.com, sub.example.com, *.example.com
 */
function isValidDomain(domain: string): boolean {
  const pattern =
    /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  return pattern.test(domain)
}

/**
 * 标准化域名（移除协议和路径）
 */
function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase()
  // 移除协议
  domain = domain.replace(/^https?:\/\//, '')
  // 移除路径和查询参数
  domain = domain.split('/')[0]
  // 移除 www. 前缀（可选）
  domain = domain.replace(/^www\./, '')
  return domain
}

/**
 * 格式化剩余时间
 */
function formatRemainingTime(expiresAt: number): string {
  const remaining = Math.max(0, expiresAt - Date.now())
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function BlocksiteSettings() {
  const { t } = useTranslation('settings')
  const [inputValue, setInputValue] = useState('')
  const [blockedSites, setBlockedSites] = useState<string[]>([])
  const [chillMode, setChillMode] = useState<ChillModeState | null>(null)
  const [tick, setTick] = useState(0)

  // 加载已屏蔽网站列表
  useEffect(() => {
    getSettings().then((settings) => {
      setBlockedSites(settings.blockedSites || [])
    })
  }, [])

  // 监听 chill mode 状态
  useEffect(() => {
    // 初始加载
    chrome.storage.local.get('chill_mode').then((result) => {
      const state = result.chill_mode as ChillModeState | undefined
      if (state?.active && Date.now() < state.expiresAt) {
        setChillMode(state)
      } else {
        setChillMode(null)
      }
    })

    // 监听变化
    const handleChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes.chill_mode) {
        const state = changes.chill_mode.newValue as ChillModeState | undefined
        if (state?.active && Date.now() < state.expiresAt) {
          setChillMode(state)
        } else {
          setChillMode(null)
        }
      }
    }

    chrome.storage.onChanged.addListener(handleChange)
    return () => chrome.storage.onChanged.removeListener(handleChange)
  }, [])

  // Tick every second to update countdown display
  useEffect(() => {
    if (!chillMode) return

    const interval = setInterval(() => {
      if (Date.now() >= chillMode.expiresAt) {
        setChillMode(null)
      } else {
        setTick((t) => t + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [chillMode])

  // Derive remaining time from chillMode (tick forces recalculation)
  const remainingTime = useMemo(() => {
    void tick // Use tick to trigger recalculation
    if (!chillMode) return ''
    return formatRemainingTime(chillMode.expiresAt)
  }, [chillMode, tick])

  const handleEndChillMode = useCallback(async () => {
    await chrome.storage.local.remove('chill_mode')
    setChillMode(null)
    message.success(t('blocksite.chillMode.ended'))
  }, [t])

  const handleAdd = useCallback(async () => {
    const domain = normalizeDomain(inputValue)

    if (!domain) {
      return
    }

    if (!isValidDomain(domain)) {
      message.error(t('blocksite.invalidDomain'))
      return
    }

    if (blockedSites.includes(domain)) {
      message.warning(t('blocksite.duplicateDomain'))
      setInputValue('')
      return
    }

    const newBlockedSites = [...blockedSites, domain]
    await setSettings({ blockedSites: newBlockedSites })
    setBlockedSites(newBlockedSites)
    setInputValue('')
  }, [inputValue, blockedSites, t])

  const handleRemove = useCallback(
    async (domain: string) => {
      const newBlockedSites = blockedSites.filter((d) => d !== domain)
      await setSettings({ blockedSites: newBlockedSites })
      setBlockedSites(newBlockedSites)
    },
    [blockedSites]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div className="space-y-3">
      {/* Chill Mode 状态提示 */}
      {chillMode && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <CoffeeOutlined />
            <span className="text-sm">
              {t('blocksite.chillMode.active', { time: remainingTime })}
            </span>
          </div>
          <Button size="small" danger onClick={handleEndChillMode}>
            {t('blocksite.chillMode.endNow')}
          </Button>
        </div>
      )}

      <Space.Compact className="w-full">
        <Input
          placeholder={t('blocksite.placeholder')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-3 py-1 bg-[var(--accent)] text-white rounded-r-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusOutlined />
        </button>
      </Space.Compact>

      {blockedSites.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {blockedSites.map((domain) => (
            <Tag
              key={domain}
              closable
              onClose={() => handleRemove(domain)}
              className="!bg-[var(--bg-secondary)] !border-[var(--border)] !text-[var(--text-primary)]"
            >
              {domain}
            </Tag>
          ))}
        </div>
      )}

      {blockedSites.length === 0 && (
        <p className="text-xs text-[var(--text-secondary)]">
          {t('blocksite.empty')}
        </p>
      )}
    </div>
  )
}
