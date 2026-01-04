import { useState, useCallback, useRef } from 'react'
import type { Task, LocalTask } from '@/types'

type TaskType = Task | LocalTask

export function useTaskCompletion<T extends TaskType = Task>(
  onComplete: (task: T) => void | Promise<void>,
  options: { delay?: number; delayBefore?: boolean } = {}
) {
  const { delay = 300, delayBefore = true } = options
  const [completing, setCompleting] = useState(false)
  const pendingRef = useRef(false)

  const handleComplete = useCallback(
    async (task: T) => {
      // 防止重复点击
      if (pendingRef.current) return
      pendingRef.current = true
      setCompleting(true)

      try {
        if (delayBefore) {
          // 先等待动画延迟再调用 onComplete（用于 TaskItem）
          await new Promise((resolve) => setTimeout(resolve, delay))
          await onComplete(task)
        } else {
          // 先调用 onComplete 再等待（用于 FocusView）
          await onComplete(task)
        }
      } finally {
        setCompleting(false)
        pendingRef.current = false
      }
    },
    [onComplete, delay, delayBefore]
  )

  return { completing, handleComplete }
}
