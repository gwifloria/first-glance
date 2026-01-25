import type { ThemeConfig } from 'antd'
import type { Theme } from './index'

/**
 * 根据应用主题生成 Ant Design 主题配置
 */
export function createAntdTheme(theme: Theme): ThemeConfig {
  const { colors } = theme
  const isDark = theme.type === 'modern'

  return {
    token: {
      // 颜色
      colorPrimary: colors.accent,
      colorBgContainer: colors.bgCard,
      colorBgElevated: colors.bgCard,
      colorBgLayout: colors.bgPrimary,
      colorText: colors.textPrimary,
      colorTextSecondary: colors.textSecondary,
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
        // 主按钮
        primaryColor: isDark ? '#18181b' : '#fff',
        // 文本按钮
        textHoverBg: isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)',
        // 通用
        fontWeight: 500,
        paddingInline: 16,
        paddingBlock: 6,
      },
      Modal: {
        contentBg: colors.bgCard,
        headerBg: colors.bgCard,
        titleColor: colors.textPrimary,
        borderRadiusLG: 16,
      },
      Input: {
        activeBg: 'transparent',
        hoverBg: 'transparent',
        colorBgContainer: colors.bgSecondary,
        colorText: colors.textPrimary,
        colorTextPlaceholder: colors.textSecondary,
        activeBorderColor: colors.accent,
        hoverBorderColor: colors.border,
      },
      Select: {
        colorBgContainer: colors.bgCard,
        colorBgElevated: colors.bgCard,
        colorText: colors.textPrimary,
        optionSelectedBg: colors.accentLight,
        optionSelectedColor: colors.textPrimary,
        optionActiveBg: isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)',
      },
      Form: {
        labelColor: colors.textPrimary,
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
