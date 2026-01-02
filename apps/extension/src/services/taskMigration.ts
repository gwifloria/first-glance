import { api } from './api'
import { localTaskStorage } from './localTaskStorage'
import type { LocalTask } from '@/types'

export interface MigrationResult {
  success: number
  failed: number
  tasks: LocalTask[]
}

/**
 * Migrate local tasks to DidaList inbox
 * @returns Migration result with success/failed counts
 */
export async function migrateLocalTasksToDidaList(): Promise<MigrationResult> {
  const localTasks = await localTaskStorage.getPendingTasks()

  if (localTasks.length === 0) {
    return { success: 0, failed: 0, tasks: [] }
  }

  let success = 0
  let failed = 0
  const migratedTasks: LocalTask[] = []

  for (const task of localTasks) {
    try {
      await api.createTask({
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
      })
      // Mark as migrated by deleting locally
      await localTaskStorage.deleteTask(task.id)
      migratedTasks.push(task)
      success++
    } catch (err) {
      console.error(`Failed to migrate task: ${task.title}`, err)
      failed++
    }
  }

  return { success, failed, tasks: migratedTasks }
}

/**
 * Clear all local tasks without migrating
 */
export async function clearLocalTasks(): Promise<void> {
  await localTaskStorage.clearAll()
}
