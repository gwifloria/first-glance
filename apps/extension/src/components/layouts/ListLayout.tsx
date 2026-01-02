import { Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { Sidebar } from '@/components/Sidebar'
import { TaskList } from '@/components/TaskList'
import { useTheme } from '@/hooks/useTheme'
import type { Task, Project } from '@/types'
import type { TaskCounts } from '@/utils/taskFilters'

interface ListLayoutProps {
  tasks: Task[]
  projects: Project[]
  counts: TaskCounts
  loading: boolean
  error: string | null
  selectedFilter: string
  searchQuery: string
  onFilterChange: (filter: string) => void
  onSearch: (query: string) => void
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onCreate: (task: Partial<Task>) => Promise<Task>
  onFocus: () => void
  onDisconnect: () => void
}

export function ListLayout({
  tasks,
  projects,
  counts,
  loading,
  error,
  selectedFilter,
  searchQuery,
  onFilterChange,
  onSearch,
  onComplete,
  onDelete,
  onUpdate,
  onCreate,
  onFocus,
  onDisconnect,
}: ListLayoutProps) {
  const { theme } = useTheme()

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
        onFilterChange={onFilterChange}
        onSearch={onSearch}
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
              onClick={onDisconnect}
              className="text-[var(--text-secondary)] text-xs hover:text-[var(--text-primary)]"
            />
          </div>

          <main className="h-full overflow-y-auto relative z-10">
            <TaskList
              tasks={tasks}
              projects={projects}
              loading={loading}
              error={error}
              filter={selectedFilter}
              searchQuery={searchQuery}
              onComplete={onComplete}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onCreate={onCreate}
              onFocus={onFocus}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
