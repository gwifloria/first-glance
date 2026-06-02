/**
 * 「开启番茄钟」按钮 —— 列表行与 Focus 行 hover 时共用同一外观与文字提示。
 * 点击即绑定该任务并开始番茄钟（具体跳转/绑定由调用方的 onStart 决定）。
 */
import { Button, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import { TomatoIcon } from '../FocusView/TomatoIcon'
import type { Task } from '@/types'

interface StartPomodoroButtonProps {
  task: Task
  onStart: (task: Task) => void
  /** 追加类名（如 Focus 行的 hover 显隐过渡）。字色/hover 已内置。 */
  className?: string
}

export function StartPomodoroButton({
  task,
  onStart,
  className = '',
}: StartPomodoroButtonProps) {
  const { t } = useTranslation('focus')
  return (
    <Tooltip title={t('pomodoro.start')}>
      <Button
        type="text"
        size="small"
        icon={<TomatoIcon size={14} />}
        onClick={() => onStart(task)}
        className={`!text-[var(--text-secondary)] hover:!text-[var(--accent)] ${className}`}
        aria-label={t('pomodoro.start')}
      />
    </Tooltip>
  )
}
