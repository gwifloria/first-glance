/**
 * 番茄时钟控制按钮
 */
import { memo, useState } from 'react'
import { Button, Popover } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  ForwardOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { PomodoroMode } from '@/hooks/usePomodoro'

// 按钮样式常量
const BTN_PRIMARY = '!text-[var(--text-secondary)] hover:!text-[var(--accent)]'
const BTN_SECONDARY =
  '!text-[var(--text-secondary)] hover:!text-[var(--text-primary)]'

interface PomodoroControlsProps {
  mode: PomodoroMode
  isRunning: boolean
  completedCount: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onSkip: () => void
  focusLockActive: boolean
  onToggleFocusLock: () => void
}

export const PomodoroControls = memo(function PomodoroControls({
  mode,
  isRunning,
  completedCount,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
  focusLockActive,
  onToggleFocusLock,
}: PomodoroControlsProps) {
  const { t } = useTranslation('focus')
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handleLockClick = () => {
    if (focusLockActive) {
      onToggleFocusLock()
    } else {
      setPopoverOpen(true)
    }
  }

  const handleConfirm = () => {
    setPopoverOpen(false)
    onToggleFocusLock()
  }

  const lockPopoverContent = (
    <div className="w-52">
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
        {t('pomodoro.focusLockDesc')}
      </p>
      <div className="flex justify-end gap-2">
        <Button size="small" onClick={() => setPopoverOpen(false)}>
          {t('common:button.cancel')}
        </Button>
        <Button size="small" type="primary" onClick={handleConfirm}>
          {t('pomodoro.focusLockConfirm')}
        </Button>
      </div>
    </div>
  )

  const lockButton = (
    <Button
      type="text"
      size="large"
      icon={focusLockActive ? <LockOutlined /> : <UnlockOutlined />}
      onClick={handleLockClick}
      className={
        focusLockActive
          ? `${BTN_PRIMARY} !text-base`
          : `${BTN_SECONDARY} !text-base`
      }
    />
  )

  // 空闲模式：显示开始按钮 + Focus Lock 切换
  if (mode === 'idle') {
    return (
      <div className="mt-4 flex items-center gap-2">
        <Button
          type="text"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={onStart}
          className={`${BTN_PRIMARY} !text-base`}
        >
          {t('pomodoro.start')}
        </Button>
        <Popover
          content={lockPopoverContent}
          title={t('pomodoro.focusLock')}
          open={popoverOpen}
          onOpenChange={(open) => !open && setPopoverOpen(false)}
          trigger="click"
          placement="bottom"
        >
          {lockButton}
        </Popover>
      </div>
    )
  }

  // 工作/休息模式：显示控制按钮
  return (
    <div className="mt-4 flex items-center gap-4">
      {/* 暂停/继续 */}
      {isRunning ? (
        <Button
          type="text"
          size="large"
          icon={<PauseCircleOutlined />}
          onClick={onPause}
          className={BTN_PRIMARY}
        >
          {t('pomodoro.pause')}
        </Button>
      ) : (
        <Button
          type="text"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={onResume}
          className={BTN_PRIMARY}
        >
          {mode === 'break'
            ? t('pomodoro.startBreak')
            : t('pomodoro.startWork')}
        </Button>
      )}

      {/* 跳过 */}
      <Button
        type="text"
        size="small"
        icon={<ForwardOutlined />}
        onClick={onSkip}
        className={BTN_SECONDARY}
      >
        {t('pomodoro.skip')}
      </Button>

      {/* 重置 */}
      <Button
        type="text"
        size="small"
        icon={<RedoOutlined />}
        onClick={onReset}
        className={BTN_SECONDARY}
      >
        {t('pomodoro.reset')}
      </Button>

      {/* 完成计数 */}
      {completedCount > 0 && (
        <span className="text-sm text-[var(--text-secondary)]">
          🍅 × {completedCount}
        </span>
      )}

      {/* Focus Lock 状态指示 */}
      {focusLockActive && (
        <LockOutlined className="text-[var(--text-secondary)] opacity-40" />
      )}
    </div>
  )
})
