import type { Task } from '@/types'
import type { Project } from '@/types'

export function makeTask(overrides?: Partial<Task>): Task {
  return {
    id: '1',
    projectId: 'proj-1',
    title: 'Test Task',
    priority: 0,
    status: 0,
    sortOrder: 0,
    createdTime: '2026-01-01T00:00:00Z',
    tags: [],
    isAllDay: true,
    ...overrides,
  }
}

export function makeProject(overrides?: Partial<Project>): Project {
  return {
    id: 'proj-1',
    name: 'Test Project',
    sortOrder: 0,
    ...overrides,
  }
}
