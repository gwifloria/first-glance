/**
 * 刷新按钮组件
 * 通过 TaskContext 获取刷新方法，无需 props 传递
 */
import { useState, useCallback } from 'react'
import { Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from '@/contexts/TaskContext'
import { SurfaceIconButton } from './SurfaceIconButton'

const MIN_SPIN_DURATION = 600 // 最小旋转时间，确保动画可见

interface RefreshButtonProps {
  className?: string
}

export function RefreshButton({ className }: RefreshButtonProps) {
  const { t } = useTranslation('common')
  const { actions } = useTaskContext()
  const { refresh } = actions
  const [spinning, setSpinning] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (spinning) return
    setSpinning(true)

    // 同时等待刷新完成和最小动画时间
    await Promise.all([
      refresh(),
      new Promise((resolve) => setTimeout(resolve, MIN_SPIN_DURATION)),
    ])

    setSpinning(false)
  }, [spinning, refresh])

  return (
    <Tooltip title={t('action.refresh')}>
      <SurfaceIconButton
        surface="page"
        size="small"
        icon={<ReloadOutlined spin={spinning} />}
        onClick={handleRefresh}
        disabled={spinning}
        className={className}
      />
    </Tooltip>
  )
}
