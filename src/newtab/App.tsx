import { useState } from 'react'
import { Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { TaskList } from '@/components/TaskList'
import { Sidebar } from '@/components/Sidebar'
import { FocusView } from '@/components/FocusView'
import { LoginButton } from '@/components/LoginButton'

type ViewMode = 'focus' | 'list'

function AppContent() {
  const { isLoggedIn, loading: authLoading, login, logout } = useAuth()
  const {
    tasks,
    projects,
    loading: tasksLoading,
    error,
    // 计算视图
    todayFocusTasks,
    counts,
    // 操作
    completeTask,
    deleteTask,
    updateTask,
    createTask,
    createInboxTask,
  } = useTasks(isLoggedIn)

  const [viewMode, setViewMode] = useState<ViewMode>('focus')
  const [selectedFilter, setSelectedFilter] = useState('today')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isLoggedIn) {
    return <LoginButton loading={authLoading} onLogin={login} />
  }

  // 专注模式视图
  if (viewMode === 'focus') {
    return (
      <FocusView
        focusTasks={todayFocusTasks}
        loading={tasksLoading}
        onComplete={completeTask}
        onCreate={createInboxTask}
        onSwitchView={() => setViewMode('list')}
        todayTaskCount={counts.today}
      />
    )
  }

  // 完整列表视图
  return (
    <div className="h-screen bg-[var(--bg-primary)] flex overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar
        tasks={tasks}
        projects={projects}
        counts={counts}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        onSearch={setSearchQuery}
      />

      {/* 右侧内容区域 - 有外边距 */}
      <div className="flex-1 p-3 pl-0 min-h-0">
        <div className="h-full bg-[var(--bg-content)] bg-dotted rounded-2xl overflow-hidden relative shadow-[var(--shadow-small)]">
          {/* 登出按钮 */}
          <div className="absolute top-3 right-3 z-50">
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              onClick={logout}
              className="text-[var(--text-secondary)] text-xs hover:text-[var(--accent)]"
            />
          </div>

          <main className="h-full overflow-y-auto">
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
