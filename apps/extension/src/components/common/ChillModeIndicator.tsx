import { useChillMode } from '@/hooks'
import { CoffeeCup } from './CoffeeCup'

/**
 * Chill Mode 灵动岛指示器
 * 固定在页面顶部中央，咖啡杯液面随倒计时逐渐"喝完"
 */
export function ChillModeIndicator() {
  const { isActive, remainingTime, remainingPercent } = useChillMode()

  if (!isActive) return null

  return (
    <div
      className="
        fixed top-4 left-1/2 z-50
        flex items-center gap-3 px-4 py-2
        rounded-full
        card-surface
        bg-[var(--bg-card)] text-[var(--text-primary)]
        border border-[var(--border)]
        shadow-[var(--shadow-medium)]
        animate-slideDown
      "
    >
      {/* 咖啡杯 */}
      <CoffeeCup
        fillPercent={remainingPercent}
        size={36}
        className="text-[var(--text-secondary)]"
      />

      {/* 倒计时（弱化，咖啡杯已传达进度） */}
      <span className="font-mono text-sm text-[var(--text-secondary)] tracking-wide">
        {remainingTime}
      </span>
    </div>
  )
}
