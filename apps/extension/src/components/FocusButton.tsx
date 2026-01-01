import { AppstoreOutlined } from '@ant-design/icons'

interface FocusButtonProps {
  onClick: () => void
  size?: 'default' | 'large'
}

export function FocusButton({ onClick, size = 'default' }: FocusButtonProps) {
  const isLarge = size === 'large'

  return (
    <button
      onClick={onClick}
      className={`
        focus-button relative rounded-full bg-[var(--bg-card)] cursor-pointer border-0 overflow-hidden
        ${isLarge ? 'px-5 py-2.5' : 'px-4 py-1.5'}
      `}
    >
      {/* 渐变边框动画层 */}
      <span className="absolute inset-0 rounded-full p-[2px] overflow-hidden">
        <span className="absolute inset-[-50%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0deg,var(--accent)_90deg,transparent_180deg)]" />
      </span>
      {/* 内容背景层 */}
      <span className="absolute inset-[2px] rounded-full bg-[var(--bg-card)]" />
      {/* 内容层 */}
      <span
        className={`
          relative flex items-center gap-2 text-[var(--text-primary)] font-medium
          ${isLarge ? 'text-sm' : 'text-xs'}
        `}
      >
        <AppstoreOutlined className={isLarge ? 'text-base' : 'text-sm'} />
        <span>FOCUS</span>
      </span>
    </button>
  )
}
