import type { ThemeConfig } from 'antd'
import type { Theme } from './index'
import { contrastText } from '@/utils/color'

/**
 * 根据应用主题生成 Ant Design 主题配置
 */
export function createAntdTheme(theme: Theme): ThemeConfig {
  const { colors } = theme
  const isDark = theme.isDark ?? theme.type === 'modern'
  // 卡片/modal 表面是否为深色（有 textOnCard 说明卡片是浅色）
  const isDarkCard = isDark && !colors.textOnCard
  // antd 组件主要渲染在卡片/modal 内，使用卡片上的文字颜色
  const textOnCard = colors.textOnCard ?? colors.textPrimary
  const textSecondaryOnCard = colors.textSecondaryOnCard ?? colors.textSecondary
  // antd 组件的输入框/标签等背景色（卡片上的次级背景）
  const bgSecondaryOnCard = colors.bgSecondaryOnCard ?? colors.bgSecondary

  return {
    token: {
      // 颜色
      colorPrimary: colors.accent,
      colorLink: colors.accent,
      colorLinkHover: colors.accent,
      colorLinkActive: colors.accent,
      colorBgContainer: colors.bgCard,
      colorBgElevated: colors.bgCard,
      colorBgLayout: colors.bgPrimary,
      colorText: textOnCard,
      colorTextSecondary: textSecondaryOnCard,
      colorBorder: colors.border,
      colorBorderSecondary: colors.border,
      colorError: colors.danger,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      // 圆角
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      // 字体
      fontFamily: theme.font.primary,
    },
    components: {
      Button: {
        // 默认按钮
        defaultBg: 'transparent',
        defaultBorderColor: colors.border,
        defaultColor: colors.textPrimary,
        defaultHoverBg: colors.accentLight,
        defaultHoverBorderColor: colors.accent,
        defaultHoverColor: colors.textPrimary,
        // 主按钮：根据 accent 亮度自动计算对比色
        primaryColor: contrastText(colors.accent),
        // 文本按钮
        textHoverBg: isDarkCard
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)',
        // 通用：手帐风全局去掉按钮投影（原先靠各处 !shadow-none）
        defaultShadow: 'none',
        primaryShadow: 'none',
        dangerShadow: 'none',
        fontWeight: 500,
        paddingInline: 16,
        paddingBlock: 6,
      },
      Modal: {
        contentBg: colors.bgCard,
        headerBg: colors.bgCard,
        titleColor: textOnCard,
        borderRadiusLG: 16,
        // 内部 ModalToken（未在公开 ComponentToken 暴露，用 as object 绕类型，与 Drawer 同款）：
        // header 不要下边框；footer 走手帐风虚线分隔（原先靠 MODAL_STYLE 的 class）
        ...({
          headerBorderBottom: 'none',
          footerBorderTop: '1px dashed var(--border)',
        } as object),
      },
      Drawer: {
        // 抽屉面板（section）底色走卡片色；圆角/阴影/留白在组件里用 styles.section 配
        colorBgElevated: colors.bgCard,
        colorText: textOnCard,
        // 关掉 antd 给外层 wrapper（直角）的默认阴影，避免从圆角缝里露出直角暗块；
        // 阴影改由 styles.section 自己出（跟着圆角走）。
        // 这些是 antd6 内部计算 token、未在公开类型暴露，用 as object 绕过类型检查
        ...({
          boxShadowDrawerRight: 'none',
          boxShadowDrawerLeft: 'none',
          boxShadowDrawerUp: 'none',
          boxShadowDrawerDown: 'none',
        } as object),
      },
      Input: {
        activeBg: 'transparent',
        hoverBg: 'transparent',
        colorBgContainer: bgSecondaryOnCard,
        colorText: textOnCard,
        colorTextPlaceholder: textSecondaryOnCard,
        activeBorderColor: colors.accent,
        hoverBorderColor: colors.border,
      },
      Select: {
        colorBgContainer: colors.bgCard,
        colorBgElevated: colors.bgCard,
        colorText: textOnCard,
        optionSelectedBg: colors.accentLight,
        optionSelectedColor: textOnCard,
        optionActiveBg: isDarkCard
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)',
      },
      Slider: {
        railBg: isDarkCard
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(0, 0, 0, 0.06)',
        railHoverBg: isDarkCard
          ? 'rgba(255, 255, 255, 0.18)'
          : 'rgba(0, 0, 0, 0.1)',
        trackBg: colors.accent,
        trackHoverBg: colors.accent,
        dotBorderColor: isDarkCard
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(0, 0, 0, 0.08)',
        dotActiveBorderColor: colors.accent,
        handleColor: colors.accent,
        handleLineWidth: 2,
        handleLineWidthHover: 3,
      },
      Tag: {
        defaultBg: bgSecondaryOnCard,
        defaultColor: textOnCard,
      },
      Form: {
        labelColor: textOnCard,
        itemMarginBottom: 16,
      },
      Empty: {
        colorText: colors.textSecondary,
        colorTextDescription: colors.textSecondary,
      },
      Skeleton: {
        gradientFromColor: colors.bgSecondary,
        gradientToColor: colors.bgCard,
      },
    },
  }
}
