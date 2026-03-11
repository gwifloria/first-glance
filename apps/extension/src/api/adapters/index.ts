// Types
export type {
  ITaskAdapter,
  CreateTaskInput,
  UpdateTaskInput,
  GetAllTasksResult,
  AdapterType,
  AdapterConfig,
} from './types'

// Adapters
export { DidaListAdapter, didaListAdapter } from './dida'
export { TickTickAdapter, tickTickAdapter } from './ticktick'
export { LocalAdapter, localAdapter } from './LocalAdapter'

// Factory
export { createTaskAdapter, getDefaultAdapter } from './factory'
