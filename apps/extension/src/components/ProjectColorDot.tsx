interface ProjectColorDotProps {
  color?: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const sizeMap = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
}

/**
 * 项目颜色指示点
 * 用于显示项目的颜色标识
 */
export function ProjectColorDot({
  color = 'var(--accent)',
  size = 'sm',
  className = '',
}: ProjectColorDotProps) {
  return (
    <span
      className={`rounded-full shrink-0 ${sizeMap[size]} ${className}`}
      style={{ background: color }}
    />
  )
}
