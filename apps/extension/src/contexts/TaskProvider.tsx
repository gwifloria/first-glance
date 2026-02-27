/**
 * 任务数据 Provider
 * 统一管理任务数据，首次加载后不再自动刷新
 */
import { useEffect, useMemo, type ReactNode } from 'react'
import { useAppMode } from './useAppMode'
import { useTaskData } from '@/hooks/useTaskData'
import { useTaskViews } from '@/hooks/useTaskViews'
import { buildTaskMap } from '@/utils/taskMap'
import { TaskContext, type TaskContextValue } from './TaskContext'
import type { AdapterType } from '@/types'

export function TaskProvider({ children }: { children: ReactNode }) {
  const { isConnected, isGuest, currentProvider, disconnect } = useAppMode()

  // 根据连接状态和服务商确定适配器类型
  const adapterType: AdapterType = useMemo(() => {
    if (!isConnected || !currentProvider) {
      return 'local'
    }
    return currentProvider
  }, [isConnected, currentProvider])

  const { data: rawData, actions } = useTaskData(adapterType, disconnect)
  const data = useMemo(
    () => ({ ...rawData, taskMap: buildTaskMap(rawData.tasks) }),
    [rawData]
  )
  const { views: baseViews, filters } = useTaskViews(data.tasks)

  // 聚焦任务：guest 模式显示所有本地任务，connected 模式显示今日聚焦任务
  const focusTasks = useMemo(
    () => (isGuest ? data.tasks : baseViews.todayFocusTasks),
    [isGuest, data.tasks, baseViews.todayFocusTasks]
  )

  const views = useMemo(
    () => ({ ...baseViews, focusTasks }),
    [baseViews, focusTasks]
  )

  // 首次加载 或 adapterType 变化时刷新数据
  // actions.refresh 的依赖包含 adapter，当 adapterType 变化时会自动更新
  useEffect(() => {
    actions.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.refresh])

  // 使用 useMemo 包装 context value，避免每次渲染都创建新对象导致的全局重渲染
  const value = useMemo<TaskContextValue>(
    () => ({ data, actions, views, filters }),
    [data, actions, views, filters]
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}
