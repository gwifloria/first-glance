import { useState, useCallback } from 'react'
import { useAppMode } from '@/contexts/useAppMode'
import { TaskProvider } from '@/contexts/TaskProvider'
import { FocusLayout, ListLayout } from '@/components/layouts'
import { BlockedPage } from '@/components/BlockedPage'
import { BuddyButton } from '@/components/Buddy/BuddyButton'

type ViewMode = 'focus' | 'list'

// 检查是否是 blocked 模式（通过 URL 参数）
const isBlockedMode =
  new URLSearchParams(window.location.search).get('blocked') === '1'

function AppContent() {
  const { isGuest } = useAppMode()
  const [viewMode, setViewMode] = useState<ViewMode>('focus')

  const handleSwitchToList = useCallback(() => setViewMode('list'), [])
  const handleSwitchToFocus = useCallback(() => setViewMode('focus'), [])

  return (
    <>
      {/* 访客模式始终显示 Focus 视图 */}
      {isGuest || viewMode === 'focus' ? (
        <FocusLayout onSwitchView={handleSwitchToList} />
      ) : (
        <ListLayout onFocus={handleSwitchToFocus} />
      )}
      <BuddyButton />
    </>
  )
}

function App() {
  // 如果是被屏蔽的网站重定向过来，显示 BlockedPage
  if (isBlockedMode) {
    return <BlockedPage />
  }

  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  )
}

export default App
