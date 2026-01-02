import { useState, useEffect, useCallback } from 'react'
import { localTaskStorage } from '@/services/localTaskStorage'
import type { LocalTask } from '@/types'

const MAX_LOCAL_TASKS = 3

export function useLocalTasks() {
  const [tasks, setTasks] = useState<LocalTask[]>([])
  const [loading, setLoading] = useState(true)

  // Load tasks on mount
  const refresh = useCallback(async () => {
    const pendingTasks = await localTaskStorage.getPendingTasks()
    setTasks(pendingTasks)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createTask = useCallback(
    async (title: string): Promise<LocalTask | null> => {
      const newTask = await localTaskStorage.createQuickTask(title)
      if (newTask) {
        setTasks((prev) => [...prev, newTask])
      }
      return newTask
    },
    []
  )

  const completeTask = useCallback(async (task: LocalTask): Promise<void> => {
    await localTaskStorage.completeTask(task.id)
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
  }, [])

  const deleteTask = useCallback(async (task: LocalTask): Promise<void> => {
    await localTaskStorage.deleteTask(task.id)
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
  }, [])

  const clearAll = useCallback(async (): Promise<void> => {
    await localTaskStorage.clearAll()
    setTasks([])
  }, [])

  return {
    tasks,
    loading,
    createTask,
    completeTask,
    deleteTask,
    clearAll,
    refresh,
    canAddMore: tasks.length < MAX_LOCAL_TASKS,
    count: tasks.length,
    maxTasks: MAX_LOCAL_TASKS,
  }
}
