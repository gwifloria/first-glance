import { useState, useEffect, type ReactNode } from 'react'
import {
  Popover,
  Button,
  Divider,
  Modal,
  Tooltip,
  Switch,
  Segmented,
} from 'antd'
import {
  SettingOutlined,
  StopOutlined,
  LinkOutlined,
  DisconnectOutlined,
  GithubOutlined,
  SendOutlined,
  LockOutlined,
  CoffeeOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  CrownOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  shouldShowOnboarding,
  completeOnboarding,
  shouldShowBlocksiteHint,
  completeBlocksiteOnboarding,
} from '@/utils/onboarding'
import { useAppMode } from '@/contexts/useAppMode'
import { useConnectPrompt } from '@/contexts/useConnectPrompt'
import { usePremium } from '@/hooks/usePremium'
import {
  getDevPremiumOverride,
  isDevBuild,
  setDevPremiumOverride,
} from '@/services/premium'
import {
  getSettings,
  setSettings,
  subscribeSettings,
} from '@/services/settingsStorage'
import { BlocksiteModal } from '../Blocksite/BlocksiteModal'
import { PomodoroSettingsModal } from '../FocusView/PomodoroSettingsModal'
import { ThemeToggle } from './ThemeToggle'
import { SectionLabel } from './SectionLabel'
import { FontSelectorModal } from '../FontSelectorModal'
import { useFont } from '@/hooks/useFont'
import { getFontOption } from '@/constants/fonts'

const HELP_LINKS = {
  website: 'https://www.gwifloria.space/',
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
  badge,
}: {
  icon: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  accent?: boolean
  badge?: boolean
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
      <span className="text-sm flex-1">{label}</span>
      {badge && (
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[var(--accent)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
        </span>
      )}
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
  const { t: tPremium } = useTranslation('premium')
  const { t: tOnboarding } = useTranslation('onboarding')
  const { isGuest, disconnect } = useAppMode()
  const { isPremium, openPremiumModal } = usePremium()
  const { openConnectPrompt } = useConnectPrompt()
  const [blocksiteOpen, setBlocksiteOpen] = useState(false)
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false)
  const [fontSelectorOpen, setFontSelectorOpen] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [blocksiteNotSeen, setBlocksiteNotSeen] = useState(false)
  const [devPremium, setDevPremium] = useState(() => getDevPremiumOverride())
  const [defaultView, setDefaultViewState] = useState<'focus' | 'list'>('focus')
  const { fontType, fontScale } = useFont()
  const currentFont = getFontOption(fontType)
  const currentScaleLabel = tPremium(`fontSize.${fontScale}`)

  useEffect(() => {
    shouldShowOnboarding().then((should) => setIsOnboarding(should))
    shouldShowBlocksiteHint().then((should) => setBlocksiteNotSeen(should))
  }, [])

  useEffect(() => {
    getSettings().then((s) => setDefaultViewState(s.defaultView))
    return subscribeSettings((s) => setDefaultViewState(s.defaultView))
  }, [])

  const handleDefaultViewChange = (value: 'focus' | 'list') => {
    setDefaultViewState(value)
    setSettings({ defaultView: value })
  }

  // dev override 在 premium.ts 模块加载时异步 hydrate，
  // 首屏渲染可能拿到默认值，所以挂载后直接读一次 storage 兜底
  useEffect(() => {
    if (!isDevBuild()) return
    chrome.storage.local.get('dev_premium_override').then((r) => {
      const v = r['dev_premium_override']
      if (typeof v === 'boolean') setDevPremium(v)
    })
  }, [])

  const version = chrome.runtime.getManifest().version

  const handleBlocksiteOpen = () => {
    setOpen(false)
    setBlocksiteOpen(true)
    if (blocksiteNotSeen) {
      completeBlocksiteOnboarding()
      setBlocksiteNotSeen(false)
    }
  }

  const content = (
    <div className="w-64 py-1">
      {/* 主题选择 */}
      <div className="px-3 py-2">
        <SectionLabel className="mb-2">Appearance</SectionLabel>
        <ThemeToggle size="lg" />
        {isOnboarding && (
          <p className="text-xs text-[var(--accent)] mt-2 leading-relaxed">
            {tOnboarding('welcome.hint')}
          </p>
        )}
      </div>

      {/* 默认视图（游客无 List 视图，故仅连接后显示） */}
      {!isGuest && (
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <SectionLabel>{tSettings('defaultView.label')}</SectionLabel>
          <Segmented<'focus' | 'list'>
            size="small"
            value={defaultView}
            onChange={handleDefaultViewChange}
            options={[
              { label: tSettings('defaultView.focus'), value: 'focus' },
              { label: tSettings('defaultView.list'), value: 'list' },
            ]}
          />
        </div>
      )}

      {/* 字体选择 → 打开 FontSelectorModal */}
      <button
        type="button"
        onClick={() => {
          setOpen(false)
          setFontSelectorOpen(true)
        }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-0 bg-transparent text-left"
      >
        <div className="flex flex-col items-start">
          <SectionLabel>{tPremium('fontLabel')}</SectionLabel>
          <span className="text-sm text-[var(--text-primary)]">
            {currentFont.name} · {currentScaleLabel}
          </span>
        </div>
        <span className="text-xs text-[var(--text-secondary)]">›</span>
      </button>

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
        onClick={handleBlocksiteOpen}
        badge={blocksiteNotSeen}
      />

      {/* 番茄钟设置 */}
      <MenuItem
        icon={<ClockCircleOutlined />}
        label={tSettings('pomodoro.label')}
        onClick={() => {
          setOpen(false)
          setSoundSettingsOpen(true)
        }}
      />

      {/* Premium */}
      <MenuItem
        icon={
          <CrownOutlined
            style={
              isPremium ? { color: 'var(--color-premium-gold)' } : undefined
            }
          />
        }
        label={isPremium ? tPremium('activated') : tPremium('title')}
        accent={!isPremium}
        onClick={() => {
          setOpen(false)
          openPremiumModal()
        }}
      />

      {/* Dev-only：本地切换 Premium，方便测试付费/非付费 UI。生产 build 下整块被 tree-shaken */}
      {isDevBuild() && (
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)]/40">
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            DEV · Premium override
          </span>
          <Switch
            size="small"
            checked={devPremium}
            onChange={(checked) => {
              setDevPremium(checked)
              setDevPremiumOverride(checked)
            }}
          />
        </div>
      )}

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
              icon: <GlobalOutlined />,
              href: HELP_LINKS.website,
              tip: 'gwifloria.space',
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

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen && isOnboarding) {
      completeOnboarding()
      setIsOnboarding(false)
      setBlocksiteNotSeen(true)
    }
  }

  return (
    <>
      <div className="relative">
        {isOnboarding && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 z-10 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
          </span>
        )}
        <Popover
          content={content}
          trigger="click"
          placement="bottomRight"
          open={open}
          onOpenChange={handleOpenChange}
          arrow={false}
          styles={{
            content: {
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
      </div>

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

      <PomodoroSettingsModal
        open={soundSettingsOpen}
        onClose={() => setSoundSettingsOpen(false)}
      />

      <FontSelectorModal
        open={fontSelectorOpen}
        onClose={() => setFontSelectorOpen(false)}
      />
    </>
  )
}
