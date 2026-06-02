/**
 * 字体主题包配置
 * 跟主题（颜色）平级的可选维度。default 使用主题自带字体，其他字体远程加载。
 */

export type FontType =
  | 'default'
  | 'playful-warmth'
  | 'notebook-script'
  | 'festive-romance'

export type FontScale = 'S' | 'M' | 'L'

export const FONT_SCALES: FontScale[] = ['S', 'M', 'L']

// 改 html 根 font-size，所有用 rem 的地方自动按比例缩放
export const FONT_SCALE_SIZES: Record<FontScale, string> = {
  S: '14px',
  M: '16px',
  L: '18px',
}

export interface FontOption {
  type: FontType
  /** UI 显示名 */
  name: string
  /** 远程 CSS URL 列表；default 无需加载 */
  cssUrls?: string[]
  /** 覆盖主题字体变量；缺省字段保留主题默认 */
  fontFamily?: {
    primary?: string
    secondary?: string
    heading?: string
    hand?: string
  }
  premium?: boolean
  /** 预览卡片字号补偿：x-height 较小的字体（如花体）放大以视觉对齐 */
  previewScale?: number
  /**
   * 正文手写体（.font-hand）字号补偿系数，默认 1。
   * 花体 x-height 偏小，同字号下比 default 更难读，按字体放大以拉平可读性。
   * 注入为 --font-hand-scale，由用到 font-hand 的正文标题 calc 引用。
   */
  handScale?: number
}

export const FONT_OPTIONS: FontOption[] = [
  {
    type: 'default',
    name: 'Default',
  },
  {
    type: 'playful-warmth',
    name: 'DynaPuff',
    cssUrls: [
      'https://fonts.googleapis.cn/css2?family=DynaPuff:wght@400;600&family=Montserrat:wght@400;500;600&family=Long+Cang&display=swap',
    ],
    fontFamily: {
      primary: '"Montserrat", "PingFang SC", sans-serif',
      secondary: '"Montserrat", "PingFang SC", sans-serif',
      heading: '"DynaPuff", "Long Cang", cursive',
      hand: '"DynaPuff", "Long Cang", cursive',
    },
    premium: true,
    handScale: 1.1,
  },
  {
    type: 'notebook-script',
    name: 'Playwrite',
    cssUrls: [
      'https://fonts.googleapis.cn/css2?family=Playwrite+GB+S&family=Montserrat:wght@400;500;600&family=ZCOOL+KuaiLe&display=swap',
    ],
    fontFamily: {
      primary: '"Montserrat", "PingFang SC", sans-serif',
      secondary: '"Montserrat", "PingFang SC", sans-serif',
      heading: '"Playwrite GB S", "ZCOOL KuaiLe", cursive',
      hand: '"Playwrite GB S", "ZCOOL KuaiLe", cursive',
    },
    premium: true,
    handScale: 1.12,
  },
  {
    type: 'festive-romance',
    name: 'Mountains of Christmas',
    cssUrls: [
      'https://fonts.googleapis.cn/css2?family=Mountains+of+Christmas:wght@400;700&family=Montserrat:wght@400;500;600&family=Ma+Shan+Zheng&display=swap',
    ],
    fontFamily: {
      primary: '"Montserrat", "PingFang SC", sans-serif',
      secondary: '"Montserrat", "PingFang SC", sans-serif',
      heading: '"Mountains of Christmas", "Ma Shan Zheng", cursive',
      hand: '"Mountains of Christmas", "Ma Shan Zheng", cursive',
    },
    premium: true,
    previewScale: 1.25,
    handScale: 1.16,
  },
]

export function getFontOption(type: FontType): FontOption {
  return FONT_OPTIONS.find((f) => f.type === type) ?? FONT_OPTIONS[0]
}

/** 字体是否被会员墙挡住 */
export function isFontLocked(option: FontOption, isPremium: boolean): boolean {
  return !!option.premium && !isPremium
}
