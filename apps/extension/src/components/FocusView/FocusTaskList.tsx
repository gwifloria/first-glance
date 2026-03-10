import { useAppMode } from '@/contexts/useAppMode'
import { useTaskContext } from '@/contexts/TaskContext'
import { useTaskCompletion } from '@/hooks/useTaskCompletion'
import { getParentTitle } from '@/utils/taskMap'
import { renderMarkdownLinks } from '@/utils/renderMarkdownLinks'
import { parseContent, contentToSummary } from '@/utils/contentRendering'
import type { Task } from '@/types'
import { Button, Checkbox, message, Popover, Spin } from 'antd'
import { AimOutlined } from '@ant-design/icons'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskCheckbox } from '../common/TaskCheckbox'
import { TomatoIcon } from './TomatoIcon'
import { FocusTaskInput } from './FocusTaskInput'

const MAX_LOCAL_TASKS = 3

// 层层收窄：每级左右 margin 递增，视觉上形成层叠感
const RANK_OFFSETS = [
  { marginLeft: '0%', marginRight: '0%' },
  { marginLeft: '5%', marginRight: '10%' },
  { marginLeft: '12%', marginRight: '8%' },
  { marginLeft: '15%', marginRight: '14%' },
  { marginLeft: '18%', marginRight: '12%' },
]

const CONTENT_POPOVER_CLASS =
  'max-w-[320px] max-h-[240px] overflow-y-auto text-sm leading-relaxed text-[var(--text-primary)] [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1 [&_a]:text-[var(--accent)] [&_a]:underline [&_code]:bg-[var(--bg-secondary)] [&_code]:px-1 [&_code]:rounded [&_s]:line-through [&_del]:line-through [&_mark]:bg-[var(--accent-light)] [&_mark]:text-[var(--text-primary)] [&_mark]:px-0.5 [&_mark]:rounded-sm'

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
          icon={<TomatoIcon size={14} />}
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

// 子任务进度文字（hero 和中号卡片共用）
function SubtaskSummaryText({
  checklistCount,
  remainingChildren,
}: {
  checklistCount: { completed: number; total: number } | null
  remainingChildren: number
}) {
  const { t } = useTranslation('focus')
  return (
    <>
      {checklistCount &&
        t('subtaskProgress', {
          completed: checklistCount.completed,
          total: checklistCount.total,
        })}
      {checklistCount && remainingChildren > 0 && ' · '}
      {remainingChildren > 0 &&
        t('childTaskRemaining', { count: remainingChildren })}
    </>
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
    <div className="max-w-[200px] space-y-1.5 card-surface">
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
}

// rank 样式参数
const RANK_STYLES = [
  {
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
    fontWeight: 600,
    py: 32,
    px: 32,
    gap: 20,
    opacity: 1,
  },
  {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 400,
    py: 12,
    px: 16,
    gap: 16,
    opacity: 1,
  },
  {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 400,
    py: 6,
    px: 12,
    gap: 12,
    opacity: 0.5,
  },
] as const

// 过渡动画常量（模块级，避免每次渲染重建字符串）
const T = '600ms cubic-bezier(0.4, 0, 0.2, 1)'
const TRANSITION_CARD = `padding ${T}, margin ${T}, background-color ${T}, opacity ${T}`
const TRANSITION_TITLE = `font-size ${T}, line-height ${T}, font-weight ${T}, color 300ms ease`
const TRANSITION_REVEAL = `max-height ${T}, opacity ${T}, margin ${T}`

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
}: FocusTaskItemProps) {
  const { completing, handleComplete } = useTaskCompletion(onComplete, {
    delay: 800,
  })

  const checklistCount = useMemo(() => {
    if (!task.items || task.items.length === 0) return null
    const total = task.items.length
    const completed = task.items.filter((item) => item.status !== 0).length
    return { total, completed }
  }, [task.items])

  const remainingChildren = childInfo?.total ?? 0

  const { parsedContent, summaryText } = useMemo(() => {
    if (!task.content) return { parsedContent: '', summaryText: '' }
    return {
      parsedContent: parseContent(task.content),
      summaryText: contentToSummary(task.content),
    }
  }, [task.content])

  const offset = RANK_OFFSETS[Math.min(rank, RANK_OFFSETS.length - 1)]
  const style = RANK_STYLES[Math.min(rank, RANK_STYLES.length - 1)]
  const isHero = rank === 0
  const isCompact = rank >= 2
  const showContent = isHero && !!parsedContent
  const hasSubtasks = !!(checklistCount || remainingChildren > 0)
  const completingClass = completing
    ? 'animate-[taskComplete_0.8s_ease-in-out_forwards] overflow-hidden'
    : ''

  return (
    <div
      className={`group relative ${completingClass} ${isCompact ? '' : 'card-surface'}`}
      style={{
        padding: `${style.py}px ${style.px}px`,
        marginLeft: offset.marginLeft,
        marginRight: offset.marginRight,
        backgroundColor: isCompact ? 'transparent' : 'var(--bg-card)',
        opacity: style.opacity,
        transition: TRANSITION_CARD,
      }}
    >
      {isHero && <div className="card-tape" />}
      <div
        className="flex items-center"
        style={{ gap: `${style.gap}px`, transition: `gap ${T}` }}
      >
        <TaskCheckbox
          completing={completing}
          onComplete={() => handleComplete(task)}
          variant={isCompact ? 'default' : 'focus'}
          disabled={completing}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {parentTitle && (
            <span
              className="text-xs text-[var(--text-secondary)] leading-tight inline-flex items-center gap-0.5"
              style={{
                marginBottom: isHero ? 4 : 2,
                transition: `margin ${T}`,
              }}
            >
              <span className="opacity-60">↳</span> {parentTitle}
            </span>
          )}
          <span
            className={`text-[var(--text-primary)] font-hand leading-snug ${completing ? 'task-strike-through text-[var(--text-secondary)]' : ''}`}
            style={{
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
              fontWeight: style.fontWeight,
              transition: TRANSITION_TITLE,
            }}
          >
            {renderMarkdownLinks(task.title)}
          </span>
          {/* 内容摘要 - 仅 hero 可见 */}
          <div
            className="overflow-hidden"
            style={{
              maxHeight: showContent ? 40 : 0,
              opacity: showContent ? 1 : 0,
              marginTop: showContent ? 12 : 0,
              transition: TRANSITION_REVEAL,
            }}
          >
            {parsedContent && (
              <Popover
                placement="bottomLeft"
                trigger="hover"
                content={
                  <div
                    className={CONTENT_POPOVER_CLASS}
                    dangerouslySetInnerHTML={{ __html: parsedContent }}
                  />
                }
              >
                <p className="text-base text-[var(--text-secondary)] line-clamp-1 leading-relaxed cursor-default">
                  {summaryText}
                </p>
              </Popover>
            )}
          </div>
          {/* 子任务进度 */}
          {hasSubtasks && (
            <div
              className="overflow-hidden"
              style={{
                maxHeight: isCompact ? 0 : 40,
                opacity: isCompact ? 0 : 1,
                marginTop: isHero ? 16 : 2,
                transition: TRANSITION_REVEAL,
              }}
            >
              {isHero && checklistCount ? (
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
                  <div className="flex items-center gap-3 cursor-pointer group/progress">
                    <div className="flex-1 h-2.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden max-w-[160px]">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                        style={{
                          width: `${(checklistCount.completed / checklistCount.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)] group-hover/progress:text-[var(--text-primary)] transition-colors">
                      <SubtaskSummaryText
                        checklistCount={checklistCount}
                        remainingChildren={remainingChildren}
                      />
                    </span>
                  </div>
                </Popover>
              ) : (
                <span className="text-xs text-[var(--text-secondary)]">
                  <SubtaskSummaryText
                    checklistCount={checklistCount}
                    remainingChildren={remainingChildren}
                  />
                </span>
              )}
            </div>
          )}
        </div>
        <ActionButtons
          task={task}
          isIdle={isIdle}
          isFocusingUnbound={isFocusingUnbound}
          onStartPomodoro={onStartPomodoro}
          onBindTask={onBindTask}
          className={isCompact ? 'ml-auto' : ''}
        />
      </div>
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
    <div className="mt-4 w-full max-w-4xl">
      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Spin />
          </div>
        ) : focusTasks.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] text-lg">
            {t('empty')}
          </div>
        ) : (
          <div className="space-y-3">
            {focusTasks.map((task, index) => {
              const isSelected =
                currentTaskId != null && task.id === currentTaskId
              const shouldFadeOut = immersive && !isSelected

              return (
                <div
                  key={task.id}
                  className={`animate-[fadeSlideIn_0.3s_ease-out_both] transition-all duration-700 ease-in-out ${
                    shouldFadeOut
                      ? 'opacity-0 translate-y-6 max-h-0 overflow-hidden pointer-events-none'
                      : 'opacity-100 translate-y-0 max-h-[500px]'
                  }`}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {index === 0 && focusTasks.length > 1 && (
                    <div
                      className={`text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-secondary)] text-center mb-2 opacity-50 transition-opacity duration-700 ${immersive ? 'opacity-0' : ''}`}
                    >
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
                  />
                </div>
              )
            })}
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
