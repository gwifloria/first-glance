/**
 * 长按确认按钮 - 按住一段时间后触发操作
 * 显示圆形进度环作为视觉反馈
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

const HOLD_DURATION_MS = 1500
const TICK_INTERVAL_MS = 50
const TOTAL_STEPS = HOLD_DURATION_MS / TICK_INTERVAL_MS

// SVG 圆环参数
const RING_SIZE = 24
const RING_RADIUS = 10
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface LongPressButtonProps {
  onConfirm: () => void
  icon: ReactNode
  label: string
  className?: string
}

export function LongPressButton({
  onConfirm,
  icon,
  label,
  className = '',
}: LongPressButtonProps) {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const progressRef = useRef(0)
  const onConfirmRef = useRef(onConfirm)

  // 同步 onConfirm ref + 组件卸载时清理 interval
  useEffect(() => {
    onConfirmRef.current = onConfirm
  }, [onConfirm])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    progressRef.current = 0
    setProgress(0)
  }, [])

  const handleStart = useCallback(() => {
    // 防止触摸设备 touch + mouse 双触发
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    progressRef.current = 0
    setProgress(0)

    intervalRef.current = window.setInterval(() => {
      progressRef.current++
      const p = progressRef.current
      setProgress(p)

      if (p >= TOTAL_STEPS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        progressRef.current = 0
        setProgress(0)
        onConfirmRef.current()
      }
    }, TICK_INTERVAL_MS)
  }, [])

  const isHolding = progress > 0
  const dashOffset =
    RING_CIRCUMFERENCE - (progress / TOTAL_STEPS) * RING_CIRCUMFERENCE

  return (
    <button
      type="button"
      onMouseDown={handleStart}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={handleStart}
      onTouchEnd={stop}
      onTouchCancel={stop}
      className={`relative inline-flex items-center gap-2 px-2 py-1 rounded text-sm bg-transparent border-none cursor-pointer select-none transition-colors ${className}`}
    >
      {/* 进度环覆盖在 icon 上 */}
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        {icon}
        {isHolding && (
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="absolute"
            style={{ top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-[50ms] linear"
            />
          </svg>
        )}
      </span>
      <span>{label}</span>
    </button>
  )
}
