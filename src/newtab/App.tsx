import { useState, useMemo } from 'react'
import { Button } from 'antd'
import { LogoutOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { TaskList } from '@/components/TaskList'
import { Sidebar } from '@/components/Sidebar'
import { FocusView } from '@/components/FocusView'
import { LoginButton } from '@/components/LoginButton'
import { formatDateStr, extractDateStr } from '@/utils/date'

type ViewMode = 'focus' | 'list'

function AppContent() {
  const { isLoggedIn, loading: authLoading, login, logout } = useAuth()
  const {
    tasks,
    projects,
    loading: tasksLoading,
    error,
    completeTask,
    deleteTask,
    updateTask,
    createTask,
  } = useTasks(isLoggedIn)

  const [viewMode, setViewMode] = useState<ViewMode>('focus')
  const [selectedFilter, setSelectedFilter] = useState('today')
  const [searchQuery, setSearchQuery] = useState('')

  // 计算今天的任务数
  const todayTaskCount = useMemo(() => {
    const todayStr = formatDateStr(new Date())
    return tasks.filter(
      (t) => t.dueDate && extractDateStr(t.dueDate) === todayStr
    ).length
  }, [tasks])

  if (!isLoggedIn) {
    return <LoginButton loading={authLoading} onLogin={login} />
  }

  // 专注模式视图
  if (viewMode === 'focus') {
    return (
      <FocusView
        tasks={tasks}
        loading={tasksLoading}
        onComplete={completeTask}
        onCreate={createTask}
        onSwitchView={() => setViewMode('list')}
        todayTaskCount={todayTaskCount}
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
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        onSearch={setSearchQuery}
      />

      {/* 右侧内容区域 - 有外边距 */}
      <div className="flex-1 p-3 pl-0 min-h-0">
        <div className="h-full bg-[var(--bg-content)] bg-dotted rounded-2xl overflow-hidden relative shadow-[var(--shadow-small)]">
          {/* 顶部按钮区 */}
          <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
            {/* 返回专注模式按钮 */}
            <Button
              type="text"
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => setViewMode('focus')}
              className="text-[var(--text-secondary)] text-xs hover:text-[var(--accent)]"
            >
              专注
            </Button>
            {/* 登出按钮 */}
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
