import { useAppMode } from '@/contexts/useAppMode'
import { useTaskContext } from '@/contexts/TaskContext'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import { getParentTitle } from '@/utils/taskMap'
import { renderMarkdownLinks } from '@/utils/renderMarkdownLinks'
import type { Task } from '@/types'
import { Button, Checkbox, message, Popover, Spin } from 'antd'
import { PlayCircleOutlined, AimOutlined } from '@ant-design/icons'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskCheckbox } from '../common/TaskCheckbox'
import { FocusTaskInput } from './FocusTaskInput'

const MAX_LOCAL_TASKS = 3

// 层层收窄：每级左右 margin 都 >= 上一级，但左右不对称
// 角度统一方向递减，像一叠便签被轻轻推歪
const RANK_OFFSETS = [
  { marginLeft: '0%', marginRight: '0%', rotate: '-1.2deg' },
  { marginLeft: '5%', marginRight: '10%', rotate: '-0.7deg' },
  { marginLeft: '12%', marginRight: '8%', rotate: '-0.3deg' },
  { marginLeft: '15%', marginRight: '14%', rotate: '-0.1deg' },
  { marginLeft: '18%', marginRight: '12%', rotate: '0deg' },
]

const CONTENT_POPOVER_CLASS =
  'max-w-[320px] max-h-[240px] overflow-y-auto text-sm leading-relaxed text-[var(--text-primary)] [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1 [&_a]:text-[var(--accent)] [&_a]:underline [&_code]:bg-[var(--bg-secondary)] [&_code]:px-1 [&_code]:rounded [&_s]:line-through [&_del]:line-through'

function sanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(
      /<(?!\/?(?:p|br|strong|em|b|i|ul|ol|li|s|del|a|h[1-6]|span|code)\b)[^>]+>/gi,
      ''
    )
    .trim()
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

// 番茄钟 / 绑定任务的 hover 按钮
function ActionButtons({
  task,
  isIdle,
  isFocusingUnbound,
  onStartPomodoro,
  onBindTask,
  className = '',
}: {
  task: Task
  isIdle?: boolean
  isFocusingUnbound?: boolean
  onStartPomodoro?: (task: Task) => void
  onBindTask?: (task: Task) => void
  className?: string
}) {
  const { t } = useTranslation('focus')
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isIdle && onStartPomodoro && (
        <Button
          type="text"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => onStartPomodoro(task)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 !text-[var(--text-secondary)] hover:!text-[var(--accent)]"
          title={t('pomodoro.start')}
        />
      )}
      {isFocusingUnbound && onBindTask && (
        <Button
          type="text"
          size="small"
          icon={<AimOutlined />}
          onClick={() => onBindTask(task)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 !text-[var(--text-secondary)] hover:!text-[var(--accent)]"
          title={t('pomodoro.bindTask')}
        />
      )}
    </div>
  )
}

// 子任务 Popover 内容
function SubtaskPopoverContent({
  task,
  childTasks,
  onCompleteChild,
}: {
  task: Task
  childTasks?: Task[]
  onCompleteChild: (task: Task) => void
}) {
  return (
    <div className="max-w-[200px] space-y-1.5">
      {childTasks?.map((child) => (
        <div key={child.id} className="flex items-center gap-1.5">
          <TaskCheckbox
            completing={false}
            onComplete={() => onCompleteChild(child)}
            variant="default"
          />
          <span
            className={`text-xs truncate ${child.status === 2 ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
          >
            {child.title}
          </span>
        </div>
      ))}
      {task.items?.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <Checkbox checked={item.status !== 0} disabled />
          <span
            className={`text-xs truncate ${item.status !== 0 ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
          >
            {item.title}
          </span>
        </div>
      ))}
    </div>
  )
}

interface FocusTaskItemProps {
  task: Task
  rank: number
  parentTitle?: string
  childInfo?: { total: number; completed: number }
  children?: Task[]
  onComplete: (task: Task) => void
  onCompleteChild: (task: Task) => void
  onStartPomodoro?: (task: Task) => void
  onBindTask?: (task: Task) => void
  isIdle?: boolean
  isFocusingUnbound?: boolean
  isHighlighted?: boolean
}

const FocusTaskItem = memo(function FocusTaskItem({
  task,
  rank,
  parentTitle,
  childInfo,
  children: childTasks,
  onComplete,
  onCompleteChild,
  onStartPomodoro,
  onBindTask,
  isIdle,
  isFocusingUnbound,
  isHighlighted,
}: FocusTaskItemProps) {
  const { t } = useTranslation('focus')
  const { completing, handleComplete } = useTaskCompletion(onComplete, {
    delayBefore: false,
  })

  const subtaskCount = useMemo(() => {
    let total = 0
    let completed = 0
    if (task.items && task.items.length > 0) {
      total += task.items.length
      completed += task.items.filter((item) => item.status !== 0).length
    }
    if (childInfo) {
      total += childInfo.total
      completed += childInfo.completed
    }
    return total > 0 ? { total, completed } : null
  }, [task.items, childInfo])

  const sanitizedContent = useMemo(() => {
    if (!task.content) return ''
    return sanitizeHtml(task.content)
  }, [task.content])

  const offset = RANK_OFFSETS[Math.min(rank, RANK_OFFSETS.length - 1)]
  const completingClass = completing
    ? 'animate-[taskComplete_0.4s_ease-out_forwards]'
    : ''
  const actionProps = {
    task,
    isIdle,
    isFocusingUnbound,
    onStartPomodoro,
    onBindTask,
  }

  // Hero 卡片
  if (rank === 0) {
    return (
      <div
        className={`group py-6 px-6 bg-[var(--bg-card)] transition-all duration-300 ease-out ${completingClass} ${isHighlighted ? 'ring-2 ring-[var(--accent)] ring-opacity-60' : ''}`}
        style={{
          marginLeft: offset.marginLeft,
          marginRight: offset.marginRight,
          transform: `rotate(${offset.rotate})`,
        }}
      >
        <div className="flex items-start gap-5">
          <div className="pt-1">
            <TaskCheckbox
              completing={completing}
              onComplete={() => handleComplete(task)}
              variant="focus"
              disabled={completing}
            />
          </div>
          <div className="flex-1 flex flex-col">
            {parentTitle && (
              <span className="text-xs text-[var(--text-secondary)] leading-tight mb-1 inline-flex items-center gap-0.5">
                <span className="opacity-60">↳</span> {parentTitle}
              </span>
            )}
            <span
              className={`text-2xl font-semibold text-[var(--text-primary)] transition-all duration-200 font-hand leading-snug ${completing ? 'line-through text-[var(--text-secondary)]' : ''}`}
            >
              {renderMarkdownLinks(task.title)}
            </span>
            {sanitizedContent && (
              <Popover
                placement="bottomLeft"
                trigger="hover"
                content={
                  <div
                    className={CONTENT_POPOVER_CLASS}
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  />
                }
              >
                <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-1 leading-relaxed cursor-default">
                  {stripTags(sanitizedContent)}
                </p>
              </Popover>
            )}
            {subtaskCount && (
              <Popover
                placement="bottomLeft"
                trigger="click"
                content={
                  <SubtaskPopoverContent
                    task={task}
                    childTasks={childTasks}
                    onCompleteChild={onCompleteChild}
                  />
                }
              >
                <div className="flex items-center gap-2 mt-3 cursor-pointer group/progress">
                  <div className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden max-w-[120px]">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                      style={{
                        width: `${(subtaskCount.completed / subtaskCount.total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] group-hover/progress:text-[var(--text-primary)] transition-colors">
                    {t('subtaskProgress', {
                      completed: subtaskCount.completed,
                      total: subtaskCount.total,
                    })}
                  </span>
                </div>
              </Popover>
            )}
          </div>
          <ActionButtons {...actionProps} />
        </div>
      </div>
    )
  }

  // 第二个任务：中号卡片
  if (rank === 1) {
    return (
      <div
        className={`group flex items-center gap-4 py-3 px-4 bg-[var(--bg-card)] transition-all duration-300 ease-out ${completingClass} ${isHighlighted ? 'ring-2 ring-[var(--accent)] ring-opacity-60' : ''}`}
        style={{
          marginLeft: offset.marginLeft,
          marginRight: offset.marginRight,
          transform: `rotate(${offset.rotate})`,
        }}
      >
        <TaskCheckbox
          completing={completing}
          onComplete={() => handleComplete(task)}
          variant="focus"
          disabled={completing}
        />
        <div className="flex-1 flex flex-col">
          {parentTitle && (
            <span className="text-xs text-[var(--text-secondary)] leading-tight mb-0.5 inline-flex items-center gap-0.5">
              <span className="opacity-60">↳</span> {parentTitle}
            </span>
          )}
          <span
            className={`text-base text-[var(--text-primary)] transition-all duration-200 font-hand ${completing ? 'line-through text-[var(--text-secondary)]' : ''}`}
          >
            {renderMarkdownLinks(task.title)}
          </span>
          {subtaskCount && (
            <span className="text-xs text-[var(--text-secondary)] mt-0.5">
              {t('subtaskProgress', {
                completed: subtaskCount.completed,
                total: subtaskCount.total,
              })}
            </span>
          )}
        </div>
        <ActionButtons {...actionProps} />
      </div>
    )
  }

  // 第三个及之后：无背景，只有 checkbox + 文字
  return (
    <div
      className={`group flex items-center gap-3 py-1.5 px-3 transition-all duration-300 ease-out opacity-50 hover:opacity-80 ${completingClass}`}
      style={{
        marginLeft: offset.marginLeft,
        marginRight: offset.marginRight,
      }}
    >
      <TaskCheckbox
        completing={completing}
        onComplete={() => handleComplete(task)}
        variant="default"
        disabled={completing}
      />
      <span
        className={`text-sm text-[var(--text-primary)] transition-all duration-200 ${completing ? 'line-through text-[var(--text-secondary)]' : ''}`}
      >
        {renderMarkdownLinks(task.title)}
      </span>
      <ActionButtons {...actionProps} className="ml-auto" />
    </div>
  )
})

interface FocusTaskListProps {
  immersive?: boolean
  currentTaskId?: string | null
  onStartPomodoro?: (task: Task) => void
  onBindTask?: (task: Task) => void
  isIdle?: boolean
}

export function FocusTaskList({
  immersive,
  currentTaskId,
  onStartPomodoro,
  onBindTask,
  isIdle,
}: FocusTaskListProps) {
  const { t } = useTranslation('focus')
  const { t: tCommon } = useTranslation('common')
  const { isGuest } = useAppMode()

  const { data, actions, views } = useTaskContext()
  const { tasks, loading: tasksLoading, taskMap } = data
  const { completeTask, createTask } = actions
  const { focusTasks } = views

  const displayTasks = useMemo(() => {
    if (immersive && currentTaskId) {
      return focusTasks.filter((t) => t.id === currentTaskId)
    }
    return focusTasks
  }, [immersive, currentTaskId, focusTasks])

  const { childCountMap, childrenMap } = useMemo(() => {
    const countMap = new Map<string, { total: number; completed: number }>()
    const listMap = new Map<string, Task[]>()
    for (const task of tasks) {
      if (task.parentId) {
        const entry = countMap.get(task.parentId) ?? { total: 0, completed: 0 }
        entry.total++
        if (task.status === 2) entry.completed++
        countMap.set(task.parentId, entry)

        const list = listMap.get(task.parentId) ?? []
        list.push(task)
        listMap.set(task.parentId, list)
      }
    }
    return { childCountMap: countMap, childrenMap: listMap }
  }, [tasks])

  const loading = tasksLoading && tasks.length === 0
  const canAddMore = isGuest ? focusTasks.length < MAX_LOCAL_TASKS : true
  const focusingUnbound = !!immersive && !currentTaskId

  const handleCreate = useCallback(
    async (taskData: Partial<Task>): Promise<Task | null> => {
      try {
        return await createTask(taskData)
      } catch (err) {
        if (err instanceof Error && err.message.includes('上限')) {
          message.warning(tCommon('message.taskLimitReached'))
        }
        return null
      }
    },
    [createTask, tCommon]
  )

  return (
    <div className="mt-4 w-full max-w-lg">
      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Spin />
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] text-lg">
            {t('empty')}
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-[fadeSlideIn_0.3s_ease-out_both]"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {index === 0 && displayTasks.length > 1 && (
                  <div className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-secondary)] text-center mb-2 opacity-50">
                    {t('label.currentFocus')}
                  </div>
                )}
                {index === 1 && (
                  <div className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-secondary)] text-center mb-2 mt-2 opacity-50">
                    {t('label.upNext')}
                  </div>
                )}
                <FocusTaskItem
                  task={task}
                  rank={index}
                  parentTitle={getParentTitle(task, taskMap)}
                  childInfo={childCountMap.get(task.id)}
                  children={childrenMap.get(task.id)}
                  onComplete={completeTask}
                  onCompleteChild={completeTask}
                  onStartPomodoro={onStartPomodoro}
                  onBindTask={onBindTask}
                  isIdle={isIdle}
                  isFocusingUnbound={focusingUnbound}
                  isHighlighted={
                    currentTaskId ? task.id === currentTaskId : false
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${immersive ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}
      >
        <FocusTaskInput
          isGuestMode={isGuest}
          canAddMore={canAddMore}
          taskCount={focusTasks.length}
          onCreate={handleCreate}
          showRefresh={!isGuest}
        />
      </div>
    </div>
  )
}
