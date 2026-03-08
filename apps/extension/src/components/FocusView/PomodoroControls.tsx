/**
 * 番茄时钟控制按钮
 */
import { memo } from 'react'
import { Button, Popconfirm } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ForwardOutlined,
  PoweroffOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { PomodoroMode } from '@/hooks/usePomodoro'
import { TodayTomatoCount } from './TodayTomatoCount'

// 按钮样式常量
const BTN_PRIMARY = '!text-[var(--text-secondary)] hover:!text-[var(--accent)]'
const BTN_SECONDARY =
  '!text-[var(--text-secondary)] hover:!text-[var(--text-primary)]'

interface PomodoroControlsProps {
  mode: PomodoroMode
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onSkip: () => void
}

export const PomodoroControls = memo(function PomodoroControls({
  mode,
  isRunning,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: PomodoroControlsProps) {
  const { t } = useTranslation('focus')

  return (
    <div className="mt-2 flex items-center gap-4">
      {mode === 'idle' ? (
        <Button
          type="text"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={onStart}
          className={`${BTN_PRIMARY} !text-base`}
        >
          {t('pomodoro.start')}
        </Button>
      ) : (
        <>
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
          <Popconfirm
            title={t('pomodoro.skipConfirm')}
            onConfirm={onSkip}
            okText={t('pomodoro.confirmYes')}
            cancelText={t('pomodoro.confirmNo')}
          >
            <Button
              type="text"
              size="small"
              icon={<ForwardOutlined />}
              className={BTN_SECONDARY}
            >
              {t('pomodoro.skip')}
            </Button>
          </Popconfirm>

          {/* 结束 */}
          <Popconfirm
            title={t('pomodoro.finishConfirm')}
            onConfirm={onReset}
            okText={t('pomodoro.confirmYes')}
            cancelText={t('pomodoro.confirmNo')}
          >
            <Button
              type="text"
              size="small"
              icon={<PoweroffOutlined />}
              className={BTN_SECONDARY}
            >
              {t('pomodoro.finish')}
            </Button>
          </Popconfirm>
        </>
      )}

      <TodayTomatoCount />
    </div>
  )
})
