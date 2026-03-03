import { useState, type ReactNode } from 'react'
import { Popover, Button, Divider, Modal, Tooltip } from 'antd'
import {
  SettingOutlined,
  StopOutlined,
  LinkOutlined,
  DisconnectOutlined,
  GithubOutlined,
  SendOutlined,
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
  community: 'https://t.me/firstglance_community',
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

      {/* Buy me a coffee */}
      <a
        href={HELP_LINKS.buymeacoffee}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors no-underline"
        style={{ color: 'var(--text-secondary)' }}
      >
        <CoffeeOutlined />
        <span className="text-xs">{tSettings('help.buymeacoffee')}</span>
      </a>

      <Divider className="!my-2" />

      {/* 底部：版本号 + 工具图标 */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">
          First Glance v{version}
        </span>
        <div className="flex items-center gap-1">
          {[
            {
              icon: <FileTextOutlined />,
              href: HELP_LINKS.changelog,
              tip: tSettings('help.changelog'),
            },
            {
              icon: <LockOutlined />,
              href: HELP_LINKS.privacy,
              tip: tSettings('help.privacy'),
            },
            {
              icon: <GithubOutlined />,
              href: HELP_LINKS.feedback,
              tip: 'GitHub',
            },
            {
              icon: <SendOutlined />,
              href: HELP_LINKS.community,
              tip: 'Telegram',
            },
          ].map((item) => (
            <Tooltip title={item.tip} key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--bg-secondary)] transition-colors hover:!text-[var(--text-primary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.icon}
              </a>
            </Tooltip>
          ))}
        </div>
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
