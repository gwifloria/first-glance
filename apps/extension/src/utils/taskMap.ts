import type { Task } from '@/types'

/** 用 task id 索引的 Map，用于高效查找父任务 */
export function buildTaskMap(tasks: Task[]): Map<string, Task> {
  return new Map(tasks.map((t) => [t.id, t]))
}

/** 获取父任务标题（如果有） */
export function getParentTitle(
  task: Task,
  taskMap: Map<string, Task>
): string | undefined {
  if (!task.parentId) return undefined
  return taskMap.get(task.parentId)?.title
}
