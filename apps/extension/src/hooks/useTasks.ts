import { useTaskData } from './useTaskData'
import { useTaskViews } from './useTaskViews'
import type {
  SortOption,
  GroupOption,
  TaskGroup,
  TaskCounts,
} from './useTaskViews'

export type { SortOption, GroupOption, TaskGroup, TaskCounts }

/**
 * 任务管理主 Hook
 * 组合 useTaskData 和 useTaskViews
 */
export function useTasks(isLoggedIn: boolean) {
  const data = useTaskData(isLoggedIn)
  const views = useTaskViews(data.tasks, data.projects)

  return {
    ...data,
    ...views,
  }
}
