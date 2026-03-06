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

/** 创建带泛音的丰富音色 */
function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(0, startTime)
  // 快速起音
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  // 柔和衰减
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/** 清脆铃声 - 双音上行，明亮有成就感 */
function playBell(ctx: AudioContext) {
  const now = ctx.currentTime
  // 第一声：A5 基音 + 泛音层
  playTone(ctx, 880, now, 0.8, 0.2)
  playTone(ctx, 1760, now, 0.6, 0.08) // 八度泛音
  playTone(ctx, 2640, now, 0.4, 0.04) // 五度泛音，增加光泽

  // 第二声：升高到 C#6，形成上行大三度 → 成就感
  playTone(ctx, 1108.7, now + 0.2, 1.0, 0.22)
  playTone(ctx, 2217.5, now + 0.2, 0.7, 0.09)
  playTone(ctx, 3326.2, now + 0.2, 0.5, 0.04)
}

/** 木鱼 - 温暖的敲击音，带共鸣 */
function playWood(ctx: AudioContext) {
  const now = ctx.currentTime

  // 主体：快速下滑的三角波，模拟木质敲击
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(800, now)
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.08)
  gain.gain.setValueAtTime(0.35, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.35)

  // 共鸣泛音：正弦波增加木质温暖感
  const res = ctx.createOscillator()
  const resGain = ctx.createGain()
  res.type = 'sine'
  res.frequency.setValueAtTime(420, now)
  resGain.gain.setValueAtTime(0.12, now)
  resGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
  res.connect(resGain).connect(ctx.destination)
  res.start(now)
  res.stop(now + 0.5)

  // 第二击（稍轻），形成节奏感
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(900, now + 0.18)
  osc2.frequency.exponentialRampToValueAtTime(320, now + 0.26)
  gain2.gain.setValueAtTime(0.25, now + 0.18)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(now + 0.18)
  osc2.stop(now + 0.5)
}

/** 叮咚 - 上行琶音 + 最终和弦，胜利小 fanfare */
function playChime(ctx: AudioContext) {
  const now = ctx.currentTime
  // C5 → E5 → G5 → C6 上行琶音
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => {
    const t = now + i * 0.12
    const isLast = i === notes.length - 1
    const dur = isLast ? 1.2 : 0.6
    const vol = isLast ? 0.22 : 0.15
    // 基音
    playTone(ctx, freq, t, dur, vol)
    // 高八度泛音增加闪亮感
    playTone(ctx, freq * 2, t, dur * 0.6, vol * 0.3)
  })

  // 最后叠加 C6+E6 大三和弦，形成圆满结束感
  const chordTime = now + notes.length * 0.12
  playTone(ctx, 1046.5, chordTime, 1.2, 0.12) // C6
  playTone(ctx, 1318.5, chordTime, 1.2, 0.1) // E6
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
