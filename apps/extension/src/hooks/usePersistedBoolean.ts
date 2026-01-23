import { useCallback } from 'react'
import { usePersistedState } from './usePersistedState'

/**
 * 持久化布尔值状态的 Hook
 * 使用 chrome.storage.local 存储，支持跨 tab 同步
 */
export function usePersistedBoolean(
  storageKey: string,
  defaultValue = false
): [boolean, () => void] {
  const [value, setValue] = usePersistedState(storageKey, defaultValue)

  const toggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [setValue])

  return [value, toggle]
}
