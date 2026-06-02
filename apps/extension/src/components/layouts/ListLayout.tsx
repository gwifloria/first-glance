import { useState, useEffect, useCallback } from 'react'
import { useTaskContext } from '@/contexts/TaskContext'
import { usePomodoro } from '@/hooks/usePomodoro'
import { getSettings, subscribeSettings } from '@/services/settingsStorage'
import { Sidebar } from '@/components/Sidebar'
import { TaskList } from '@/components/TaskList'
import { ChillModeIndicator } from '@/components/common'
import type { Task } from '@/types'

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

  // 番茄钟配置（用户自定义时长），用于从列表直接开启
  const [pomodoroConfig, setPomodoroConfig] = useState({
    workDuration: 25,
    breakDuration: 5,
  })
  useEffect(() => {
    getSettings().then((s) =>
      setPomodoroConfig({
        workDuration: s.workDuration,
        breakDuration: s.breakDuration,
      })
    )
    return subscribeSettings((s) =>
      setPomodoroConfig({
        workDuration: s.workDuration,
        breakDuration: s.breakDuration,
      })
    )
  }, [])
  const pomodoro = usePomodoro(pomodoroConfig)

  // 从列表开启番茄钟：绑定任务（跨标签页存储同步）后切到 Focus 视图沉浸计时
  const handleStartPomodoro = useCallback(
    (task: Task) => {
      pomodoro.startWithTask(task.id)
      onFocus()
    },
    [pomodoro, onFocus]
  )

  return (
    <div className="h-screen bg-[var(--bg-frame)] flex overflow-hidden relative animate-fadeIn">
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
      <div className="flex-1 p-6 max-lg:p-3 min-h-0 relative z-10">
        <div className="h-full bg-[var(--bg-content)] rounded-2xl overflow-hidden relative notebook-shadow">
          {/* 纹理背景 - 通过 CSS 类控制显示（dots 或 grid） */}
          <div className="absolute inset-0 pointer-events-none dot-grid z-0" />
          <div className="absolute inset-0 pointer-events-none line-grid-auto z-0" />

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
              onStartPomodoro={handleStartPomodoro}
            />
          </main>
        </div>
      </div>

      <ChillModeIndicator />
    </div>
  )
}
