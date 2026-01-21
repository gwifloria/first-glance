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
  // 2 stages: 0-50% (first 5s), 50-100% (last 5s)
  if (progress < 50) return { kaomoji: KAOMOJI.SUSPICIOUS, stageIndex: 0 }
  return { kaomoji: KAOMOJI.RESIGNED, stageIndex: 1 }
}

export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}
