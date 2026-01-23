/**
 * Chill Mode 相关常量
 */

/** Chill Mode 持续时间 (15 分钟) */
export const CHILL_MODE_DURATION_MS = 15 * 60 * 1000

/** 长按总时间 (10 秒) */
export const CHILL_MODE_HOLD_TOTAL_MS = 10 * 1000

/** 长按更新间隔 (100ms) */
export const CHILL_MODE_HOLD_INTERVAL_MS = 100

/** 长按进度步数 (100 步) */
export const CHILL_MODE_HOLD_STEPS =
  CHILL_MODE_HOLD_TOTAL_MS / CHILL_MODE_HOLD_INTERVAL_MS
