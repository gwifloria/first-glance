/**
 * 适配器工厂
 */
import { DidaListAdapter } from './dida'
import { TodoistAdapter } from './todoist'
import { LocalAdapter } from './LocalAdapter'
import type { ITaskAdapter, AdapterType } from './types'

/** 适配器实例缓存 */
const adapterCache = new Map<AdapterType, ITaskAdapter>()

/**
 * 创建任务适配器
 */
export function createTaskAdapter(type: AdapterType): ITaskAdapter {
  // 检查缓存
  const cached = adapterCache.get(type)
  if (cached) return cached

  let adapter: ITaskAdapter

  switch (type) {
    case 'didaList':
      adapter = new DidaListAdapter()
      break
    case 'todoist':
      adapter = new TodoistAdapter()
      break
    case 'local':
      adapter = new LocalAdapter()
      break
    case 'notion':
      throw new Error('Notion adapter not implemented yet')
    default:
      throw new Error(`Unknown adapter type: ${type}`)
  }

  // 缓存并返回
  adapterCache.set(type, adapter)
  return adapter
}

/**
 * 获取默认适配器（滴答清单）
 */
export function getDefaultAdapter(): ITaskAdapter {
  return createTaskAdapter('didaList')
}
