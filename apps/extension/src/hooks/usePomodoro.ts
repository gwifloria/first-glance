/**
 * 番茄时钟 Hook - 支持多 Tab 同步
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { storage, type PomodoroStorage } from '@/services/storage'
import { playNotificationSound } from '@/services/soundEngine'
import { recordFocusSession } from '@/services/focusStats'
import { getSettings } from '@/services/settingsStorage'

export type PomodoroMode = 'idle' | 'work' | 'break'

export interface PomodoroConfig {
  workDuration: number // 工作时长（分钟）
  breakDuration: number // 休息时长（分钟）
}

export interface PomodoroState {
  mode: PomodoroMode
  timeLeft: number // 剩余秒数（计算得出）
  totalDuration: number // 当前阶段总秒数
  isRunning: boolean
  completedCount: number // 完成的番茄数
  currentTaskId: string | null // 当前绑定的任务 ID
}

export interface PomodoroActions {
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  skip: () => void
  startWithTask: (taskId: string) => void
  bindTask: (taskId: string) => void
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workDuration: 25,
  breakDuration: 5,
}

// 获取指定模式的总时长（秒）
function getDurationSeconds(
  mode: PomodoroMode,
  config: PomodoroConfig
): number {
  if (mode === 'work') return config.workDuration * 60
  if (mode === 'break') return config.breakDuration * 60
  return config.workDuration * 60 // idle 默认返回工作时长
}

// 计算剩余时间
function calculateTimeLeft(stored: PomodoroStorage): number {
  const duration = getDurationSeconds(stored.mode, stored.config)

  if (stored.mode === 'idle') {
    return duration
  }

  if (!stored.isRunning) {
    return stored.pausedTimeLeft ?? duration
  }

  // 防御性检查：startTime 应该在 isRunning 时存在
  if (!stored.startTime) {
    console.warn('[Pomodoro] isRunning=true 但 startTime 为空，返回完整时长')
    return duration
  }

  const elapsed = Math.floor((Date.now() - stored.startTime) / 1000)
  return Math.max(0, duration - elapsed)
}

/** 记录专注会话时，按 taskId 取当时任务的标题/优先级用于快照 */
export type TaskMetaResolver = (
  taskId: string
) => { title: string; priority: number } | null

export function usePomodoro(
  config?: Partial<PomodoroConfig>,
  getTaskMeta?: TaskMetaResolver,
  /**
   * work 阶段结束（自然到点或手动 skip）且有绑定任务时触发，用于弹「任务完成?」确认。
   * 自然到点走 switchToNextPhase 的 shouldNotify 去重分支，多 Tab 只有赢家触发；
   * skip 是单 Tab 用户动作，仅执行的那个 Tab 触发——都保证一次会话只弹一次。
   */
  onWorkSessionComplete?: (taskId: string) => void
): PomodoroState & PomodoroActions {
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config?.workDuration, config?.breakDuration]
  )
  const intervalRef = useRef<number | null>(null)
  const storageRef = useRef<PomodoroStorage | null>(null)
  const switchToNextPhaseRef = useRef<(() => Promise<void>) | null>(null)
  const taskMetaRef = useRef<TaskMetaResolver | undefined>(getTaskMeta)
  const onWorkCompleteRef = useRef<((taskId: string) => void) | undefined>(
    onWorkSessionComplete
  )

  useEffect(() => {
    taskMetaRef.current = getTaskMeta
  }, [getTaskMeta])

  useEffect(() => {
    onWorkCompleteRef.current = onWorkSessionComplete
  }, [onWorkSessionComplete])

  const [state, setState] = useState<PomodoroState>({
    mode: 'idle',
    timeLeft: mergedConfig.workDuration * 60,
    totalDuration: mergedConfig.workDuration * 60,
    isRunning: false,
    completedCount: 0,
    currentTaskId: null,
  })

  // 从存储状态更新本地状态
  const updateFromStorage = useCallback(
    (stored: PomodoroStorage | null) => {
      if (!stored) {
        setState({
          mode: 'idle',
          timeLeft: mergedConfig.workDuration * 60,
          totalDuration: mergedConfig.workDuration * 60,
          isRunning: false,
          completedCount: 0,
          currentTaskId: null,
        })
        storageRef.current = null
        return
      }

      storageRef.current = stored
      setState({
        mode: stored.mode,
        timeLeft: calculateTimeLeft(stored),
        totalDuration: getDurationSeconds(stored.mode, stored.config),
        isRunning: stored.isRunning,
        completedCount: stored.completedCount,
        currentTaskId: stored.currentTaskId ?? null,
      })
    },
    [mergedConfig.workDuration]
  )

  // 切换到下一阶段（不自动开始，等待用户手动触发）
  const switchToNextPhase = useCallback(async () => {
    const stored = storageRef.current
    if (!stored) return

    const now = Date.now()
    const nextMode = stored.mode === 'work' ? 'break' : 'work'
    const nextDuration = getDurationSeconds(nextMode, stored.config)

    // 防止多 tab 重复：5 秒内只有一个 tab 处理提示音和统计
    const shouldNotify =
      !stored.lastNotificationTime || now - stored.lastNotificationTime > 5000
    if (shouldNotify) {
      getSettings().then((settings) => {
        playNotificationSound(settings.notificationSound)
      })

      // work 结束时记录专注数据（与提示音共用去重逻辑）
      if (stored.mode === 'work') {
        const meta = stored.currentTaskId
          ? taskMetaRef.current?.(stored.currentTaskId)
          : null
        recordFocusSession({
          timestamp: now,
          duration: stored.config.workDuration,
          taskId: stored.currentTaskId,
          taskTitle: meta?.title ?? null,
          priority: meta?.priority ?? null,
        })
        // 弹「任务完成?」确认：放在 shouldNotify 去重分支内，多 Tab 只弹一次
        if (stored.currentTaskId) {
          onWorkCompleteRef.current?.(stored.currentTaskId)
        }
      }
    }

    const newStored: PomodoroStorage = {
      ...stored,
      mode: nextMode,
      isRunning: false, // 不自动开始，等待用户手动触发
      startTime: null,
      pausedTimeLeft: nextDuration, // 设置为下一阶段的完整时长
      completedCount:
        stored.mode === 'work'
          ? stored.completedCount + 1
          : stored.completedCount,
      lastNotificationTime: now,
      // work→break 时保留 currentTaskId；break→work 时清空
      currentTaskId: stored.mode === 'work' ? stored.currentTaskId : null,
    }

    await storage.setPomodoro(newStored)
  }, [])

  // 保持 ref 与最新函数同步
  useEffect(() => {
    switchToNextPhaseRef.current = switchToNextPhase
  }, [switchToNextPhase])

  // 初始化和监听 storage 变化
  useEffect(() => {
    // 加载初始状态
    storage.getPomodoro().then(updateFromStorage)

    // 监听 storage 变化
    const unsubscribe = storage.onPomodoroChange(updateFromStorage)

    return unsubscribe
  }, [updateFromStorage])

  // 定时器：每秒更新 timeLeft 并检查是否需要切换阶段
  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      const stored = storageRef.current
      if (!stored || !stored.isRunning) return

      const timeLeft = calculateTimeLeft(stored)

      if (timeLeft <= 0) {
        // 立即清除定时器，防止 async switchToNextPhase 完成前重复调用
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        switchToNextPhaseRef.current?.()
      } else {
        setState((prev) => ({ ...prev, timeLeft }))
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isRunning])

  // 开始工作
  const start = useCallback(async () => {
    const newStored: PomodoroStorage = {
      mode: 'work',
      isRunning: true,
      completedCount: storageRef.current?.completedCount ?? 0,
      startTime: Date.now(),
      pausedTimeLeft: null,
      lastNotificationTime: null,
      currentTaskId: null,
      config: mergedConfig,
    }
    await storage.setPomodoro(newStored)
  }, [mergedConfig])

  // 绑定任务并开始工作
  const startWithTask = useCallback(
    async (taskId: string) => {
      const newStored: PomodoroStorage = {
        mode: 'work',
        isRunning: true,
        completedCount: storageRef.current?.completedCount ?? 0,
        startTime: Date.now(),
        pausedTimeLeft: null,
        lastNotificationTime: null,
        currentTaskId: taskId,
        config: mergedConfig,
      }
      await storage.setPomodoro(newStored)
    },
    [mergedConfig]
  )

  // 暂停
  const pause = useCallback(async () => {
    const stored = storageRef.current
    if (!stored || !stored.isRunning) return

    const timeLeft = calculateTimeLeft(stored)
    const newStored: PomodoroStorage = {
      ...stored,
      isRunning: false,
      pausedTimeLeft: timeLeft,
      startTime: null,
    }
    await storage.setPomodoro(newStored)
  }, [])

  // 继续
  const resume = useCallback(async () => {
    const stored = storageRef.current
    if (!stored || stored.isRunning || stored.mode === 'idle') return

    // 计算新的 startTime，使得 timeLeft = pausedTimeLeft
    const duration = getDurationSeconds(stored.mode, stored.config)
    const elapsed = duration - (stored.pausedTimeLeft ?? duration)

    const newStored: PomodoroStorage = {
      ...stored,
      isRunning: true,
      startTime: Date.now() - elapsed * 1000,
    }

    await storage.setPomodoro(newStored)
  }, [])

  // 结束番茄钟，回到 idle（已完成的番茄数已记录到 focusStats，不受影响）
  const reset = useCallback(async () => {
    await storage.clearPomodoro()
  }, [])

  // 跳过当前阶段
  const skip = useCallback(async () => {
    const stored = storageRef.current
    if (!stored || stored.mode === 'idle') return

    // 手动跳过 work 且有绑定任务时，同样弹完成确认（仅当前 Tab 触发，天然单次）
    if (stored.mode === 'work' && stored.currentTaskId) {
      onWorkCompleteRef.current?.(stored.currentTaskId)
    }

    const newStored: PomodoroStorage = {
      ...stored,
      mode: stored.mode === 'work' ? 'break' : 'work',
      isRunning: true,
      startTime: Date.now(),
      pausedTimeLeft: null,
      completedCount:
        stored.mode === 'work'
          ? stored.completedCount + 1
          : stored.completedCount,
      // work→break 保留 currentTaskId；break→work 清空
      currentTaskId: stored.mode === 'work' ? stored.currentTaskId : null,
    }
    await storage.setPomodoro(newStored)
  }, [])

  // 运行中绑定任务（不重置计时）
  const bindTask = useCallback(async (taskId: string) => {
    const stored = storageRef.current
    if (!stored || stored.mode === 'idle') return
    await storage.setPomodoro({ ...stored, currentTaskId: taskId })
  }, [])

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    skip,
    startWithTask,
    bindTask,
  }
}

/**
 * 格式化时间为 MM:SS
 */
export function formatPomodoroTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
