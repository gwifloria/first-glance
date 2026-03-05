import { useCallback } from 'react'
import { usePersistedState } from './usePersistedState'

export function useFocusLock() {
  const [isActive, setIsActive] = usePersistedState<boolean>(
    'focus_lock',
    false
  )
  const toggle = useCallback(() => setIsActive((prev) => !prev), [setIsActive])
  return { isActive, toggle }
}
