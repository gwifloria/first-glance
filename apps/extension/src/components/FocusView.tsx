import { useState, memo } from 'react'
import { Button } from 'antd'
import { LinkOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getGreeting } from '@/utils/greeting'
import { formatDateStr } from '@/utils/date'
import { getRandomQuote, type Quote } from '@/data/quotes'
import { ThemeToggle } from './common/ThemeToggle'
import { TaskCheckbox } from './common/TaskCheckbox'
import { Clock } from './common/Clock'
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
  const { t } = useTranslation('focus')
  const { theme } = useTheme()
  const [quote] = useState<Quote>(() => getRandomQuote())
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [creating, setCreating] = useState(false)

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
            <Button
              type="primary"
              shape="round"
              size="small"
              onClick={onConnect}
              icon={<LinkOutlined />}
              className="!bg-[var(--accent)] hover:!bg-[var(--accent)] hover:!opacity-90"
            >
              {t('common:button.connect')}
            </Button>
          )}
          <ThemeToggle variant="minimal" size="sm" />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* 大时钟 */}
        <Clock variant="large" />

        {/* 问候语 */}
        <div className="text-2xl text-[var(--text-primary)] mt-4 font-light">
          {greeting}
        </div>

        {/* TODAY'S FOCUS */}
        <div className="mt-16 w-full max-w-md">
          <h2 className="text-xs font-medium tracking-[3px] text-center text-[var(--text-secondary)] mb-8">
            {t('title')}
          </h2>

          {loading ? (
            <FocusSkeleton />
          ) : focusTasks.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] text-lg">
              {t('empty')}
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
                  ? t('placeholder.connectToAdd')
                  : t('placeholder.addFocus')
              }
              disabled={creating || (isGuestMode && !canAddMore)}
              className="w-full text-center text-[var(--text-secondary)] placeholder:text-[var(--text-secondary)] bg-transparent border-0 border-b border-[var(--border)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />
            <Button
              type="text"
              shape="circle"
              size="small"
              onClick={handleCreateTask}
              disabled={creating || (isGuestMode && !canAddMore)}
              icon={<PlusOutlined />}
              className="!mx-auto !mt-2 !flex !text-[var(--text-secondary)] hover:!text-[var(--accent)]"
            />
            {/* 访客模式限制提示 */}
            {isGuestMode && (
              <div className="text-xs text-[var(--text-secondary)] text-center mt-2 opacity-60">
                {canAddMore
                  ? t('guestLimit.available', {
                      remaining: 3 - focusTasks.length,
                    })
                  : t('guestLimit.unlock')}
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
        <Button
          type="default"
          shape="round"
          onClick={onSwitchView}
          className="!absolute !bottom-6 !right-6 !z-50 !bg-[var(--bg-card)] !text-[var(--text-primary)] !border-[var(--border)] !shadow-sm hover:!shadow-md !flex !items-center !gap-2"
        >
          Todo
          <span className="bg-[var(--accent)] text-white text-xs px-2 py-0.5 rounded-full">
            {todayTaskCount}
          </span>
        </Button>
      )}
    </div>
  )
}

// 专注任务项组件（使用 memo 避免不必要的重渲染）
const FocusTaskItem = memo(function FocusTaskItem({
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
})
