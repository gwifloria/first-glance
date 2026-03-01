import { memo } from 'react'
import { ProjectColorDot } from '../common/ProjectColorDot'

const MAX_VISIBLE_COUNT = 99

interface NavItemProps {
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
  name: string
  count: number
  nested?: boolean
  color?: string
  collapsed?: boolean
}

export const NavItem = memo(function NavItem({
  active,
  onClick,
  icon,
  name,
  count,
  nested = false,
  color,
  collapsed = false,
}: NavItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={name}
      aria-pressed={active}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      title={collapsed ? name : undefined}
      className={`
        flex items-center gap-2.5 py-2 cursor-pointer rounded-lg my-0.5
        transition-all duration-200 ease-out
        ${collapsed ? 'justify-center px-2' : 'px-3'}
        ${nested && !collapsed ? 'pl-7' : ''}
        ${active ? 'bg-[var(--accent-light)]' : 'hover:bg-black/[0.04] hover:translate-x-0.5'}
      `}
    >
      {icon ? (
        <span
          className={`text-base w-5 flex items-center justify-center shrink-0 ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
        >
          {icon}
        </span>
      ) : (
        <ProjectColorDot color={color} />
      )}
      {!collapsed && (
        <>
          <span className="flex-1 text-[13px] text-[var(--text-primary)] truncate">
            {name}
          </span>
          {count > 0 && (
            <span
              className={`
                text-xs font-normal
                ${
                  active
                    ? 'bg-[var(--accent)] text-white min-w-[18px] h-[18px] leading-[18px] rounded-[9px] px-1.5 text-center'
                    : 'text-[var(--text-secondary)]'
                }
              `}
            >
              {count > MAX_VISIBLE_COUNT ? `${MAX_VISIBLE_COUNT}+` : count}
            </span>
          )}
        </>
      )}
    </div>
  )
})
