/**
 * 番茄图标 — 简笔线条风，使用 currentColor 适配主题
 */
export function TomatoIcon({
  size = 16,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* 茎 */}
      <path
        d="M12 7V4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* 叶子 */}
      <path
        d="M12 6.5C10 5 8.5 5.5 8 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 6.5C14 5 15.5 5.5 16 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* 番茄身体 */}
      <ellipse
        cx="12"
        cy="14"
        rx="7.5"
        ry="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </svg>
  )
}
