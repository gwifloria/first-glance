import { useState, type ReactNode } from 'react'
import { Popover, Button, Divider } from 'antd'
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
  github: 'https://github.com/gwifloria/first-glance',
  privacy: 'https://gwifloria.github.io/first-glance/privacy',
  buymeacoffee: 'https://buymeacoffee.com/gwifloria',
}

/** 链接项组件 */
function LinkItem({
  icon,
  label,
  href,
}: {
  icon: ReactNode
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors no-underline"
      style={{ color: 'var(--text-primary)' }}
    >
      <span className="text-[var(--text-secondary)]">{icon}</span>
      <span className="text-sm">{label}</span>
    </a>
  )
}

interface HelpPanelProps {
  className?: string
}

/**
 * 帮助与反馈面板
 * 包含：版本信息、反馈入口、更新日志、GitHub、隐私政策
 */
export function HelpPanel({ className }: HelpPanelProps) {
  const { t } = useTranslation('settings')
  const [open, setOpen] = useState(false)
  const version = chrome.runtime.getManifest().version

  const content = (
    <div className="w-56 py-1">
      {/* Header: App name + version */}
      <div className="px-3 py-2 text-center">
        <div className="font-bold text-[var(--text-primary)]">First Glance</div>
        <div className="text-xs text-[var(--text-secondary)]">v{version}</div>
      </div>

      <Divider className="!my-2" />

      {/* Links */}
      <div className="flex">
        <a
          href={LINKS.feedback}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors no-underline"
          style={{ color: 'var(--text-primary)' }}
        >
          <span className="text-[var(--text-secondary)]">
            <GithubOutlined />
          </span>
          <span className="text-sm">GitHub</span>
        </a>
        <a
          href={LINKS.community}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors no-underline"
          style={{ color: 'var(--text-primary)' }}
        >
          <span className="text-[var(--text-secondary)]">
            <SendOutlined />
          </span>
          <span className="text-sm">Telegram</span>
        </a>
      </div>
      <LinkItem
        icon={<FileTextOutlined />}
        label={t('help.changelog')}
        href={LINKS.changelog}
      />
      <LinkItem
        icon={<CoffeeOutlined />}
        label={t('help.buymeacoffee')}
        href={LINKS.buymeacoffee}
      />
      <LinkItem
        icon={<LockOutlined />}
        label={t('help.privacy')}
        href={LINKS.privacy}
      />

      <Divider className="!my-2" />

      {/* Footer */}
      <div className="px-3 py-1 text-xs text-center text-[var(--text-secondary)]">
        © First Glance
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
