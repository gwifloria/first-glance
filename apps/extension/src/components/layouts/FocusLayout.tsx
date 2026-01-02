import { FocusView } from '@/components/FocusView'
import { Onboarding } from '@/components/Onboarding'
import { ConnectPrompt } from '@/components/ConnectPrompt'
import type { Task, LocalTask } from '@/types'

interface FocusLayoutProps {
  focusTasks: (Task | LocalTask)[]
  loading: boolean
  todayTaskCount: number
  isGuestMode: boolean
  canAddMore: boolean
  onComplete: (task: Task | LocalTask) => void
  onCreate: (task: Partial<Task>) => Promise<Task | LocalTask | null>
  onSwitchView?: () => void
  onConnect?: () => void
  // Connect prompt props
  showConnectPrompt: boolean
  localTaskCount: number
  connectLoading: boolean
  onConnectAndMigrate: () => void
  onConnectWithoutMigrate: () => void
  onCancelConnect: () => void
}

export function FocusLayout({
  focusTasks,
  loading,
  todayTaskCount,
  isGuestMode,
  canAddMore,
  onComplete,
  onCreate,
  onSwitchView,
  onConnect,
  showConnectPrompt,
  localTaskCount,
  connectLoading,
  onConnectAndMigrate,
  onConnectWithoutMigrate,
  onCancelConnect,
}: FocusLayoutProps) {
  return (
    <>
      <Onboarding onComplete={() => {}} />
      <FocusView
        focusTasks={focusTasks}
        loading={loading}
        onComplete={onComplete}
        onCreate={onCreate}
        onSwitchView={onSwitchView}
        todayTaskCount={todayTaskCount}
        isGuestMode={isGuestMode}
        canAddMore={canAddMore}
        onConnect={onConnect}
      />
      <ConnectPrompt
        open={showConnectPrompt}
        localTaskCount={localTaskCount}
        loading={connectLoading}
        onConnectAndMigrate={onConnectAndMigrate}
        onConnectWithoutMigrate={onConnectWithoutMigrate}
        onCancel={onCancelConnect}
      />
    </>
  )
}
