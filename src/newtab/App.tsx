import { useState } from 'react'
import { Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { TaskList } from '@/components/TaskList'
import { Sidebar } from '@/components/Sidebar'
import { LoginButton } from '@/components/LoginButton'
import { ThemeSwitch } from '@/components/ThemeSwitch'

function AppContent() {
  const { isLoggedIn, loading: authLoading, login, logout } = useAuth()
  const {
    tasks,
    projects,
    loading: tasksLoading,
    error,
    refresh,
    completeTask,
    deleteTask,
    updateTask,
    createTask,
  } = useTasks(isLoggedIn)

  const [selectedFilter, setSelectedFilter] = useState('today')

  if (!isLoggedIn) {
    return <LoginButton loading={authLoading} onLogin={login} />
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative flex flex-col">
      {/* 控制按钮 */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
        <ThemeSwitch />
        <Button
          type="text"
          size="small"
          icon={<LogoutOutlined />}
          onClick={logout}
          className="text-[var(--text-secondary)] text-xs hover:text-[var(--accent)]"
        />
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tasks={tasks}
          projects={projects}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-card)]">
          <TaskList
            tasks={tasks}
            projects={projects}
            loading={tasksLoading}
            error={error}
            filter={selectedFilter}
            onComplete={completeTask}
            onDelete={deleteTask}
            onUpdate={updateTask}
            onCreate={createTask}
            onRefresh={refresh}
          />
        </main>
      </div>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
