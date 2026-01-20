import { useState, useEffect, useCallback } from 'react'
import { Input, Tag, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getSettings, setSettings } from '@/services/settingsStorage'

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

  // 加载已屏蔽网站列表
  useEffect(() => {
    getSettings().then((settings) => {
      setBlockedSites(settings.blockedSites || [])
    })
  }, [])

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div className="space-y-3">
      <Space.Compact className="w-full">
        <Input
          placeholder={t('blocksite.placeholder')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
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
