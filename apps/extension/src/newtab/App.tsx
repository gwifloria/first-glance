import { useState, useCallback } from 'react'
import { message } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { FocusView } from '@/components/FocusView'
import { Onboarding } from '@/components/Onboarding'
import { Sidebar } from '@/components/Sidebar'
import { TaskList } from '@/components/TaskList'
import { ConnectPrompt } from '@/components/ConnectPrompt'
import { useTheme } from '@/contexts/ThemeContext'
import { useAppMode } from '@/hooks/useAppMode'
import { useLocalTasks } from '@/hooks/useLocalTasks'
import { useTasks } from '@/hooks/useTasks'
import {
  migrateLocalTasksToDidaList,
  clearLocalTasks,
} from '@/services/taskMigration'
import type { Task, LocalTask } from '@/types'

type ViewMode = 'focus' | 'list'

function AppContent() {
  const {
    isGuest,
    isConnected,
    connect,
    disconnect,
    loading: modeLoading,
  } = useAppMode()
  const { theme } = useTheme()

  // Local tasks for guest mode
  const localTasks = useLocalTasks()

  // Remote tasks for connected mode
  const {
    tasks,
    projects,
    loading: tasksLoading,
    error,
    todayFocusTasks,
    counts,
    completeTask,
    deleteTask,
    updateTask,
    createTask,
    createInboxTask,
    refresh: refreshRemoteTasks,
  } = useTasks(isConnected)

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
        message.success(`Synced ${result.success} task(s) to DidaList`)
      }
      if (result.failed > 0) {
        message.warning(`Failed to sync ${result.failed} task(s)`)
      }
      await refreshRemoteTasks()
      setShowConnectPrompt(false)
    } catch (err) {
      message.error('Failed to connect')
    } finally {
      setConnectLoading(false)
    }
  }, [connect, refreshRemoteTasks])

  // Connect without migrating
  const handleConnectWithoutMigrate = useCallback(async () => {
    setConnectLoading(true)
    try {
      await connect()
      await clearLocalTasks()
      setShowConnectPrompt(false)
    } catch (err) {
      message.error('Failed to connect')
    } finally {
      setConnectLoading(false)
    }
  }, [connect])

  // Cancel connect
  const handleCancelConnect = useCallback(() => {
    setShowConnectPrompt(false)
  }, [])

  // Handle task completion (works for both local and remote)
  const handleComplete = useCallback(
    async (task: Task | LocalTask) => {
      if ('isLocal' in task && task.isLocal) {
        await localTasks.completeTask(task)
      } else {
        await completeTask(task as Task)
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
          message.warning('Task limit reached. Connect to add more.')
        }
        return result
      } else {
        return createInboxTask(taskData)
      }
    },
    [isGuest, localTasks, createInboxTask]
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
        <Onboarding onComplete={() => {}} />
        <FocusView
          focusTasks={focusTasks}
          loading={modeLoading || loading}
          onComplete={handleComplete}
          onCreate={handleCreate}
          onSwitchView={isGuest ? undefined : () => setViewMode('list')}
          todayTaskCount={todayCount}
          isGuestMode={isGuest}
          canAddMore={isGuest ? localTasks.canAddMore : true}
          onConnect={handleConnectClick}
        />
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
    <div className="h-screen bg-[var(--bg-primary)] flex overflow-hidden relative animate-fadeIn">
      {/* 背景纹理层 */}
      {theme.showTexture && (
        <div className="absolute inset-0 pointer-events-none opacity-40 paper-texture z-0" />
      )}

      {/* 侧边栏 */}
      <Sidebar
        tasks={tasks}
        projects={projects}
        counts={counts}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        onSearch={setSearchQuery}
      />

      {/* 右侧内容区域 - 纸张容器 */}
      <div className="flex-1 p-6 min-h-0 relative z-10">
        <div
          className={`
            h-full bg-[var(--bg-content)] rounded-2xl overflow-hidden relative
            ${theme.showTexture ? 'notebook-shadow' : 'shadow-[var(--shadow-small)]'}
          `}
        >
          {/* 点阵背景 */}
          {theme.showTexture && (
            <div className="absolute inset-0 pointer-events-none dot-grid z-0" />
          )}

          {/* 登出按钮 */}
          <div className="absolute top-3 right-3 z-50">
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              onClick={disconnect}
              className="text-[var(--text-secondary)] text-xs hover:text-[var(--text-primary)]"
            />
          </div>

          <main className="h-full overflow-y-auto relative z-10">
            <TaskList
              tasks={tasks}
              projects={projects}
              loading={tasksLoading}
              error={error}
              filter={selectedFilter}
              searchQuery={searchQuery}
              onComplete={completeTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onCreate={createTask}
              onFocus={() => setViewMode('focus')}
            />
          </main>
        </div>
      </div>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
