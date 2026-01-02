import type { TFunction } from 'i18next'

/**
 * 任务状态常量
 */
export const TASK_STATUS = {
  NORMAL: 0,
  COMPLETED: 2,
} as const

/**
 * 任务优先级常量
 */
export const TASK_PRIORITY = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 3,
  HIGH: 5,
} as const

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]
export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY]

/**
 * 优先级颜色配置
 */
export const PRIORITY_COLORS = {
  [TASK_PRIORITY.HIGH]: 'var(--priority-high)',
  [TASK_PRIORITY.MEDIUM]: 'var(--priority-medium)',
  [TASK_PRIORITY.LOW]: 'var(--priority-low)',
  [TASK_PRIORITY.NONE]: 'var(--border)',
} as const

/**
 * 获取优先级对应的颜色
 */
export function getPriorityColor(priority: number): string {
  if (priority >= TASK_PRIORITY.HIGH) return PRIORITY_COLORS[TASK_PRIORITY.HIGH]
  if (priority >= TASK_PRIORITY.MEDIUM)
    return PRIORITY_COLORS[TASK_PRIORITY.MEDIUM]
  if (priority >= TASK_PRIORITY.LOW) return PRIORITY_COLORS[TASK_PRIORITY.LOW]
  return PRIORITY_COLORS[TASK_PRIORITY.NONE]
}

/**
 * 获取优先级选项列表（用于表单选择）
 */
export function getPriorityOptions(t: TFunction) {
  return [
    {
      value: TASK_PRIORITY.NONE,
      label: t('task:priority.none'),
      color: PRIORITY_COLORS[TASK_PRIORITY.NONE],
    },
    {
      value: TASK_PRIORITY.LOW,
      label: t('task:priority.low'),
      color: PRIORITY_COLORS[TASK_PRIORITY.LOW],
    },
    {
      value: TASK_PRIORITY.MEDIUM,
      label: t('task:priority.medium'),
      color: PRIORITY_COLORS[TASK_PRIORITY.MEDIUM],
    },
    {
      value: TASK_PRIORITY.HIGH,
      label: t('task:priority.high'),
      color: PRIORITY_COLORS[TASK_PRIORITY.HIGH],
    },
  ]
}
