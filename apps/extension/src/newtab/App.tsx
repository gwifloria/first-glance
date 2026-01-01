import { FocusView } from '@/components/FocusView'
import { LoginButton } from '@/components/LoginButton'
import { Onboarding } from '@/components/Onboarding'
import { Sidebar } from '@/components/Sidebar'
import { TaskList } from '@/components/TaskList'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { LogoutOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'

type ViewMode = 'focus' | 'list'

function AppContent() {
  const { isLoggedIn, loading: authLoading, login, logout } = useAuth()
  const { theme } = useTheme()
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
    return (
      <>
        <Onboarding onComplete={() => {}} />
        <LoginButton loading={authLoading} onLogin={login} />
      </>
    )
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
              onClick={logout}
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
