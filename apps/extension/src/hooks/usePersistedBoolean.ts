import { useState, useCallback } from 'react'

/**
 * 持久化布尔值状态的 Hook
 * 用于管理侧边栏折叠等需要本地存储的布尔状态
 */
export function usePersistedBoolean(
  storageKey: string,
  defaultValue = false
): [boolean, () => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved !== null ? JSON.parse(saved) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const toggle = useCallback(() => {
    setValue((prev) => {
      const next = !prev
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [storageKey])

  return [value, toggle]
}
