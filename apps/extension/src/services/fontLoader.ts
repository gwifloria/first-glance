/**
 * 字体远程加载：通过 <link rel="stylesheet"> 把 CDN 上的字体 CSS 注入 head
 * 已加载的 URL 用 Set 缓存，避免重复注入
 */

import { FONT_OPTIONS } from '@/constants/fonts'

const loadedUrls = new Set<string>()
const LINK_ATTR = 'data-fg-font'

export function loadFontCss(urls: string[]): void {
  for (const url of urls) {
    if (loadedUrls.has(url)) continue
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.crossOrigin = 'anonymous'
    link.setAttribute(LINK_ATTR, '')
    document.head.appendChild(link)
    loadedUrls.add(url)
  }
}

/** 预加载所有字体的 CDN CSS，让选择器能即时按对应字体渲染预览 */
export function preloadAllFonts(): void {
  for (const option of FONT_OPTIONS) {
    if (option.cssUrls) loadFontCss(option.cssUrls)
  }
}
