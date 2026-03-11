import { useState, useEffect, useCallback } from 'react'
import { Input, Tag, Space, message, Button } from 'antd'
import { PlusOutlined, CoffeeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getSettings, setSettings } from '@/services/settingsStorage'
import { useChillMode } from '@/hooks'

const SUGGESTED_SITES = [
  'weibo.com',
  'douyin.com',
  'xiaohongshu.com',
  'bilibili.com',
  'zhihu.com',
  'x.com',
  'youtube.com',
  'reddit.com',
  'instagram.com',
]

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

export function BlocksiteSettings() {
  const { t } = useTranslation('settings')
  const [inputValue, setInputValue] = useState('')
  const [blockedSites, setBlockedSites] = useState<string[]>([])
  const {
    isActive: chillModeActive,
    remainingTime,
    endChillMode,
  } = useChillMode()

  // 加载已屏蔽网站列表
  useEffect(() => {
    getSettings().then((settings) => {
      setBlockedSites(settings.blockedSites || [])
    })
  }, [])

  const handleEndChillMode = useCallback(async () => {
    await endChillMode()
    message.success(t('blocksite.chillMode.ended'))
  }, [endChillMode, t])

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
      {chillModeActive && (
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
          className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-contrast)] rounded-r-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="!border-[var(--border)]"
            >
              {domain}
            </Tag>
          ))}
        </div>
      )}

      {blockedSites.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-4 space-y-3">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {t('blocksite.emptyDesc')}
          </p>
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              {t('blocksite.suggestions')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SITES.map((domain) => (
                <button
                  key={domain}
                  onClick={async () => {
                    if (blockedSites.includes(domain)) return
                    const next = [...blockedSites, domain]
                    await setSettings({ blockedSites: next })
                    setBlockedSites(next)
                  }}
                  className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
