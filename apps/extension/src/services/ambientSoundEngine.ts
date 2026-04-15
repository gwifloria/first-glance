/**
 * 环境音播放引擎
 * 使用 HTMLAudioElement 播放循环 MP3 文件
 */

export type AmbientSoundType =
  | 'rain'
  | 'rain-birds'
  | 'nature'
  | 'ocean'
  | 'stream'
  | 'campfire'
  | 'white-noise'

const SOUND_FILES: Record<AmbientSoundType, string> = {
  rain: '/sounds/rain.m4a',
  'rain-birds': '/sounds/rain-birds.m4a',
  nature: '/sounds/nature.m4a',
  ocean: '/sounds/ocean.m4a',
  stream: '/sounds/stream.m4a',
  campfire: '/sounds/campfire.m4a',
  'white-noise': '/sounds/white-noise.m4a',
}

let currentAudio: HTMLAudioElement | null = null
let currentType: AmbientSoundType | null = null
let currentVolume = 0.5

function getAudioUrl(type: AmbientSoundType): string {
  return chrome.runtime.getURL(SOUND_FILES[type])
}

export async function play(type: AmbientSoundType): Promise<boolean> {
  // 如果正在播放同一个，不重复创建
  if (currentType === type && currentAudio && !currentAudio.paused) {
    return true
  }

  stop()

  const audio = new Audio(getAudioUrl(type))
  audio.loop = true
  audio.volume = currentVolume

  try {
    await audio.play()
    currentAudio = audio
    currentType = type
    return true
  } catch {
    // Chrome autoplay policy: 需要用户交互后才能播放
    audio.src = ''
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
