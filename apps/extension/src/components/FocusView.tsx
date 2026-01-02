import { useState, useEffect } from 'react'
import { LinkOutlined } from '@ant-design/icons'
import { useTheme } from '@/contexts/ThemeContext'
import { getGreeting } from '@/utils/greeting'
import { formatTime, formatDateStr } from '@/utils/date'
import { getRandomQuote, type Quote } from '@/data/quotes'
import { ThemeToggle } from './common/ThemeToggle'
import { TaskCheckbox } from './common/TaskCheckbox'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import { FocusSkeleton } from './TaskSkeleton'
import type { Task, LocalTask } from '@/types'

interface FocusViewProps {
  focusTasks: (Task | LocalTask)[] // 今日高优先级任务（已筛选）
  loading: boolean
  onComplete: (task: Task | LocalTask) => void
  onCreate: (task: Partial<Task>) => Promise<Task | LocalTask | null>
  onSwitchView?: () => void
  todayTaskCount: number
  // Guest mode props
  isGuestMode?: boolean
  canAddMore?: boolean
  onConnect?: () => void
}

export function FocusView({
  focusTasks,
  loading,
  onComplete,
  onCreate,
  onSwitchView,
  todayTaskCount,
  isGuestMode = false,
  canAddMore = true,
  onConnect,
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
        <div /> {/* 保持布局平衡 */}
        {/* 右上角 */}
        <div className="flex items-center gap-3">
          {/* 访客模式显示连接按钮 */}
          {isGuestMode && onConnect && (
            <button
              onClick={onConnect}
              className="flex items-center gap-1.5 text-sm px-4 py-1.5 bg-[var(--accent)] text-white rounded-full hover:opacity-90 transition-opacity cursor-pointer border-0"
            >
              <LinkOutlined className="text-xs" />
              <span>Connect</span>
            </button>
          )}
          <ThemeToggle variant="minimal" size="sm" />
        </div>
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
              placeholder={
                isGuestMode && !canAddMore
                  ? 'Connect to add more...'
                  : 'Add another focus...'
              }
              disabled={creating || (isGuestMode && !canAddMore)}
              className="w-full text-center text-[var(--text-secondary)] placeholder:text-[var(--text-secondary)] bg-transparent border-0 border-b border-[var(--border)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />
            <div
              onClick={handleCreateTask}
              className={`text-[var(--text-secondary)] text-xl mt-2 text-center cursor-pointer hover:text-[var(--accent)] transition-colors ${creating || (isGuestMode && !canAddMore) ? 'opacity-50 pointer-events-none' : ''}`}
            >
              +
            </div>
            {/* 访客模式限制提示 */}
            {isGuestMode && (
              <div className="text-xs text-[var(--text-secondary)] text-center mt-2 opacity-60">
                {canAddMore
                  ? `${3 - focusTasks.length}/3 available`
                  : 'Connect to unlock more tasks'}
              </div>
            )}
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

      {/* 右下角 Todo 按钮 - 访客模式隐藏 */}
      {!isGuestMode && onSwitchView && (
        <button
          onClick={onSwitchView}
          className="absolute bottom-6 right-6 z-50 bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-[var(--border)] text-sm flex items-center gap-2"
        >
          <span>Todo</span>
          <span className="bg-[var(--accent)] text-white text-xs px-2 py-0.5 rounded-full">
            {todayTaskCount}
          </span>
        </button>
      )}
    </div>
  )
}

// 专注任务项组件
function FocusTaskItem({
  task,
  onComplete,
}: {
  task: Task | LocalTask
  onComplete: (task: Task | LocalTask) => void
}) {
  const { theme } = useTheme()
  const { completing, handleComplete } = useTaskCompletion(onComplete, {
    delayBefore: false,
  })

  return (
    <div
      className={`
        flex items-center gap-4 py-3 px-4 bg-[var(--bg-card)] rounded-xl shadow-sm
        transition-all duration-300 ease-out
        ${completing ? 'animate-[taskComplete_0.4s_ease-out_forwards]' : ''}
      `}
    >
      <TaskCheckbox
        completing={completing}
        onComplete={() => handleComplete(task)}
        variant="focus"
        disabled={completing}
      />
      <span
        className={`flex-1 text-lg text-[var(--text-primary)] transition-all duration-200 ${completing ? 'line-through text-[var(--text-secondary)]' : ''}`}
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
