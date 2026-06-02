import type { Theme } from './index'

/**
 * 卡片/弹窗表面是否为深色。
 * 「深色主题且未提供 textOnCard（浅色卡片覆盖）」即深色卡片——
 * twilight 这类「深页面 + 浅卡片」的 journal 主题有 textOnCard，卡片仍是浅色。
 */
export function isDarkCardTheme(theme: Theme): boolean {
  return (theme.isDark ?? false) && !theme.colors.textOnCard
}

/**
 * 从主题派生「卡片表面」上的一组交互/抬升色。
 * antd token（antdTheme.ts）与 CSS 变量（ThemeProvider）都从这里取，
 * 避免两处各推一遍 isDarkCard 判据与叠加色而漂移。
 *
 * 各值语义不同，不可互相替代；且按「卡片」还是「页面/侧边栏」明暗派生要分清：
 * - overlaySelected / overlayHover / surfaceRaised / track 按**卡片**明暗（darkCard），
 *   给渲染在卡片/弹窗内的 antd 组件用。
 * - overlayHoverSurface 按**页面/侧边栏**明暗（theme.isDark）派生：twilight 卡片是浅色
 *   但页面/侧边栏是深色，二者不同步，所以侧边栏/导航/列表行 hover 要用这个，
 *   否则 twilight 下深表面上叠黑色会不可见。
 */
export function deriveSurfaceTokens(theme: Theme) {
  const darkCard = isDarkCardTheme(theme)
  const darkSurface = theme.isDark ?? false
  return {
    darkCard,
    overlaySelected: darkCard
      ? 'rgba(255, 255, 255, 0.12)'
      : theme.colors.accentLight,
    overlayHover: darkCard
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
    surfaceRaised: darkCard
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(0, 0, 0, 0.04)',
    track: darkCard ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
    // 页面/侧边栏（非卡片）表面上的 hover 叠加
    overlayHoverSurface: darkSurface
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
  }
}
