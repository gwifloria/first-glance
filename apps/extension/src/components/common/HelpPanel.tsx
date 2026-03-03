import { useState } from 'react'
import { Popover, Button, Divider, Tooltip } from 'antd'
import {
  QuestionOutlined,
  SendOutlined,
  FileTextOutlined,
  GithubOutlined,
  LockOutlined,
  CoffeeOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const LINKS = {
  feedback: 'https://github.com/gwifloria/first-glance/issues',
  community: 'https://t.me/firstglance_community',
  changelog: 'https://gwifloria.github.io/first-glance/changelog',
  privacy: 'https://gwifloria.github.io/first-glance/privacy',
  buymeacoffee: 'https://buymeacoffee.com/gwifloria',
}

interface HelpPanelProps {
  className?: string
}

/**
 * 帮助与反馈面板
 * 包含：版本信息、外链图标（更新日志、赞助、隐私、GitHub、Telegram）
 */
export function HelpPanel({ className }: HelpPanelProps) {
  const { t } = useTranslation('settings')
  const [open, setOpen] = useState(false)
  const version = chrome.runtime.getManifest().version

  const links = [
    {
      icon: <FileTextOutlined />,
      href: LINKS.changelog,
      tip: t('help.changelog'),
    },
    { icon: <LockOutlined />, href: LINKS.privacy, tip: t('help.privacy') },
    { icon: <GithubOutlined />, href: LINKS.feedback, tip: 'GitHub' },
    { icon: <SendOutlined />, href: LINKS.community, tip: 'Telegram' },
  ]

  const content = (
    <div className="w-48 py-1">
      {/* Header */}
      <div className="px-3 py-2 text-center">
        <div className="font-bold text-[var(--text-primary)]">First Glance</div>
        <div className="text-xs text-[var(--text-secondary)]">v{version}</div>
      </div>

      <Divider className="!my-2" />

      {/* Buy me a coffee */}
      <a
        href={LINKS.buymeacoffee}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors no-underline"
        style={{ color: 'var(--text-secondary)' }}
      >
        <CoffeeOutlined />
        <span className="text-xs">{t('help.buymeacoffee')}</span>
      </a>

      <Divider className="!my-2" />

      {/* 工具图标 */}
      <div className="px-3 py-2 flex items-center justify-center gap-2">
        {links.map((item) => (
          <Tooltip title={item.tip} key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-secondary)] transition-colors hover:!text-[var(--text-primary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.icon}
            </a>
          </Tooltip>
        ))}
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      arrow={false}
      styles={{
        body: {
          padding: 0,
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border)',
        },
      }}
    >
      <Button
        type="text"
        size="small"
        icon={<QuestionOutlined />}
        className={`!text-[var(--text-secondary)] hover:!text-[var(--text-primary)] ${className}`}
      />
    </Popover>
  )
}
