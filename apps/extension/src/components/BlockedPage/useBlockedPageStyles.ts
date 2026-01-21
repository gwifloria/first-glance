import { useMemo } from 'react'
import { useTheme } from '@/hooks'

export function useBlockedPageStyles() {
  const { theme } = useTheme()

  return useMemo(
    () => ({
      ...theme.blockedPage,
      showTexture: theme.showTexture,
    }),
    [theme.blockedPage, theme.showTexture]
  )
}
