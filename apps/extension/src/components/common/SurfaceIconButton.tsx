/**
 * 表面感知的图标按钮 —— 页面 / 侧边栏表面上的 antd Button 预设。
 *
 * 为什么需要它：
 * antd 的全局 `colorText` token 被设成了「卡片字色」（见 themes/antdTheme.ts），
 * 因为大多数 antd 组件渲染在卡片/弹窗内。但在「深色页面 + 浅色卡片」的主题
 * （如 twilight）里，卡片字色是深色，直接用 <Button type="text"> 放到页面/侧边栏
 * 这种深色表面上，按钮文字/图标就会拿到深色卡片字色而隐身。
 *
 * 普通的 `text-[var(--...)]`（不带 `!`）斗不过 antd 的 `.ant-btn` color，必须用
 * `!important`。本组件把正确表面的字色 + hover 焊死在内部，页面/侧边栏上的图标
 * 按钮一律用它，就不用每次手动记得加 `!`、也不用逐主题回溯。
 *
 * 卡片/弹窗内的 antd 按钮无需本组件 —— antd 默认色就对。
 */
import { Button } from 'antd'
import type { ButtonProps } from 'antd'

type Surface = 'page' | 'sidebar'

const SURFACE_CLASS: Record<Surface, string> = {
  // 页面表面：次级字色，hover 到强调色
  page: '!text-[var(--text-secondary)] hover:!text-[var(--accent)]',
  // 侧边栏表面：侧边栏字色，hover 到侧边栏高亮字色
  sidebar:
    '!text-[var(--sidebar-text)] hover:!text-[var(--sidebar-active-text)]',
}

export interface SurfaceIconButtonProps extends ButtonProps {
  /** 按钮所在的背景表面，决定字色。默认 'page'。卡片/弹窗内不要用本组件。 */
  surface?: Surface
}

export function SurfaceIconButton({
  surface = 'page',
  type = 'text',
  className = '',
  ...rest
}: SurfaceIconButtonProps) {
  return (
    <Button
      type={type}
      className={`transition-colors ${SURFACE_CLASS[surface]} ${className}`}
      {...rest}
    />
  )
}
