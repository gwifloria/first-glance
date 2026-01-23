import { useState, type ReactNode } from 'react'
import { Popover, Button, Popconfirm, Divider } from 'antd'
import {
  SettingOutlined,
  StopOutlined,
  DisconnectOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppMode } from '@/contexts/useAppMode'
import { useConnectPrompt } from '@/contexts/useConnectPrompt'
import { BlocksiteModal } from '../BlocksiteModal'
import { ThemeToggle } from './ThemeToggle'

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
 * 包含：主题选择、屏蔽网站、连接/断开
 */
export function SettingsPanel({ className }: SettingsPanelProps) {
  const { t } = useTranslation('common')
  const { t: tSettings } = useTranslation('settings')
  const { isGuest, disconnect } = useAppMode()
  const { openConnectPrompt } = useConnectPrompt()
  const [blocksiteOpen, setBlocksiteOpen] = useState(false)
  const [open, setOpen] = useState(false)

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

      {/* 屏蔽网站 */}
      <MenuItem
        icon={<StopOutlined />}
        label={tSettings('blocksite.label')}
        onClick={() => {
          setOpen(false)
          setBlocksiteOpen(true)
        }}
      />

      {/* 游客模式：显示连接按钮 */}
      {isGuest && (
        <MenuItem
          icon={<LinkOutlined />}
          label={t('button.connect')}
          onClick={() => {
            setOpen(false)
            openConnectPrompt()
          }}
          accent
        />
      )}

      {/* 登录状态：显示断开连接 */}
      {!isGuest && (
        <Popconfirm
          title={t('disconnectConfirm.title')}
          description={t('disconnectConfirm.description')}
          onConfirm={() => {
            setOpen(false)
            disconnect()
          }}
          okText={t('button.confirm')}
          cancelText={t('button.cancel')}
        >
          <MenuItem
            icon={<DisconnectOutlined />}
            label={t('button.disconnect')}
          />
        </Popconfirm>
      )}
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

      <BlocksiteModal
        open={blocksiteOpen}
        onClose={() => setBlocksiteOpen(false)}
      />
    </>
  )
}
