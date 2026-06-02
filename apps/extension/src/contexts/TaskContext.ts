/**
 * 任务数据 Context
 * 统一管理任务数据，避免视图切换时重复请求
 */
import { createContext, useContext } from 'react'
import type { Task } from '@/types'
import type { TaskData, TaskActions } from '@/hooks/useTaskData'
import type { TaskViews, TaskFilters } from '@/hooks/useTaskViews'
import type { AdapterCapabilities } from '@/api/adapters/types'

export interface TaskContextValue {
  data: TaskData & { taskMap: Map<string, Task> }
  actions: TaskActions
  views: TaskViews & { focusTasks: Task[] }
  filters: TaskFilters
  /** 当前服务能力（按 adapter 声明，UI 据此显隐子任务/排序分组项） */
  capabilities: AdapterCapabilities
}

export const TaskContext = createContext<TaskContextValue | null>(null)

export function useTaskContext(): TaskContextValue {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider')
  }
  return context
}
