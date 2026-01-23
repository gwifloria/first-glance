import { CHILL_MODE_HOLD_STEPS } from '@/constants'

export const KAOMOJI = {
  STERN: '( ￣^￣ )',
  SHY: '( ///_/// )',
  SUSPICIOUS: '( ¬_¬ )',
  PANIC: '( >_< )',
  CRYING: '( T_T )',
  RESIGNED: '( ;_; )',
  SLEEPING: '( -_- )zzZ',
}

export function getChillStage(progress: number): {
  kaomoji: string
  stageIndex: number
} {
  // 4 stages: ~2.5s each (progress 0-100 for 10s total)
  const stageSize = CHILL_MODE_HOLD_STEPS / 4
  if (progress < stageSize)
    return { kaomoji: KAOMOJI.SUSPICIOUS, stageIndex: 0 }
  if (progress < stageSize * 2) return { kaomoji: KAOMOJI.PANIC, stageIndex: 1 }
  if (progress < stageSize * 3)
    return { kaomoji: KAOMOJI.CRYING, stageIndex: 2 }
  return { kaomoji: KAOMOJI.RESIGNED, stageIndex: 3 }
}
