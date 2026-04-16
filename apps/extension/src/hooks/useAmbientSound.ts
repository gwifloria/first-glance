import { useCallback, useEffect, useRef, useState } from 'react'
import { usePersistedState } from './usePersistedState'
import { usePremium } from './usePremium'
import * as ambientEngine from '@/services/ambientSoundEngine'
import type { AmbientSoundType } from '@/services/ambientSoundEngine'

interface AmbientSoundState {
  sound: AmbientSoundType | null
  volume: number
  playing: boolean
}

const DEFAULT_STATE: AmbientSoundState = {
  sound: null,
  volume: 50,
  playing: false,
}

export function useAmbientSound() {
  const { isPremium, openPremiumModal } = usePremium()
  const [state, setState] = usePersistedState<AmbientSoundState>(
    'ambient_sound',
    DEFAULT_STATE
  )

  // 页面加载时恢复播放状态（等 usePersistedState 异步加载完成后触发一次）
  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    if (state.playing && state.sound && isPremium) {
      restoredRef.current = true
      ambientEngine.setVolume(state.volume / 100)
      ambientEngine.play(state.sound).then((ok) => {
        if (!ok) setState((prev) => ({ ...prev, playing: false }))
      })
    }
  }, [state.playing, state.sound, state.volume, isPremium, setState])

  const [loadingSound, setLoadingSound] = useState<AmbientSoundType | null>(
    null
  )

  const play = useCallback(
    async (type: AmbientSoundType) => {
      if (!isPremium) {
        openPremiumModal()
        return
      }
      setLoadingSound(type)
      ambientEngine.setVolume(state.volume / 100)
      const ok = await ambientEngine.play(type)
      setLoadingSound(null)
      setState((prev) => ({ ...prev, sound: type, playing: ok }))
    },
    [isPremium, openPremiumModal, state.volume, setState]
  )

  const stop = useCallback(() => {
    ambientEngine.stop()
    setState((prev) => ({ ...prev, sound: null, playing: false }))
  }, [setState])

  const toggle = useCallback(
    (type: AmbientSoundType) => {
      if (state.sound === type && state.playing) {
        stop()
      } else {
        play(type)
      }
    },
    [state.sound, state.playing, play, stop]
  )

  const setVolume = useCallback(
    (volume: number) => {
      ambientEngine.setVolume(volume / 100)
      setState((prev) => ({ ...prev, volume }))
    },
    [setState]
  )

  return {
    currentSound: state.sound,
    volume: state.volume,
    isPlaying: state.playing,
    loadingSound,
    play,
    stop,
    toggle,
    setVolume,
  }
}

export type { AmbientSoundType }
