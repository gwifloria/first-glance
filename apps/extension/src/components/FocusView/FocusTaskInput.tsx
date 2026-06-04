import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  getSettings,
  setSettings,
  subscribeSettings,
} from '@/services/settingsStorage'
import { useTaskContext } from '@/contexts/TaskContext'
import {
  describeDestination,
  isInboxProject,
  resolveDefaultProjectId,
} from '@/utils/project'
import { getPriorityOptions, TASK_PRIORITY } from '@/constants/task'
import { useEllipsis } from '@/hooks'
import { RefreshButton } from '../common/RefreshButton'
import { ProjectChip, DateChip, PriorityChip, useJournalToast } from '../common'
import type { Task } from '@/types'

interface FocusTaskInputProps {
  isGuestMode: boolean
  canAddMore: boolean
  taskCount: number
  onCreate: (task: Partial<Task>) => Promise<Task | null>
  showRefresh?: boolean
}

export function FocusTaskInput({
  isGuestMode,
  canAddMore,
  taskCount,
  onCreate,
  showRefresh,
}: FocusTaskInputProps) {
  const { t } = useTranslation('focus')
  const { t: tc } = useTranslation('common')
  const { data } = useTaskContext()
  const { showSaved, showError } = useJournalToast()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null)
  // 日期 + 优先级默认（今天 / 高），每次创建后重置——它们天然 per-task
  const [dueDate, setDueDate] = useState<Dayjs | null>(dayjs())
  const [priority, setPriority] = useState<number>(TASK_PRIORITY.HIGH)
  const dots = useEllipsis(creating)
  const priorityOptions = useMemo(() => getPriorityOptions(t), [t])

  // 默认清单可在设置里随时改，订阅保持实时
  useEffect(() => {
    getSettings().then((s) => setDefaultProjectId(s.defaultProjectId))
    return subscribeSettings((s) => setDefaultProjectId(s.defaultProjectId))
  }, [])

  // FocusView 无视图上下文，项目即「默认清单」：直接读 settings.defaultProjectId，
  // 改它 = 改默认清单（与左下角同一真相源，不重置、不泄漏、不会 desync）
  const effectiveProjectId = resolveDefaultProjectId(
    defaultProjectId,
    data.projects
  )

  const destination = useMemo(
    () =>
      describeDestination(
        effectiveProjectId,
        data.projects,
        tc('quickAdd.inbox')
      ),
    [effectiveProjectId, data.projects, tc]
  )

  // 元信息 chip 常驻（目的地仅连接模式有意义）；保存中变暗禁用而非卸载，避免布局抖动
  const showDestination = !isGuestMode

  // 改 FocusView 项目 = 改默认清单：写进 settings，左下角 / ListView 智能列表 / New Task 弹窗同步。
  // 收集箱归一为 null（与 resolveDefaultProjectId 语义一致），不把 inbox 真实 id 存进默认清单。
  // 乐观更新本地态，subscribeSettings 回来也会再同步一次。
  const handleSelectProject = (id: string | undefined) => {
    const project = data.projects.find((p) => p.id === id)
    const normalized = !id || isInboxProject(project) ? null : id
    setDefaultProjectId(normalized)
    void setSettings({ defaultProjectId: normalized })
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || creating) return

    setCreating(true)
    try {
      // 收集箱按「未指定」交给 adapter 落收集箱，不硬传一个可能特殊的 inbox id
      const submitProjectId = destination.isInbox
        ? undefined
        : effectiveProjectId

      const result = await onCreate({
        title: newTaskTitle.trim(),
        projectId: submitProjectId,
        // 全天任务，纯日期字符串；可被 chip 改成其它日期或清空
        dueDate: dueDate ? dueDate.format('YYYY-MM-DD') : undefined,
        priority,
      })

      // 只有创建成功才清空输入框 + 报喜；失败（如访客上限）给一张轻提示贴纸
      if (result) {
        setNewTaskTitle('')
        // 日期/优先级回到默认（今天 + 高）；项目不重置——它就是默认清单，保持你设的
        setDueDate(dayjs())
        setPriority(TASK_PRIORITY.HIGH)
        showSaved(tc('quickAdd.added', { list: destination.name }), '˚ ✎')
      } else {
        showError(tc('quickAdd.failed'))
      }
    } catch {
      showError(tc('quickAdd.failed'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-1">
        <input
          type="text"
          // 保存中清空显示，让占位的「记下来…」浮现
          value={creating ? '' : newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
          placeholder={
            creating
              ? `${tc('quickAdd.saving')}${dots}`
              : isGuestMode && !canAddMore
                ? t('placeholder.connectToAdd')
                : t('placeholder.addFocus')
          }
          disabled={creating || (isGuestMode && !canAddMore)}
          className={`flex-1 text-center text-[var(--text-secondary)] placeholder:text-[var(--text-secondary)] bg-transparent border-0 border-b border-[var(--border)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50 ${creating ? 'task-add-saving' : ''}`}
        />
        {creating && (
          <LoadingOutlined
            className="text-[var(--accent)] shrink-0"
            style={{ fontSize: 14 }}
          />
        )}
        {/* 元信息 chip 随输入框同行：目的地 / 日期 / 优先级都可点改，
            把原本隐性的「默认清单 + 今天 + 高优先级」摊开。
            保存中变暗禁用而非卸载，避免布局抖动 */}
        <span
          className={`flex items-center gap-2 transition-opacity ${
            creating ? 'opacity-50 pointer-events-none' : ''
          }`}
          aria-disabled={creating}
        >
          {showDestination && (
            <ProjectChip
              value={effectiveProjectId}
              onChange={handleSelectProject}
              projects={data.projects}
              inboxLabel={tc('quickAdd.inbox')}
            />
          )}
          <DateChip value={dueDate} onChange={setDueDate} />
          <PriorityChip
            value={priority}
            onChange={setPriority}
            options={priorityOptions}
          />
        </span>
        {showRefresh && <RefreshButton className="shrink-0" />}
      </div>
      {/* 访客模式限制提示（连接模式的目的地已移到输入框同行 chip） */}
      {isGuestMode && (
        <div className="text-xs text-[var(--text-secondary)] text-center mt-2 opacity-60">
          {canAddMore
            ? t('guestLimit.available', { remaining: 3 - taskCount })
            : t('guestLimit.unlock')}
        </div>
      )}
    </div>
  )
}
