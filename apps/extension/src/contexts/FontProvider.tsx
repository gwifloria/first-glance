import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  FONT_OPTIONS,
  FONT_SCALE_SIZES,
  getFontOption,
  type FontScale,
  type FontType,
} from '@/constants/fonts'
import {
  getFont,
  getFontScale,
  setFont,
  setFontScale as persistFontScale,
  subscribeFont,
  subscribeFontScale,
} from '@/services/fontStorage'
import { loadFontCss } from '@/services/fontLoader'
import { useTheme } from '@/hooks/useTheme'
import { FontContext } from './FontContext'
import { PremiumContext } from './PremiumContext'

export function FontProvider({ children }: { children: ReactNode }) {
  const [fontType, setFontTypeState] = useState<FontType>('default')
  const [fontScale, setFontScaleState] = useState<FontScale>('M')
  const { theme } = useTheme()
  const premiumCtx = useContext(PremiumContext)

  // 初始加载
  useEffect(() => {
    getFont().then(setFontTypeState)
    getFontScale().then(setFontScaleState)
  }, [])

  // 监听跨标签页变化
  useEffect(() => {
    const unsubFont = subscribeFont(setFontTypeState)
    const unsubScale = subscribeFontScale(setFontScaleState)
    return () => {
      unsubFont()
      unsubScale()
    }
  }, [])

  // 应用字号到 html 根元素：改 font-size 让所有 rem 单位等比缩放
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SCALE_SIZES[fontScale]
  }, [fontScale])

  // 启动时预加载已选字体的 CDN（避免主题字体变量指向未加载的 family，导致系统字体兜底）
  useEffect(() => {
    const option = getFontOption(fontType)
    if (option.cssUrls) loadFontCss(option.cssUrls)
  }, [fontType])

  // 应用字体到 CSS 变量
  // 依赖 theme：主题切换时，ThemeProvider 会重写字体变量，这里必须再次覆盖
  useEffect(() => {
    const root = document.documentElement
    const option = getFontOption(fontType)
    const primary = option.fontFamily?.primary ?? theme.font.primary
    const secondary = option.fontFamily?.secondary ?? theme.font.secondary
    const heading = option.fontFamily?.heading ?? theme.font.heading
    const hand = option.fontFamily?.hand ?? theme.font.hand

    root.style.setProperty('--font-primary', primary)
    root.style.setProperty('--font-secondary', secondary)
    root.style.setProperty('--font-heading', heading)
    if (hand) {
      root.style.setProperty('--font-hand', hand)
    } else {
      root.style.removeProperty('--font-hand')
    }
    // 花体可读性补偿系数，正文 font-hand 标题按字体放大字号
    root.style.setProperty('--font-hand-scale', String(option.handScale ?? 1))
  }, [fontType, theme])

  const setFontType = useCallback(
    (type: FontType) => {
      const target = FONT_OPTIONS.find((f) => f.type === type)
      if (target?.premium && premiumCtx && !premiumCtx.isPremium) {
        premiumCtx.openPremiumModal()
        return
      }
      setFont(type)
    },
    [premiumCtx]
  )

  const setFontScale = useCallback((scale: FontScale) => {
    persistFontScale(scale)
  }, [])

  return (
    <FontContext.Provider
      value={{ fontType, setFontType, fontScale, setFontScale }}
    >
      {children}
    </FontContext.Provider>
  )
}
