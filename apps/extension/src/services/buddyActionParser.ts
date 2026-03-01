/**
 * AI Buddy 操作建议解析器
 * 从 AI 回复中提取 :::actions 区段，解析为可执行操作
 */
import type { Task } from '@/types'
import type { BuddyAction, PriorityLevel } from '@/types/buddy'

const ACTIONS_START = ':::actions'
const ACTIONS_END = ':::'

const VALID_PRIORITIES: PriorityLevel[] = ['high', 'medium', 'low', 'none']

/** 优先级英文关键词 → 内部数值 */
export const priorityToNumber: Record<PriorityLevel, number> = {
  high: 5,
  medium: 3,
  low: 1,
  none: 0,
}

/**
 * 模糊匹配任务标题
 * 优先精确匹配，其次包含匹配
 */
export function matchTaskByTitle(
  title: string,
  tasks: Task[]
): Task | undefined {
  const normalized = title.trim().toLowerCase()

  // 精确匹配
  const exact = tasks.find((t) => t.title.toLowerCase() === normalized)
  if (exact) return exact

  // 包含匹配：任务标题包含搜索词，或搜索词包含较长的任务标题（避免短标题误匹配）
  return tasks.find((t) => {
    const taskTitle = t.title.toLowerCase()
    return (
      taskTitle.includes(normalized) ||
      (taskTitle.length >= 4 && normalized.includes(taskTitle))
    )
  })
}

/**
 * 从 AI 回复中提取操作区段
 * 返回清理后的文本和解析出的操作列表
 */
export function extractActions(
  text: string,
  tasks: Task[]
): { cleanText: string; actions: BuddyAction[] } {
  const startIdx = text.indexOf(ACTIONS_START)
  if (startIdx === -1) {
    return { cleanText: text, actions: [] }
  }

  // 提取 actions 区段内容
  const afterStart = startIdx + ACTIONS_START.length
  const endIdx = text.indexOf(ACTIONS_END, afterStart)
  const actionsBlock =
    endIdx === -1 ? text.slice(afterStart) : text.slice(afterStart, endIdx)

  // 清理后的文本：移除 :::actions...:::，压缩连续空行
  const cleanText = (
    text.slice(0, startIdx) + (endIdx === -1 ? '' : text.slice(endIdx + 3))
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const actions: BuddyAction[] = []
  const lines = actionsBlock.split('\n').filter((l) => l.trim())

  // 用于合并同一父任务的子任务
  const subtaskMap = new Map<string, { taskId: string; titles: string[] }>()

  for (const line of lines) {
    const parts = line.trim().split('|')
    if (parts.length < 3) continue

    const [type, taskTitle, params] = parts.map((p) => p.trim())

    if (type === 'set_priority') {
      const priority = params.toLowerCase() as PriorityLevel
      if (!VALID_PRIORITIES.includes(priority)) continue

      const task = matchTaskByTitle(taskTitle, tasks)
      if (!task) continue

      actions.push({
        type: 'set_priority',
        taskId: task.id,
        taskTitle: task.title,
        priority,
      })
    } else if (type === 'add_subtask') {
      const task = matchTaskByTitle(taskTitle, tasks)
      if (!task) continue

      const subtitles = params
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (subtitles.length === 0) continue

      // 合并同一父任务
      const existing = subtaskMap.get(task.id)
      if (existing) {
        existing.titles.push(...subtitles)
      } else {
        subtaskMap.set(task.id, { taskId: task.id, titles: subtitles })
        // 先占位，后面统一更新
        actions.push({
          type: 'add_subtasks',
          taskId: task.id,
          taskTitle: task.title,
          subtitles, // 会被下面的合并逻辑更新
        })
      }
    }
  }

  // 合并子任务：更新 actions 中已有的 add_subtasks
  for (const action of actions) {
    if (action.type === 'add_subtasks') {
      const merged = subtaskMap.get(action.taskId)
      if (merged) {
        action.subtitles = merged.titles
      }
    }
  }

  return { cleanText, actions }
}
