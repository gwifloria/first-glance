import { useState, type ReactNode } from 'react'
import { Popover, Button, Divider, Modal } from 'antd'
import {
  SettingOutlined,
  StopOutlined,
  LinkOutlined,
  DisconnectOutlined,
  MessageOutlined,
  FileTextOutlined,
  LockOutlined,
  CoffeeOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppMode } from '@/contexts/useAppMode'
import { useConnectPrompt } from '@/contexts/useConnectPrompt'
import { BlocksiteModal } from '../Blocksite/BlocksiteModal'
import { ThemeToggle } from './ThemeToggle'

const HELP_LINKS = {
  feedback: 'https://github.com/gwifloria/first-glance/issues',
  changelog: 'https://gwifloria.github.io/first-glance/changelog',
  buymeacoffee: 'https://buymeacoffee.com/gwifloria',
  privacy: 'https://gwifloria.github.io/first-glance/privacy',
}

/** 菜单项组件 */
function MenuItem({
  icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-left
        hover:bg-[var(--bg-secondary)] transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}
      `}
    >
      <span className={accent ? '' : 'text-[var(--text-secondary)]'}>
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

/** 外链项组件 */
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

interface SettingsPanelProps {
  className?: string
}

/**
 * 统一设置面板
 * 包含：主题选择、连接/断开、屏蔽网站、Buddy 设置、帮助链接、版本号
 */
export function SettingsPanel({ className }: SettingsPanelProps) {
  const { t: tSettings } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const { isGuest, disconnect } = useAppMode()
  const { openConnectPrompt } = useConnectPrompt()
  const [blocksiteOpen, setBlocksiteOpen] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [open, setOpen] = useState(false)

  const version = chrome.runtime.getManifest().version

  const content = (
    <div className="w-64 py-1">
      {/* 主题选择 */}
      <div className="px-3 py-2">
        <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Appearance
        </div>
        <ThemeToggle size="lg" />
      </div>

      <Divider className="!my-2" />

      {/* 连接/断开 */}
      {isGuest ? (
        <MenuItem
          icon={<LinkOutlined />}
          label="Connect"
          accent
          onClick={() => {
            setOpen(false)
            openConnectPrompt()
          }}
        />
      ) : (
        <MenuItem
          icon={<DisconnectOutlined />}
          label={tCommon('button.disconnect')}
          onClick={() => {
            setOpen(false)
            setDisconnectOpen(true)
          }}
        />
      )}

      {/* 屏蔽网站 */}
      <MenuItem
        icon={<StopOutlined />}
        label={tSettings('blocksite.label')}
        onClick={() => {
          setOpen(false)
          setBlocksiteOpen(true)
        }}
      />

      <Divider className="!my-2" />

      {/* 帮助链接 */}
      <LinkItem
        icon={<MessageOutlined />}
        label={tSettings('help.feedback')}
        href={HELP_LINKS.feedback}
      />
      <LinkItem
        icon={<FileTextOutlined />}
        label={tSettings('help.changelog')}
        href={HELP_LINKS.changelog}
      />
      <LinkItem
        icon={<CoffeeOutlined />}
        label={tSettings('help.buymeacoffee')}
        href={HELP_LINKS.buymeacoffee}
      />
      <LinkItem
        icon={<LockOutlined />}
        label={tSettings('help.privacy')}
        href={HELP_LINKS.privacy}
      />

      <Divider className="!my-2" />

      {/* 版本号 */}
      <div className="px-3 py-1 text-xs text-center text-[var(--text-secondary)]">
        First Glance v{version}
      </div>
    </div>
  )

  return (
    <>
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
          icon={<SettingOutlined />}
          className={`!text-[var(--text-secondary)] hover:!text-[var(--text-primary)] ${className}`}
        />
      </Popover>

      <Modal
        title={tCommon('disconnectConfirm.title')}
        open={disconnectOpen}
        onOk={() => {
          setDisconnectOpen(false)
          disconnect()
        }}
        onCancel={() => setDisconnectOpen(false)}
        okText={tCommon('button.confirm')}
        cancelText={tCommon('button.cancel')}
      >
        {tCommon('disconnectConfirm.description')}
      </Modal>

      <BlocksiteModal
        open={blocksiteOpen}
        onClose={() => setBlocksiteOpen(false)}
      />
    </>
  )
}
