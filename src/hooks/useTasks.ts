import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import { storage } from '@/services/storage'
import type { Task, Project } from '@/types'

export function useTasks(isLoggedIn: boolean) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!isLoggedIn) return

    setLoading(true)
    setError(null)

    try {
      const data = await api.getAllTasks()
      setTasks(data.tasks)
      setProjects(data.projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务失败')
      // 尝试使用缓存
      const cachedTasks = await storage.getCachedTasks<Task[]>()
      const cachedProjects = await storage.getCachedProjects<Project[]>()
      if (cachedTasks) setTasks(cachedTasks)
      if (cachedProjects) setProjects(cachedProjects)
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const completeTask = useCallback(async (task: Task) => {
    try {
      await api.completeTask(task.projectId, task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '完成任务失败')
    }
  }, [])

  const deleteTask = useCallback(async (task: Task) => {
    try {
      await api.deleteTask(task.projectId, task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除任务失败')
    }
  }, [])

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        const updated = await api.updateTask(taskId, updates)
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新任务失败')
      }
    },
    []
  )

  const createTask = useCallback(async (task: Partial<Task>) => {
    try {
      const created = await api.createTask(task)
      // 合并：优先用 API 返回值，但保留我们设置的 dueDate 和 priority（如果 API 没返回）
      const mergedTask = {
        ...task,
        ...created,
        dueDate: created.dueDate || task.dueDate,
        priority: created.priority ?? task.priority,
      } as Task
      setTasks((prev) => [...prev, mergedTask])
      return mergedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败')
      throw err
    }
  }, [])

  return {
    tasks,
    projects,
    loading,
    error,
    refresh: fetchTasks,
    completeTask,
    deleteTask,
    updateTask,
    createTask,
  }
}
