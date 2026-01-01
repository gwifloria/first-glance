import { useState, useEffect } from 'react'
import { MenuOutlined } from '@ant-design/icons'
import { useTheme } from '@/contexts/ThemeContext'
import { getGreeting } from '@/utils/greeting'
import { formatTime, formatDateStr } from '@/utils/date'
import { getRandomQuote, type Quote } from '@/data/quotes'
import { ThemeToggle } from './common/ThemeToggle'
import { TaskCheckbox } from './common/TaskCheckbox'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import { FocusSkeleton } from './TaskSkeleton'
import type { Task } from '@/types'

interface FocusViewProps {
  focusTasks: Task[] // 今日高优先级任务（已筛选）
  loading: boolean
  onComplete: (task: Task) => void
  onCreate: (task: Partial<Task>) => Promise<Task>
  onSwitchView: () => void
  todayTaskCount: number
}

export function FocusView({
  focusTasks,
  loading,
  onComplete,
  onCreate,
  onSwitchView,
  todayTaskCount,
}: FocusViewProps) {
  const { theme } = useTheme()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [quote] = useState<Quote>(() => getRandomQuote())
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [creating, setCreating] = useState(false)

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const greeting = getGreeting()

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || creating) return

    setCreating(true)
    try {
      // 使用本地日期格式（避免 UTC 时区问题）
      const dueDate = formatDateStr(new Date()) + 'T00:00:00.000+0800'

      await onCreate({
        title: newTaskTitle.trim(),
        dueDate,
        priority: 5, // 最高优先级
      })
      setNewTaskTitle('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden animate-fadeIn">
      {/* 背景纹理层 */}
      {theme.showTexture && (
        <div className="absolute inset-0 pointer-events-none opacity-40 paper-texture" />
      )}

      {/* 顶部栏 */}
      <div className="flex justify-between items-center p-6 relative z-10">
        {/* 左上角 Links 按钮 */}
        <button
          onClick={onSwitchView}
          className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity text-[var(--text-primary)] bg-transparent border-0 cursor-pointer"
        >
          <MenuOutlined className="text-base" />
          <span>Links</span>
        </button>

        {/* 右上角主题切换 */}
        <ThemeToggle variant="minimal" size="sm" />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* 大时钟 */}
        <div className="text-[120px] font-extralight text-[var(--text-primary)] leading-none tracking-tight hover:scale-105 transition-transform duration-700">
          {formatTime(currentTime)}
        </div>

        {/* 问候语 */}
        <div className="text-2xl text-[var(--text-primary)] mt-4 font-light">
          {greeting}
        </div>

        {/* TODAY'S FOCUS */}
        <div className="mt-16 w-full max-w-md">
          <h2 className="text-xs font-medium tracking-[3px] text-center text-[var(--text-secondary)] mb-8">
            TODAY'S FOCUS
          </h2>

          {loading ? (
            <FocusSkeleton />
          ) : focusTasks.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] text-lg">
              今天没有高优先级任务
            </div>
          ) : (
            <div className="space-y-4">
              {focusTasks.map((task) => (
                <FocusTaskItem
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                />
              ))}
            </div>
          )}

          {/* Add another focus - 输入框 */}
          <div className="mt-8">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
              placeholder="Add another focus..."
              disabled={creating}
              className="w-full text-center text-[var(--text-secondary)] placeholder:text-[var(--text-secondary)] bg-transparent border-0 border-b border-[var(--border)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />
            <div
              onClick={handleCreateTask}
              className={`text-[var(--text-secondary)] text-xl mt-2 text-center cursor-pointer hover:text-[var(--accent)] transition-colors ${creating ? 'opacity-50 pointer-events-none' : ''}`}
            >
              +
            </div>
          </div>
        </div>
      </div>

      {/* 底部语录 */}
      <div className="text-center pb-8 px-6 relative z-10">
        <p
          className="text-lg text-[var(--text-primary)] italic opacity-70 max-w-3xl mx-auto"
          style={{
            fontFamily:
              theme.type === 'journal' ? 'var(--font-heading)' : 'inherit',
          }}
        >
          "{quote.text}"
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-2 tracking-widest uppercase font-bold opacity-40">
          {quote.author}
        </p>
      </div>

      {/* 右下角 Todo 按钮 */}
      <button
        onClick={onSwitchView}
        className="absolute bottom-6 right-6 z-50 bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-[var(--border)] text-sm flex items-center gap-2"
      >
        <span>Todo</span>
        <span className="bg-[var(--accent)] text-white text-xs px-2 py-0.5 rounded-full">
          {todayTaskCount}
        </span>
      </button>
    </div>
  )
}

// 专注任务项组件
function FocusTaskItem({
  task,
  onComplete,
}: {
  task: Task
  onComplete: (task: Task) => void
}) {
  const { theme } = useTheme()
  const { completing, handleComplete } = useTaskCompletion(onComplete, {
    delayBefore: false,
  })

  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-[var(--bg-card)] rounded-xl shadow-sm">
      <TaskCheckbox
        completing={completing}
        onComplete={() => handleComplete(task)}
        variant="focus"
        disabled={completing}
      />
      <span
        className={`flex-1 text-lg text-[var(--text-primary)] ${completing ? 'line-through opacity-40' : ''}`}
        style={{
          fontFamily:
            theme.type === 'journal' ? 'var(--font-heading)' : 'inherit',
        }}
      >
        {task.title}
      </span>
    </div>
  )
}
