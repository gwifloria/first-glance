/**
 * 音频引擎 - 使用 Web Audio API 合成提示音
 * 不依赖外部音频文件，保持扩展轻量
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  // Safari / Chrome policy: resume if suspended
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export type NotificationSound = 'bell' | 'wood' | 'chime' | 'none'

/** 清脆铃声 */
function playBell(ctx: AudioContext) {
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.6)

  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)

  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.8)

  // 第二声（双击铃）
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(880, now + 0.15)
  osc2.frequency.exponentialRampToValueAtTime(440, now + 0.75)
  gain2.gain.setValueAtTime(0.25, now + 0.15)
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.95)
  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(now + 0.15)
  osc2.stop(now + 0.95)
}

/** 木鱼 */
function playWood(ctx: AudioContext) {
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(600, now)
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.15)

  gain.gain.setValueAtTime(0.4, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.25)
}

/** 轻柔叮咚 */
function playChime(ctx: AudioContext) {
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5
  notes.forEach((freq, i) => {
    const delay = i * 0.2
    const now = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)

    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.8)
  })
}

export function playNotificationSound(sound: NotificationSound): void {
  if (sound === 'none') return
  try {
    const ctx = getAudioContext()
    const players: Record<string, (ctx: AudioContext) => void> = {
      bell: playBell,
      wood: playWood,
      chime: playChime,
    }
    players[sound]?.(ctx)
  } catch {
    // 静默失败，不影响主流程
  }
}
