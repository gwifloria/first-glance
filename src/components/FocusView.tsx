import { useState, useEffect, useMemo } from 'react'
import { CheckOutlined } from '@ant-design/icons'
import { useTheme } from '@/contexts/ThemeContext'
import { getGreeting } from '@/utils/greeting'
import { formatTime, formatDateStr, extractDateStr } from '@/utils/date'
import { getRandomQuote, type Quote } from '@/data/quotes'
import type { ThemeType } from '@/themes'
import type { Task } from '@/types'

// 主题配置
const themeOptions: { type: ThemeType; color: string; name: string }[] = [
  { type: 'journal', color: '#E8E4DF', name: '手帐' },
  { type: 'rose', color: '#F5F0ED', name: '玫瑰' },
  { type: 'ocean', color: '#D8E3E8', name: '海洋' },
  { type: 'tech', color: '#1C1C1E', name: '暗黑' },
]

interface FocusViewProps {
  tasks: Task[]
  loading: boolean
  onComplete: (task: Task) => void
  onCreate: (task: Partial<Task>) => Promise<Task>
  onSwitchView: () => void
  todayTaskCount: number
}

export function FocusView({
  tasks,
  loading,
  onComplete,
  onCreate,
  onSwitchView,
  todayTaskCount,
}: FocusViewProps) {
  const { themeType, setThemeType } = useTheme()
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

  // 筛选今天的高优先级任务（priority >= 3），最多3个
  const focusTasks = useMemo(() => {
    const todayStr = formatDateStr(new Date())
    return tasks
      .filter((t) => {
        if (t.priority < 3) return false
        if (!t.dueDate) return false
        return extractDateStr(t.dueDate) === todayStr
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
  }, [tasks])

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
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col relative">
      {/* 顶部栏 */}
      <div className="flex justify-between items-center p-6">
        {/* 左上角入口 */}
        <button
          onClick={onSwitchView}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border-0 bg-transparent"
        >
          <span className="text-lg">☰</span>
          <span className="text-sm">Tasks</span>
        </button>

        {/* 右上角主题切换 */}
        <div className="flex items-center gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => setThemeType(option.type)}
              title={option.name}
              className={`
                w-4 h-4 rounded-full transition-all cursor-pointer border-0 p-0
                ${themeType === option.type ? 'ring-2 ring-offset-2 ring-[var(--text-secondary)] scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}
              `}
              style={{ backgroundColor: option.color }}
            />
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 大时钟 */}
        <div className="text-[120px] font-extralight text-[var(--text-primary)] leading-none tracking-tight">
          {formatTime(currentTime)}
        </div>

        {/* 问候语 */}
        <div className="text-2xl text-[var(--text-primary)] mt-4 font-light">
          {greeting}, Wonderland.
        </div>

        {/* TODAY'S FOCUS */}
        <div className="mt-16 w-full max-w-md">
          <h2 className="text-xs font-medium tracking-[3px] text-center text-[var(--text-secondary)] mb-8">
            TODAY'S FOCUS
          </h2>

          {loading ? (
            <div className="text-center text-[var(--text-secondary)]">
              加载中...
            </div>
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
      <div className="text-center pb-8 px-6">
        <p className="text-sm text-[var(--text-secondary)] italic">
          "{quote.text}"
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-2 tracking-wider uppercase">
          {quote.author}
        </p>
      </div>

      {/* 右下角 Todo 按钮 */}
      <button
        onClick={onSwitchView}
        className="absolute bottom-6 right-6 bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-[var(--border)] text-sm flex items-center gap-2"
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
  const [completing, setCompleting] = useState(false)

  const handleComplete = async () => {
    setCompleting(true)
    await onComplete(task)
    setCompleting(false)
  }

  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-[var(--bg-card)] rounded-xl shadow-sm">
      <button
        onClick={handleComplete}
        disabled={completing}
        className={`
          w-6 h-6 rounded border-2 border-[var(--border)] flex items-center justify-center
          cursor-pointer transition-all bg-transparent
          hover:border-[var(--accent)] hover:bg-[var(--accent-light)]
          ${completing ? 'opacity-50' : ''}
        `}
      >
        {completing && (
          <CheckOutlined className="text-xs text-[var(--accent)]" />
        )}
      </button>
      <span className="flex-1 text-lg text-[var(--text-primary)]">
        {task.title}
      </span>
    </div>
  )
}
