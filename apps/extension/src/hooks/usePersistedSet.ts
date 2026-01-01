import { useState, useCallback } from 'react'

/**
 * 持久化 Set 状态的 Hook
 * 用于管理折叠状态等需要本地存储的集合数据
 */
export function usePersistedSet(
  storageKey: string
): [Set<string>, (id: string) => void] {
  const [items, setItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  const toggle = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        localStorage.setItem(storageKey, JSON.stringify([...next]))
        return next
      })
    },
    [storageKey]
  )

  return [items, toggle]
}
