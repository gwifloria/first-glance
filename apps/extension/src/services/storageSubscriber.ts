/**
 * chrome.storage 订阅器工厂：把"指定 area + key 变化时调 callback"的样板代码统一掉
 *
 * 使用：
 *   const subscribeFoo = createStorageSubscriber('sync', 'foo_key', parseFoo)
 *   const unsubscribe = subscribeFoo((value) => { ... })
 */
export function createStorageSubscriber<T>(
  area: 'sync' | 'local',
  key: string,
  parse: (raw: unknown) => T
): (callback: (value: T) => void) => () => void {
  return (callback) => {
    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== area) return
      if (!(key in changes)) return
      callback(parse(changes[key].newValue))
    }
    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  }
}
