import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import { storage } from '@/services/storage'
import type { Task, Project } from '@/types'

/**
 * 任务数据管理 Hook
 * 负责：原始数据获取、缓存、CRUD 操作
 */
export function useTaskData(isLoggedIn: boolean) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============ 数据获取 ============

  const refresh = useCallback(async () => {
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

  // 当登录状态变化时自动刷新数据
  useEffect(() => {
    if (isLoggedIn) {
      refresh()
    }
  }, [isLoggedIn, refresh])

  // 只刷新收集箱任务（用于快速更新）
  const refreshInbox = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      const inboxTasks = await api.getInboxTasks()
      setTasks((prev) => {
        const nonInboxTasks = prev.filter(
          (t) => !t.projectId.startsWith('inbox')
        )
        return [...nonInboxTasks, ...inboxTasks]
      })
    } catch (err) {
      console.error('刷新收集箱失败:', err)
    }
  }, [isLoggedIn])

  useEffect(() => {
    refresh()
  }, [refresh])

  // ============ 操作 ============

  const completeTask = useCallback(
    async (task: Task) => {
      try {
        await api.completeTask(task.projectId, task.id)
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : '完成任务失败')
        await refresh()
      }
    },
    [refresh]
  )

  const deleteTask = useCallback(
    async (task: Task) => {
      try {
        await api.deleteTask(task.projectId, task.id)
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除任务失败')
        await refresh()
      }
    },
    [refresh]
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        const updated = await api.updateTask(taskId, updates)
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新任务失败')
        await refresh()
      }
    },
    [refresh]
  )

  const createTask = useCallback(
    async (task: Partial<Task>) => {
      try {
        const created = await api.createTask(task)
        await refresh()
        return created
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建任务失败')
        throw err
      }
    },
    [refresh]
  )

  const createInboxTask = useCallback(
    async (task: Partial<Task>) => {
      try {
        const created = await api.createTask(task)
        await refreshInbox()
        return created
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建任务失败')
        throw err
      }
    },
    [refreshInbox]
  )

  return {
    // 原始数据
    tasks,
    projects,
    loading,
    error,

    // 数据操作
    refresh,
    refreshInbox,
    completeTask,
    deleteTask,
    updateTask,
    createTask,
    createInboxTask,
  }
}
