import { RightOutlined } from '@ant-design/icons'

interface SectionTitleProps {
  title: string
  collapsed?: boolean
  onToggle?: () => void
}

export function SectionTitle({
  title,
  collapsed,
  onToggle,
}: SectionTitleProps) {
  const isCollapsible = onToggle !== undefined

  if (!isCollapsible) {
    return (
      <div className="px-3 py-2 text-[0.6875rem] font-medium text-[var(--text-secondary)] tracking-wide font-[family-name:var(--font-heading)] flex items-center gap-1">
        <span className="text-xs">›</span>
        {title}
      </div>
    )
  }

  return (
    <div
      onClick={onToggle}
      className="px-3 py-2 text-[0.6875rem] font-medium text-[var(--text-secondary)] tracking-wide font-[family-name:var(--font-heading)] flex items-center gap-1 cursor-pointer hover:opacity-80 select-none"
    >
      <RightOutlined
        className={`text-[10px] transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}
      />
      {title}
    </div>
  )
}
