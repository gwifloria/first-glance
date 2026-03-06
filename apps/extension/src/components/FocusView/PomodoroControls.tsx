/**
 * 番茄时钟控制按钮
 */
import { memo } from 'react'
import { Button } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  ForwardOutlined,
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
}: PomodoroControlsProps) {
  const { t } = useTranslation('focus')

  // 空闲模式：显示开始按钮
  if (mode === 'idle') {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="text"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={onStart}
          className={`${BTN_PRIMARY} !text-base`}
        >
          {t('pomodoro.start')}
        </Button>
      </div>
    )
  }

  // 工作/休息模式：显示控制按钮
  return (
    <div className="mt-2 flex items-center gap-4">
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
    </div>
  )
})
