import type { AmbientSoundType } from '@/services/ambientSoundEngine'

export interface AmbientSoundMeta {
  type: AmbientSoundType
  labelKey: string
  icon: string
}

export const AMBIENT_SOUNDS: AmbientSoundMeta[] = [
  { type: 'rain', labelKey: 'ambient.rain', icon: '🌧️' },
  { type: 'rain-birds', labelKey: 'ambient.rainBirds', icon: '🐦' },
  { type: 'nature', labelKey: 'ambient.nature', icon: '🌿' },
  { type: 'ocean', labelKey: 'ambient.ocean', icon: '🌊' },
  { type: 'stream', labelKey: 'ambient.stream', icon: '💧' },
  { type: 'campfire', labelKey: 'ambient.campfire', icon: '🔥' },
  { type: 'white-noise', labelKey: 'ambient.whiteNoise', icon: '📡' },
]
