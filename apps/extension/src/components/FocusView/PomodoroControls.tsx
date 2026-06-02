/**
 * 番茄时钟控制按钮
 */
import { memo } from 'react'
import { Button } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ForwardOutlined,
  PoweroffOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { PomodoroMode } from '@/hooks/usePomodoro'
import { TodayTomatoCount } from './TodayTomatoCount'
import { TomatoIcon } from './TomatoIcon'
import { LongPressButton } from '../common/LongPressButton'

// 按钮样式常量
const BTN_PRIMARY = '!text-[var(--text-secondary)] hover:!text-[var(--accent)]'
const BTN_SECONDARY =
  '!text-[var(--text-secondary)] hover:!text-[var(--text-primary)]'
// 运行态三个控件（暂停/继续 用 antd Button，跳过/结束 用 LongPressButton）需对齐：
// 把 antd Button 的字号/字重/内边距压到与 LongPressButton（px-2 text-sm 常规字重）一致，
// 否则 antd 默认的 large 字号 + 字重 500 + paddingInline 16 会让 Pause 偏粗偏大、间距不均
const BTN_RUN_NORMALIZE = '!px-2 !text-sm !font-normal'

interface PomodoroControlsProps {
  mode: PomodoroMode
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onSkip: () => void
  onOpenStats?: () => void
}

export const PomodoroControls = memo(function PomodoroControls({
  mode,
  isRunning,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
  onOpenStats,
}: PomodoroControlsProps) {
  const { t } = useTranslation('focus')

  return (
    <div className="mt-2 flex items-center gap-4">
      {mode === 'idle' ? (
        <Button
          type="text"
          size="large"
          icon={<TomatoIcon size={18} />}
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
              className={`${BTN_PRIMARY} ${BTN_RUN_NORMALIZE}`}
            >
              {t('pomodoro.pause')}
            </Button>
          ) : (
            <Button
              type="text"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={onResume}
              className={`${BTN_PRIMARY} ${BTN_RUN_NORMALIZE}`}
            >
              {mode === 'break'
                ? t('pomodoro.startBreak')
                : t('pomodoro.startWork')}
            </Button>
          )}

          {/* 跳过（长按确认） */}
          <LongPressButton
            onConfirm={onSkip}
            icon={<ForwardOutlined />}
            label={t('pomodoro.skip')}
            className={BTN_SECONDARY}
          />

          {/* 结束：work 阶段长按防误触中断专注；break 阶段番茄已跑完，
              退出去挑下个任务是低风险动作，改单击即可，不必长按添堵 */}
          {mode === 'break' ? (
            <Button
              type="text"
              size="large"
              icon={<PoweroffOutlined />}
              onClick={onReset}
              className={`${BTN_SECONDARY} ${BTN_RUN_NORMALIZE}`}
            >
              {t('pomodoro.finish')}
            </Button>
          ) : (
            <LongPressButton
              onConfirm={onReset}
              icon={<PoweroffOutlined />}
              label={t('pomodoro.finish')}
              className={BTN_SECONDARY}
            />
          )}
        </>
      )}

      <TodayTomatoCount onOpenStats={onOpenStats} />
    </div>
  )
})
