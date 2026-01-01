interface CollapseArrowProps {
  isCollapsed: boolean
  className?: string
}

/**
 * 折叠箭头组件
 * 折叠时显示 ›，展开时旋转 -90 度
 */
export function CollapseArrow({
  isCollapsed,
  className = '',
}: CollapseArrowProps) {
  return (
    <span
      className={`
        text-xs text-[var(--text-secondary)] w-3.5 text-center
        transition-transform duration-200
        ${isCollapsed ? '' : '-rotate-90'}
        ${className}
      `}
    >
      ›
    </span>
  )
}
