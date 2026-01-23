import { useState } from 'react'
import { useTaskContext } from '@/contexts/TaskContext'
import { Sidebar } from '@/components/Sidebar'
import { TaskList } from '@/components/TaskList'
import { ChillModeIndicator } from '@/components/common'

interface ListLayoutProps {
  onFocus: () => void
}

export function ListLayout({ onFocus }: ListLayoutProps) {
  const { data, actions, views, filters } = useTaskContext()
  const { tasks, projects, loading: dataLoading, error } = data
  // 只在初始加载（无数据）时显示骨架屏，刷新时保持显示原内容
  const loading = dataLoading && tasks.length === 0
  const { completeTask, deleteTask, updateTask, createTask } = actions
  const { counts, projectCounts } = views
  const { getTaskGroups } = filters

  const [selectedFilter, setSelectedFilter] = useState('today')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="h-screen bg-[var(--bg-primary)] flex overflow-hidden relative animate-fadeIn">
      {/* 背景纹理层 - 通过 CSS 类控制显示 */}
      <div className="absolute inset-0 pointer-events-none opacity-40 paper-texture z-0" />

      {/* 侧边栏 */}
      <Sidebar
        projects={projects}
        counts={counts}
        projectCounts={projectCounts}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        onSearch={setSearchQuery}
      />

      {/* 右侧内容区域 - 纸张容器 */}
      <div className="flex-1 p-6 min-h-0 relative z-10">
        <div className="h-full bg-[var(--bg-content)] rounded-2xl overflow-hidden relative notebook-shadow">
          {/* 点阵背景 - 通过 CSS 类控制显示 */}
          <div className="absolute inset-0 pointer-events-none dot-grid z-0" />

          <main className="h-full overflow-y-auto relative z-10">
            <TaskList
              projects={projects}
              loading={loading}
              error={error}
              filter={selectedFilter}
              searchQuery={searchQuery}
              getTaskGroups={getTaskGroups}
              onComplete={completeTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onCreate={createTask}
              onFocus={onFocus}
            />
          </main>
        </div>
      </div>

      <ChillModeIndicator />
    </div>
  )
}
