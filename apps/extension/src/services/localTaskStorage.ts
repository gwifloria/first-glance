import type { LocalTask } from '@/types'
import { formatDateStr } from '@/utils/date'

const STORAGE_KEY = 'local_tasks'
const MAX_LOCAL_TASKS = 3

export const localTaskStorage = {
  async getTasks(): Promise<LocalTask[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return result[STORAGE_KEY] || []
  },

  async getPendingTasks(): Promise<LocalTask[]> {
    const tasks = await this.getTasks()
    return tasks.filter((t) => t.status === 0)
  },

  async addTask(
    task: Omit<LocalTask, 'id' | 'createdTime' | 'isLocal'>
  ): Promise<LocalTask | null> {
    const tasks = await this.getTasks()
    const pendingCount = tasks.filter((t) => t.status === 0).length

    if (pendingCount >= MAX_LOCAL_TASKS) {
      return null // Limit reached
    }

    const newTask: LocalTask = {
      ...task,
      id: crypto.randomUUID(),
      createdTime: new Date().toISOString(),
      isLocal: true,
    }

    await chrome.storage.local.set({
      [STORAGE_KEY]: [...tasks, newTask],
    })
    return newTask
  },

  async completeTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks()
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: 2 } : t
    )
    await chrome.storage.local.set({ [STORAGE_KEY]: updated })
  },

  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks()
    const filtered = tasks.filter((t) => t.id !== taskId)
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered })
  },

  async clearCompleted(): Promise<void> {
    const tasks = await this.getTasks()
    const pending = tasks.filter((t) => t.status === 0)
    await chrome.storage.local.set({ [STORAGE_KEY]: pending })
  },

  async getCount(): Promise<number> {
    const tasks = await this.getTasks()
    return tasks.filter((t) => t.status === 0).length
  },

  async canAddMore(): Promise<boolean> {
    const count = await this.getCount()
    return count < MAX_LOCAL_TASKS
  },

  async clearAll(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY)
  },

  // Create a task with default values for guest mode
  async createQuickTask(title: string): Promise<LocalTask | null> {
    const dueDate = formatDateStr(new Date()) + 'T00:00:00.000+0800'
    return this.addTask({
      title,
      priority: 5, // High priority for focus
      dueDate,
      status: 0,
    })
  },
}
