/**
 * 今日番茄计数指示器
 * 点击展开本周统计 Popover，可进一步打开完整统计面板
 */
import { useState, useEffect } from 'react'
import { Popover } from 'antd'
import {
  getFocusStats,
  subscribeFocusStats,
  getTodayStats,
} from '@/services/focusStats'
import { StatsPopoverContent } from './StatsCard'
import { TomatoIcon } from './TomatoIcon'

export function TodayTomatoCount({
  onOpenStats,
}: {
  onOpenStats?: () => void
}) {
  const [todayCount, setTodayCount] = useState<number>(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getFocusStats().then((data) => setTodayCount(getTodayStats(data).count))
    return subscribeFocusStats((data) =>
      setTodayCount(getTodayStats(data).count)
    )
  }, [])

  if (todayCount === 0) return null

  const handleOpenStats = onOpenStats
    ? () => {
        setOpen(false)
        onOpenStats()
      }
    : undefined

  return (
    <Popover
      content={<StatsPopoverContent onOpenDashboard={handleOpenStats} />}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      destroyTooltipOnHide
    >
      <span className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--accent)] transition-colors select-none">
        <TomatoIcon size={16} />
        <span>× {todayCount}</span>
      </span>
    </Popover>
  )
}
