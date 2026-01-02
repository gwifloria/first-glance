export interface Task {
  id: string
  projectId: string
  title: string
  content?: string
  desc?: string
  isAllDay?: boolean
  startDate?: string
  dueDate?: string
  timeZone?: string
  reminders?: string[]
  repeatFlag?: string
  priority: number // 0: none, 1: low, 3: medium, 5: high
  status: number // 0: normal, 2: completed
  completedTime?: string
  sortOrder: number
  items?: ChecklistItem[]
  modifiedTime?: string
  createdTime?: string
  tags?: string[]
}

export interface ChecklistItem {
  id: string
  title: string
  status: number
  sortOrder: number
}

export interface Project {
  id: string
  name: string
  color?: string
  sortOrder: number
  closed?: boolean
  groupId?: string
  viewMode?: string
  permission?: string
  kind?: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  refresh_token?: string
  expires_at?: number
}

export interface ApiError {
  errorCode: string
  errorMessage: string
}

// Guest mode types
export type AppMode = 'guest' | 'connected'

export interface LocalTask {
  id: string
  title: string
  priority: number
  dueDate?: string
  status: number // 0: pending, 2: completed
  createdTime: string
  isLocal: true
}
