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
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPreviewTimer = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
  }, [])

  const stoppedRef = useRef(false)

  const play = useCallback(
    async (type: AmbientSoundType) => {
      restoredRef.current = true // 用户手动播放，跳过恢复逻辑
      clearPreviewTimer()
      stoppedRef.current = false
      setLoadingSound(type)
      ambientEngine.setVolume(state.volume / 100)
      const ok = await ambientEngine.play(type)
      setLoadingSound(null)

      // 加载期间用户已停止，不再继续
      if (stoppedRef.current || !ok) return

      setState((prev) => ({ ...prev, sound: type, playing: true }))

      // 非付费用户：15 秒试听后自动停止并弹出 Premium Modal
      if (!isPremium) {
        previewTimerRef.current = setTimeout(() => {
          previewTimerRef.current = null
          ambientEngine.stop()
          setState((prev) => ({ ...prev, sound: null, playing: false }))
          openPremiumModal()
        }, 15_000)
      }
    },
    [isPremium, openPremiumModal, state.volume, setState, clearPreviewTimer]
  )

  const stop = useCallback(() => {
    stoppedRef.current = true
    clearPreviewTimer()
    ambientEngine.stop()
    setState((prev) => ({ ...prev, sound: null, playing: false }))
  }, [setState, clearPreviewTimer])

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
