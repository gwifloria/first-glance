/**
 * 环境音播放引擎
 * 使用 HTMLAudioElement 播放远程加载的音频
 */

import { loadSound } from './ambientSoundLoader'

export type AmbientSoundType =
  | 'rain'
  | 'rain-birds'
  | 'nature'
  | 'ocean'
  | 'stream'
  | 'campfire'
  | 'white-noise'

let currentAudio: HTMLAudioElement | null = null
let currentType: AmbientSoundType | null = null
let currentVolume = 0.5

export async function play(type: AmbientSoundType): Promise<boolean> {
  // 如果正在播放同一个，不重复创建
  if (currentType === type && currentAudio && !currentAudio.paused) {
    return true
  }

  stop()

  try {
    const blobUrl = await loadSound(type)
    const audio = new Audio(blobUrl)
    audio.loop = true
    audio.volume = currentVolume
    await audio.play()
    currentAudio = audio
    currentType = type
    return true
  } catch {
    return false
  }
}

export function stop(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  currentType = null
}

export function setVolume(volume: number): void {
  currentVolume = Math.max(0, Math.min(1, volume))
  if (currentAudio) {
    currentAudio.volume = currentVolume
  }
}

export function getPlaying(): AmbientSoundType | null {
  return currentType
}

export function getVolume(): number {
  return currentVolume
}

export function isPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused
}
