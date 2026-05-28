import { createContext } from 'react'
import type { FontScale, FontType } from '@/constants/fonts'

export interface FontContextValue {
  fontType: FontType
  setFontType: (type: FontType) => void
  fontScale: FontScale
  setFontScale: (scale: FontScale) => void
}

export const FontContext = createContext<FontContextValue | null>(null)
