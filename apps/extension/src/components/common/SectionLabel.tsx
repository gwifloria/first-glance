import type { ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
  /** 右侧 slot：Premium badge、Segmented 控件等 */
  right?: ReactNode
  /** 容器额外类名：常用于补 margin / padding / border */
  className?: string
}

/**
 * 统一"小标题"样式：text-xs · uppercase · tracking-wide · 次要文字色
 * 用于设置面板各分段、Popover 分区头等
 */
export function SectionLabel({
  children,
  right,
  className,
}: SectionLabelProps) {
  const base =
    'flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]'
  return (
    <div className={className ? `${base} ${className}` : base}>
      <span>{children}</span>
      {right}
    </div>
  )
}
