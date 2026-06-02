import type { ThemeConfig } from 'antd'
import type { Theme } from './index'
import { contrastText } from '@/utils/color'
import { deriveSurfaceTokens } from './surface'

/**
 * 根据应用主题生成 Ant Design 主题配置
 */
export function createAntdTheme(theme: Theme): ThemeConfig {
  const { colors } = theme
  // 卡片表面派生色（与 ThemeProvider 的 CSS 变量同一来源）
  const {
    darkCard: isDarkCard,
    overlaySelected,
    overlayHover,
  } = deriveSurfaceTokens(theme)
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
        // 默认按钮。字色走 var(--text-primary)：页面上是页面字色，进入
        // .ant-modal-container / .card-surface 作用域会自动重映射成卡片字色，
        // 避免 modal.confirm 的取消按钮（如「Not yet」）在 twilight 浅卡片上隐身。
        defaultBg: 'transparent',
        defaultBorderColor: colors.border,
        defaultColor: 'var(--text-primary)',
        defaultHoverBg: colors.accentLight,
        defaultHoverBorderColor: colors.accent,
        defaultHoverColor: 'var(--text-primary)',
        // 主按钮：根据 accent 亮度自动计算对比色
        primaryColor: contrastText(colors.accent),
        // 文本按钮
        textHoverBg: overlayHover,
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
        // footer 内边距走 token（原先靠 styles.footer.padding）
        footerPaddingBlock: 12,
        footerPaddingInline: 24,
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
        // 输入框观感统一走 token（原先靠 FORM_INPUT_STYLE 一串 class）：
        // 卡片抬升填充 + 圆角 12 + 内边距 + hover/focus 转 accent + 去 focus 阴影
        colorBgContainer: 'var(--surface-raised)',
        hoverBg: 'var(--surface-raised)',
        activeBg: 'var(--surface-raised)',
        colorText: textOnCard,
        colorTextPlaceholder: textSecondaryOnCard,
        activeBorderColor: colors.accent,
        hoverBorderColor: colors.accent,
        borderRadius: 12,
        paddingBlock: 10,
        paddingInline: 16,
        inputFontSize: 14,
        activeShadow: 'none',
      },
      Select: {
        // selector 填充用卡片抬升色（与 Input 一致）；下拉面板仍用 bgElevated
        selectorBg: 'var(--surface-raised)',
        colorBgElevated: colors.bgCard,
        colorText: textOnCard,
        // dark 主题里 accentLight == bgCard（同为 #18181b），选中高亮会与下拉面板
        // 同色而隐形，故走 overlaySelected（深色卡片用浅色半透明叠加）
        optionSelectedBg: overlaySelected,
        optionSelectedColor: textOnCard,
        optionActiveBg: overlayHover,
        optionFontSize: 14,
        hoverBorderColor: colors.accent,
        activeBorderColor: colors.accent,
        borderRadius: 12,
      },
      Menu: {
        // Dropdown 菜单（如侧边栏默认清单选择）渲染在 colorBgElevated=卡片表面上。
        // antd 默认选中态走 colorPrimary 派生：dark 主题 accent=#fafafa（白），
        // 会得到白底白字而隐身。这里把选中/hover 焊死到卡片字色 + 可见叠加。
        itemColor: textOnCard,
        itemHoverColor: textOnCard,
        itemSelectedColor: textOnCard,
        itemSelectedBg: overlaySelected,
        itemHoverBg: overlayHover,
        itemActiveBg: overlayHover,
      },
      Radio: {
        // 优先级 Radio.Group 用 flex gap 控间距，去掉每项默认右外边距
        wrapperMarginInlineEnd: 0,
      },
      Segmented: {
        // Segmented 多在页面表面浮层（如设置 Popover）里：字色用 CSS 变量，
        // 借 .card-surface 重映射做到「页面/卡片表面自适应」，避免 twilight 深底隐身
        itemColor: 'var(--text-secondary)',
        itemHoverColor: 'var(--text-primary)',
        itemSelectedBg: 'var(--accent-light)',
        itemSelectedColor: 'var(--text-primary)',
        trackBg: 'var(--bg-secondary)',
      },
      DatePicker: {
        // 抽屉里日期面板：hover/选中跟随主题强调色
        cellHoverBg: 'var(--accent-light)',
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
        labelFontSize: 12,
        verticalLabelPadding: '0 0 6px',
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
