import { useState, useCallback } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { FocusLayout, ListLayout } from '@/components/layouts'
import { ConnectPrompt } from '@/components/ConnectPrompt'
import { useAppMode } from '@/hooks/useAppMode'
import { useLocalTasks } from '@/hooks/useLocalTasks'
import { useTasks } from '@/hooks/useTasks'
import {
  migrateLocalTasksToDidaList,
  clearLocalTasks,
} from '@/services/taskMigration'
import { isLocalTask, type Task, type LocalTask } from '@/types'

type ViewMode = 'focus' | 'list'

function AppContent() {
  const { t } = useTranslation('common')
  const {
    isGuest,
    isConnected,
    connect,
    disconnect,
    loading: modeLoading,
  } = useAppMode()

  // Local tasks for guest mode
  const localTasks = useLocalTasks()

  // Remote tasks for connected mode
  const { data, actions, views } = useTasks(isConnected)
  const { tasks, projects, loading: tasksLoading, error } = data
  const {
    completeTask,
    deleteTask,
    updateTask,
    createTask,
    createInboxTask,
    refresh: refreshRemoteTasks,
  } = actions
  const { todayFocusTasks, counts } = views

  const [viewMode, setViewMode] = useState<ViewMode>('focus')
  const [selectedFilter, setSelectedFilter] = useState('today')
  const [searchQuery, setSearchQuery] = useState('')

  // Connect prompt state
  const [showConnectPrompt, setShowConnectPrompt] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)

  // Handle connect button click
  const handleConnectClick = useCallback(() => {
    setShowConnectPrompt(true)
  }, [])

  // Connect and migrate local tasks
  const handleConnectAndMigrate = useCallback(async () => {
    setConnectLoading(true)
    try {
      await connect()
      const result = await migrateLocalTasksToDidaList()
      if (result.success > 0) {
        message.success(t('message.syncSuccess', { count: result.success }))
      }
      if (result.failed > 0) {
        message.warning(t('message.syncFailed', { count: result.failed }))
      }
      await refreshRemoteTasks()
      setShowConnectPrompt(false)
    } catch {
      message.error(t('message.failedToConnect'))
    } finally {
      setConnectLoading(false)
    }
  }, [connect, refreshRemoteTasks, t])

  // Connect without migrating
  const handleConnectWithoutMigrate = useCallback(async () => {
    setConnectLoading(true)
    try {
      await connect()
      await clearLocalTasks()
      setShowConnectPrompt(false)
    } catch {
      message.error(t('message.failedToConnect'))
    } finally {
      setConnectLoading(false)
    }
  }, [connect, t])

  // Cancel connect
  const handleCancelConnect = useCallback(() => {
    setShowConnectPrompt(false)
  }, [])

  // Switch to list view
  const handleSwitchToList = useCallback(() => {
    setViewMode('list')
  }, [])

  // Handle task completion (works for both local and remote)
  const handleComplete = useCallback(
    async (task: Task | LocalTask) => {
      if (isLocalTask(task)) {
        await localTasks.completeTask(task)
      } else {
        await completeTask(task)
      }
    },
    [localTasks, completeTask]
  )

  // Handle task creation (works for both local and remote)
  const handleCreate = useCallback(
    async (taskData: Partial<Task>): Promise<Task | LocalTask | null> => {
      if (isGuest) {
        const result = await localTasks.createTask(taskData.title || '')
        if (!result) {
          message.warning(t('message.taskLimitReached'))
        }
        return result
      } else {
        return createInboxTask(taskData)
      }
    },
    [isGuest, localTasks, createInboxTask, t]
  )

  // Determine which tasks to show in FocusView
  const focusTasks = isGuest ? localTasks.tasks : todayFocusTasks
  const loading = isGuest ? localTasks.loading : tasksLoading
  const todayCount = isGuest ? localTasks.count : counts.today

  // Guest mode: Always show Focus view
  // Connected mode: Show Focus or List based on viewMode
  if (isGuest || viewMode === 'focus') {
    return (
      <>
        <FocusLayout
          focusTasks={focusTasks}
          loading={modeLoading || loading}
          todayTaskCount={todayCount}
          isGuestMode={isGuest}
          canAddMore={isGuest ? localTasks.canAddMore : true}
          onComplete={handleComplete}
          onCreate={handleCreate}
          onSwitchView={isGuest ? undefined : handleSwitchToList}
          onConnect={handleConnectClick}
        />
        {/* ConnectPrompt 独立渲染，避免状态变化导致 FocusLayout 重渲染 */}
        <ConnectPrompt
          open={showConnectPrompt}
          localTaskCount={localTasks.count}
          loading={connectLoading}
          onConnectAndMigrate={handleConnectAndMigrate}
          onConnectWithoutMigrate={handleConnectWithoutMigrate}
          onCancel={handleCancelConnect}
        />
      </>
    )
  }

  // Connected mode: List view
  return (
    <ListLayout
      tasks={tasks}
      projects={projects}
      counts={counts}
      loading={tasksLoading}
      error={error}
      selectedFilter={selectedFilter}
      searchQuery={searchQuery}
      onFilterChange={setSelectedFilter}
      onSearch={setSearchQuery}
      onComplete={completeTask}
      onDelete={deleteTask}
      onUpdate={updateTask}
      onCreate={createTask}
      onFocus={() => setViewMode('focus')}
      onDisconnect={disconnect}
    />
  )
}

function App() {
  return <AppContent />
}

export default App
