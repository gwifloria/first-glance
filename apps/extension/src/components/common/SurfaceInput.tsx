/**
 * 表面感知的输入框 —— 页面 / 侧边栏表面上的 antd Input 预设。
 *
 * 为什么需要它（与 SurfaceIconButton 同源问题）：
 * antd Input token 的 colorText 被设成「卡片字色」（见 themes/antdTheme.ts），
 * 因为多数 Input 渲染在卡片/弹窗内。但放到页面/侧边栏这种表面上时，typed text
 * 与 placeholder 会拿到卡片字色，在「深页面 + 浅卡片」主题（如 twilight）下隐身。
 *
 * 本组件把内部 `.ant-input` 的字色/占位/背景焊到对应表面字色，省去每处手搓
 * `[&_.ant-input]:!text-...` 一长串。外层底色/圆角/内边距仍由调用方 className 决定。
 *
 * 卡片/弹窗内的 antd Input 无需本组件 —— antd 默认卡片字色就对。
 */
import { Input } from 'antd'
import type { InputProps } from 'antd'

type Surface = 'page' | 'sidebar'

const SURFACE_INPUT_CLASS: Record<Surface, string> = {
  page: '[&_.ant-input]:!bg-transparent [&_.ant-input]:!text-[var(--text-primary)] [&_.ant-input::placeholder]:!text-[var(--text-secondary)]',
  sidebar:
    '[&_.ant-input]:!bg-transparent [&_.ant-input]:!text-[var(--sidebar-text)] [&_.ant-input::placeholder]:!text-[var(--sidebar-text)]',
}

export interface SurfaceInputProps extends InputProps {
  /** 输入框所在背景表面，决定字色。默认 'page'。卡片/弹窗内不要用本组件。 */
  surface?: Surface
}

export function SurfaceInput({
  surface = 'page',
  className = '',
  ...rest
}: SurfaceInputProps) {
  return (
    <Input
      className={`${SURFACE_INPUT_CLASS[surface]} ${className}`}
      {...rest}
    />
  )
}
