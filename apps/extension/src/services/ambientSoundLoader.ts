import * as cache from './ambientSoundCache'
import type { AmbientSoundType } from './ambientSoundEngine'

const CDN_BASE =
  'https://cdn.jsdelivr.net/gh/gwifloria/first-glance-assets@v1.0.0/sounds'

const ASSET_VERSION = 'v1.0.0'

const SOUND_FILES: Record<AmbientSoundType, string> = {
  rain: 'rain.m4a',
  'rain-birds': 'rain-birds.m4a',
  nature: 'nature.m4a',
  ocean: 'ocean.m4a',
  stream: 'stream.m4a',
  campfire: 'campfire.m4a',
  'white-noise': 'white-noise.m4a',
}

// 跟踪已创建的 Blob URL，避免重复创建
const blobUrlCache = new Map<string, string>()

/**
 * 加载音频，优先走 IndexedDB 缓存，未命中则从 CDN 拉取
 * 返回可直接用于 HTMLAudioElement.src 的 Blob URL
 */
export async function loadSound(type: AmbientSoundType): Promise<string> {
  // 已有 Blob URL 直接返回
  const existing = blobUrlCache.get(type)
  if (existing) return existing

  // 查 IndexedDB 缓存
  const cached = await cache.get(type)
  if (cached) {
    const url = URL.createObjectURL(cached)
    blobUrlCache.set(type, url)
    return url
  }

  // 从 CDN 拉取
  const fileName = SOUND_FILES[type]
  const response = await fetch(`${CDN_BASE}/${fileName}`)
  if (!response.ok) {
    throw new Error(`Failed to load sound: ${type} (${response.status})`)
  }

  const blob = await response.blob()

  // 存入 IndexedDB（不阻塞返回）
  cache.put(type, blob, ASSET_VERSION).catch(() => {})

  const url = URL.createObjectURL(blob)
  blobUrlCache.set(type, url)
  return url
}

/**
 * 预加载音频到缓存（不创建 Blob URL）
 */
export async function preload(type: AmbientSoundType): Promise<void> {
  const isCached = await cache.has(type, ASSET_VERSION)
  if (isCached) return

  const fileName = SOUND_FILES[type]
  const response = await fetch(`${CDN_BASE}/${fileName}`)
  if (!response.ok) return

  const blob = await response.blob()
  await cache.put(type, blob, ASSET_VERSION)
}
