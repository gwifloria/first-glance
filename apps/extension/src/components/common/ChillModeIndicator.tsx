import { CoffeeOutlined, CloseOutlined } from '@ant-design/icons'
import { useChillMode } from '@/hooks'

/**
 * Chill Mode 灵动岛指示器
 * 固定在页面顶部中央，带滑入动画
 */
export function ChillModeIndicator() {
  const { isActive, remainingTime, endChillMode } = useChillMode()

  if (!isActive) return null

  return (
    <div
      className="
        fixed top-4 left-1/2 z-50
        flex items-center gap-3 px-4 py-2
        rounded-full
        bg-[var(--bg-card)] text-[var(--text-primary)]
        border border-[var(--border)]
        shadow-[var(--shadow-medium)]
        animate-slideDown
      "
    >
      {/* 图标 */}
      <CoffeeOutlined className="text-[var(--warning)]" />

      {/* 倒计时 */}
      <span className="font-mono text-lg font-bold tracking-wide">
        {remainingTime}
      </span>

      {/* 关闭按钮 */}
      <button
        onClick={endChillMode}
        className="w-6 h-6 flex items-center justify-center
          rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border)]
          text-[var(--text-secondary)] hover:text-[var(--text-primary)]
          transition-colors"
        title="End Chill Mode"
      >
        <CloseOutlined className="text-xs" />
      </button>
    </div>
  )
}
