/**
 * 咖啡杯 SVG 动画组件
 * fillPercent 控制液面高度：长按注满(0→1)、倒计时喝完(1→0)
 *
 * 颜色策略：
 * - 杯体轮廓/蒸汽 = currentColor（由调用方通过 className 控制）
 * - 液体 = 固定咖啡棕 #c8a06e（可通过 liquidColor 覆盖）
 *
 * 调用方职责：
 * - 卡片表面（ChillModeIndicator）→ 加 card-surface class，用 text-[var(--text-secondary)]
 * - 页面背景（ChillModePanel）→ 直接继承页面文字色
 */

interface CoffeeCupProps {
  /** 液面比例 0~1 */
  fillPercent: number
  /** 组件尺寸，默认 40 */
  size?: number
  /** 液体颜色，默认咖啡棕 */
  liquidColor?: string
  className?: string
}

export function CoffeeCup({
  fillPercent,
  size = 40,
  liquidColor = '#c8a06e',
  className,
}: CoffeeCupProps) {
  const fill = Math.max(0, Math.min(1, fillPercent))
  // 杯体内部高度区间：y=10 (顶) → y=32 (底)，共 22 单位
  const liquidHeight = fill * 22
  const liquidY = 32 - liquidHeight

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      {/* 液体（裁剪到杯体内部） */}
      <defs>
        <clipPath id="cup-clip">
          <rect x="6" y="10" width="22" height="22" rx="3" />
        </clipPath>
      </defs>

      {fill > 0 && (
        <g clipPath="url(#cup-clip)">
          <rect
            x="6"
            y={liquidY}
            width="22"
            height={liquidHeight + 1}
            rx="1"
            fill={liquidColor}
            opacity="0.8"
          >
            <animate
              attributeName="y"
              values={`${liquidY};${liquidY - 0.8};${liquidY}`}
              dur="2s"
              repeatCount="indefinite"
            />
          </rect>
          {/* 波浪高光 */}
          <ellipse
            cx="17"
            cy={liquidY}
            rx="10"
            ry="1.5"
            fill={liquidColor}
            opacity="0.5"
          >
            <animate
              attributeName="cy"
              values={`${liquidY};${liquidY - 0.8};${liquidY}`}
              dur="2s"
              repeatCount="indefinite"
            />
          </ellipse>
        </g>
      )}

      {/* 杯体轮廓 */}
      <rect
        x="6"
        y="10"
        width="22"
        height="22"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.7"
      />

      {/* 把手 */}
      <path
        d="M28 15 C33 15, 35 20, 35 23 C35 26, 33 28, 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* 蒸汽（三缕，错开节奏） */}
      {fill > 0 && (
        <g opacity={0.5}>
          <path
            d="M12 9 Q10 5, 13 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values="M12 9 Q10 5, 13 1;M12 9 Q14 5, 11 1;M12 9 Q10 5, 13 1"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M17 8 Q19 4, 16 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values="M17 8 Q19 4, 16 0;M17 8 Q15 4, 18 0;M17 8 Q19 4, 16 0"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M22 9 Q24 5, 21 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values="M22 9 Q24 5, 21 1;M22 9 Q20 5, 23 1;M22 9 Q24 5, 21 1"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      )}
    </svg>
  )
}
