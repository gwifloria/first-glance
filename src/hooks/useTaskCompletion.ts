import { useState, useCallback } from 'react'
import type { Task } from '@/types'

export function useTaskCompletion(
  onComplete: (task: Task) => void | Promise<void>,
  options: { delay?: number; delayBefore?: boolean } = {}
) {
  const { delay = 300, delayBefore = true } = options
  const [completing, setCompleting] = useState(false)

  const handleComplete = useCallback(
    async (task: Task) => {
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
      }
    },
    [onComplete, delay, delayBefore]
  )

  return { completing, handleComplete }
}
