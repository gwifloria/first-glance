import type { FontScale, FontType } from '@/constants/fonts'
import { FONT_OPTIONS, FONT_SCALES } from '@/constants/fonts'
import { createStorageSubscriber } from './storageSubscriber'

const FONT_KEY = 'app_font'
const FONT_SCALE_KEY = 'app_font_scale'
const DEFAULT_FONT: FontType = 'default'
const DEFAULT_FONT_SCALE: FontScale = 'M'

function resolveFont(raw: unknown): FontType {
  if (typeof raw !== 'string') return DEFAULT_FONT
  const valid = FONT_OPTIONS.some((f) => f.type === raw)
  return valid ? (raw as FontType) : DEFAULT_FONT
}

function resolveFontScale(raw: unknown): FontScale {
  if (typeof raw !== 'string') return DEFAULT_FONT_SCALE
  return FONT_SCALES.includes(raw as FontScale)
    ? (raw as FontScale)
    : DEFAULT_FONT_SCALE
}

export async function getFont(): Promise<FontType> {
  const result = await chrome.storage.sync.get(FONT_KEY)
  return resolveFont(result[FONT_KEY])
}

export async function setFont(font: FontType): Promise<void> {
  await chrome.storage.sync.set({ [FONT_KEY]: font })
}

export const subscribeFont = createStorageSubscriber(
  'sync',
  FONT_KEY,
  resolveFont
)

export async function getFontScale(): Promise<FontScale> {
  const result = await chrome.storage.sync.get(FONT_SCALE_KEY)
  return resolveFontScale(result[FONT_SCALE_KEY])
}

export async function setFontScale(scale: FontScale): Promise<void> {
  await chrome.storage.sync.set({ [FONT_SCALE_KEY]: scale })
}

export const subscribeFontScale = createStorageSubscriber(
  'sync',
  FONT_SCALE_KEY,
  resolveFontScale
)
