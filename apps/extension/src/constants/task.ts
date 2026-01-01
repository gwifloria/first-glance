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
 * 优先级配置（用于 UI 渲染）
 */
export const PRIORITY_CONFIG = {
  [TASK_PRIORITY.HIGH]: { label: '高', color: 'var(--priority-high)' },
  [TASK_PRIORITY.MEDIUM]: { label: '中', color: 'var(--priority-medium)' },
  [TASK_PRIORITY.LOW]: { label: '低', color: 'var(--priority-low)' },
  [TASK_PRIORITY.NONE]: { label: '无', color: 'var(--border)' },
} as const

/**
 * 获取优先级对应的颜色
 */
export function getPriorityColor(priority: number): string {
  if (priority >= TASK_PRIORITY.HIGH)
    return PRIORITY_CONFIG[TASK_PRIORITY.HIGH].color
  if (priority >= TASK_PRIORITY.MEDIUM)
    return PRIORITY_CONFIG[TASK_PRIORITY.MEDIUM].color
  if (priority >= TASK_PRIORITY.LOW)
    return PRIORITY_CONFIG[TASK_PRIORITY.LOW].color
  return PRIORITY_CONFIG[TASK_PRIORITY.NONE].color
}

/**
 * 获取优先级选项列表（用于表单选择）
 */
export const PRIORITY_OPTIONS = [
  {
    value: TASK_PRIORITY.NONE,
    label: '无',
    color: PRIORITY_CONFIG[TASK_PRIORITY.NONE].color,
  },
  {
    value: TASK_PRIORITY.LOW,
    label: '低',
    color: PRIORITY_CONFIG[TASK_PRIORITY.LOW].color,
  },
  {
    value: TASK_PRIORITY.MEDIUM,
    label: '中',
    color: PRIORITY_CONFIG[TASK_PRIORITY.MEDIUM].color,
  },
  {
    value: TASK_PRIORITY.HIGH,
    label: '高',
    color: PRIORITY_CONFIG[TASK_PRIORITY.HIGH].color,
  },
]
