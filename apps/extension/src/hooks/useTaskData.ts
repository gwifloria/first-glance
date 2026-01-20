import { useState, useCallback, useMemo, useRef } from 'react'
import { createTaskAdapter, type AdapterType } from '@/api/adapters'
import { storage } from '@/services/storage'
import type { Task, Project } from '@/types'

export interface TaskData {
  tasks: Task[]
  projects: Project[]
  loading: boolean
  error: string | null
}

export interface TaskActions {
  refresh: () => Promise<void>
  refreshInbox: () => Promise<void>
  completeTask: (task: Task) => Promise<void>
  deleteTask: (task: Task) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  createTask: (task: Partial<Task>) => Promise<Task>
}

/**
 * 任务数据管理 Hook
 * 负责：原始数据获取、缓存、CRUD 操作
 * 通过 adapter 支持多种后端（滴答清单、本地存储等）
 */
export function useTaskData(adapterType: AdapterType) {
  const adapter = useMemo(() => createTaskAdapter(adapterType), [adapterType])
  const isLocal = adapterType === 'local'

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true) // 默认 loading，等待首次加载
  const [error, setError] = useState<string | null>(null)

  // 防止并发刷新导致竞态条件
  const refreshingRef = useRef(false)
  const refreshInboxRef = useRef(false)

  // ============ 数据获取 ============

  const refresh = useCallback(async () => {
    // 防止并发刷新
    if (refreshingRef.current) return
    refreshingRef.current = true

    setLoading(true)
    setError(null)

    try {
      const data = await adapter.getAllTasks()
      setTasks(data.tasks)
      setProjects(data.projects)
    } catch (err) {
      // 远程模式尝试使用缓存（需要检查缓存有效期）
      if (!isLocal) {
        const isCacheValid = await storage.isCacheValid()
        if (isCacheValid) {
          const cachedTasks = await storage.getCachedTasks<Task[]>()
          const cachedProjects = await storage.getCachedProjects<Project[]>()
          if (cachedTasks) setTasks(cachedTasks)
          if (cachedProjects) setProjects(cachedProjects)
          console.warn('[useTaskData] 使用缓存数据（网络请求失败）')
        } else {
          setError(err instanceof Error ? err.message : '获取任务失败')
        }
      } else {
        setError(err instanceof Error ? err.message : '获取任务失败')
      }
    } finally {
      setLoading(false)
      refreshingRef.current = false
    }
  }, [adapter, isLocal])

  // 只刷新收集箱任务（用于快速更新）
  const refreshInbox = useCallback(async () => {
    // 防止并发刷新
    if (refreshInboxRef.current) return
    refreshInboxRef.current = true

    try {
      const inboxTasks = await adapter.getInboxTasks()
      setTasks((prev) => {
        // 本地模式：所有任务都是收集箱任务
        if (isLocal) return inboxTasks
        // 远程模式：合并非收集箱任务
        const nonInboxTasks = prev.filter(
          (t) =>
            !t.projectId.startsWith('inbox') && t.projectId !== 'local-inbox'
        )
        return [...nonInboxTasks, ...inboxTasks]
      })
    } catch (err) {
      console.error('[useTaskData] 刷新收集箱失败:', err)
    } finally {
      refreshInboxRef.current = false
    }
  }, [adapter, isLocal])

  // 注意：不再自动刷新，由 TaskProvider 控制首次加载
  // 组件可以通过 actions.refresh() 手动刷新

  // ============ 操作 ============

  const completeTask = useCallback(
    async (task: Task) => {
      try {
        await adapter.completeTask(task)
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : '完成任务失败')
        await refresh()
      }
    },
    [adapter, refresh]
  )

  const deleteTask = useCallback(
    async (task: Task) => {
      try {
        await adapter.deleteTask(task)
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除任务失败')
        await refresh()
      }
    },
    [adapter, refresh]
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        const updated = await adapter.updateTask(taskId, updates)
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新任务失败')
        await refresh()
      }
    },
    [adapter, refresh]
  )

  const createTask = useCallback(
    async (task: Partial<Task>) => {
      try {
        const created = await adapter.createTask({
          title: task.title || '',
          projectId: task.projectId,
          content: task.content,
          priority: task.priority,
          dueDate: task.dueDate,
        })
        setTasks((prev) => [...prev, created])
        return created
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建任务失败')
        throw err
      }
    },
    [adapter]
  )

  // 结构化返回
  const data: TaskData = { tasks, projects, loading, error }

  const actions: TaskActions = {
    refresh,
    refreshInbox,
    completeTask,
    deleteTask,
    updateTask,
    createTask,
  }

  return { data, actions }
}
