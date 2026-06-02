import { useState, useCallback, useEffect } from 'react'
import { useAppMode } from '@/contexts/useAppMode'
import { usePremium } from '@/hooks/usePremium'
import { getSettings } from '@/services/settingsStorage'
import { storage } from '@/services/storage'
import { TaskProvider } from '@/contexts/TaskProvider'
import { FocusLayout, ListLayout } from '@/components/layouts'
import { BlockedPage } from '@/components/BlockedPage'
import { BuddyButton } from '@/components/Buddy/BuddyButton'
import { PremiumModal } from '@/components/PremiumModal'

type ViewMode = 'focus' | 'list'

// 检查是否是 blocked 模式（通过 URL 参数）
const isBlockedMode =
  new URLSearchParams(window.location.search).get('blocked') === '1'

function AppContent() {
  const { isGuest } = useAppMode()
  const { premiumModalOpen, closePremiumModal } = usePremium()
  const [viewMode, setViewMode] = useState<ViewMode>('focus')

  // 初始视图：番茄钟正在进行（work/break，含暂停）时强制 Focus，
  // 这样刷新/重开页面能留在专注界面；否则按用户设置的默认视图。
  useEffect(() => {
    Promise.all([getSettings(), storage.getPomodoro()]).then(([s, pomo]) => {
      if (pomo && pomo.mode !== 'idle') {
        setViewMode('focus')
      } else if (s.defaultView === 'list') {
        setViewMode('list')
      }
    })
  }, [])

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
      <PremiumModal open={premiumModalOpen} onClose={closePremiumModal} />
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
