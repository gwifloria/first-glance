import { useCallback } from 'react'
import { usePersistedState, setSerializer } from './usePersistedState'

/**
 * 持久化 Set 状态的 Hook
 * 使用 chrome.storage.local 存储，支持跨 tab 同步
 */
export function usePersistedSet(
  storageKey: string
): [Set<string>, (id: string) => void] {
  const [items, setItems] = usePersistedState(
    storageKey,
    new Set<string>(),
    setSerializer
  )

  const toggle = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    [setItems]
  )

  return [items, toggle]
}
