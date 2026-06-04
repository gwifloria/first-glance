import {
  FILTER_NAMES,
  getPriorityOptions,
  TASK_PRIORITY,
} from '@/constants/task'
import {
  getSettings,
  setSettings,
  subscribeSettings,
} from '@/services/settingsStorage'
import { useTaskContext } from '@/contexts/TaskContext'
import {
  describeDestination,
  isInboxProject,
  isListContextFilter,
  resolveQuickAddProjectId,
} from '@/utils/project'
import { useEllipsis } from '@/hooks'
import type { Task } from '@/types'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  SurfaceInput,
  ProjectChip,
  DateChip,
  PriorityChip,
  useJournalToast,
} from '../common'
import { LoadingOutlined } from '@ant-design/icons'
import { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface QuickAddInputProps {
  filter: string
  onCreate: (task: Partial<Task>) => Promise<Task>
  onOpenEditor: () => void
}

export const QuickAddInput = memo(function QuickAddInput({
  filter,
  onCreate,
  onOpenEditor,
}: QuickAddInputProps) {
  const { t } = useTranslation('task')
  const { t: tc } = useTranslation('common')
  const { data } = useTaskContext()
  const { showSaved, showError } = useJournalToast()
  const [quickAddValue, setQuickAddValue] = useState('')
  const [creating, setCreating] = useState(false)
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null)
  // 日期/优先级是每条独立的本次选择；项目在「清单类视图」是本次临时覆盖，
  // 在「日期/智能视图」则直接绑定默认清单（见下方 handleSelectProject）
  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [projectTouched, setProjectTouched] = useState(false)
  const [dueDate, setDueDate] = useState<Dayjs | null>(null)
  const [dateTouched, setDateTouched] = useState(false)
  const [priority, setPriority] = useState<number>(TASK_PRIORITY.NONE)
  const dots = useEllipsis(creating)
  const priorityOptions = useMemo(() => getPriorityOptions(t), [t])

  // 清单类视图（项目/收集箱）：改 chip 只是本次临时覆盖；日期/智能视图：改 chip = 改默认清单（持久）
  const isListContextView = isListContextFilter(filter)

  // 默认清单可在设置里随时改，订阅保持实时
  useEffect(() => {
    getSettings().then((s) => setDefaultProjectId(s.defaultProjectId))
    return subscribeSettings((s) => setDefaultProjectId(s.defaultProjectId))
  }, [])

  // 切换视图时清掉「本次临时覆盖」（项目的临时覆盖 + 日期/优先级），回到跟随视图的默认。
  // 注意：日期/智能视图里改项目走的是持久默认清单，不在这里被清掉。
  useEffect(() => {
    setProjectTouched(false)
    setDateTouched(false)
    setDueDate(null)
    setPriority(TASK_PRIORITY.NONE)
  }, [filter])

  // 跟随视图的默认日期：今天/明天视图给对应日期，其余无日期
  const defaultDate =
    filter === FILTER_NAMES.TODAY
      ? dayjs()
      : filter === FILTER_NAMES.TOMORROW
        ? dayjs().add(1, 'day')
        : null

  // 生效项目：清单类视图且改过 → 本次临时覆盖；否则跟随视图默认
  // （日期/智能视图的默认 = resolveQuickAddProjectId 解析出的默认清单，改它已写进 settings，会自动反映）
  const effectiveProjectId =
    isListContextView && projectTouched
      ? projectId
      : resolveQuickAddProjectId(filter, defaultProjectId, data.projects)
  const effectiveDate = dateTouched ? dueDate : defaultDate

  const destination = useMemo(
    () =>
      describeDestination(
        effectiveProjectId,
        data.projects,
        tc('quickAdd.inbox')
      ),
    [effectiveProjectId, data.projects, tc]
  )

  const handleSelectProject = (id: string | undefined) => {
    if (isListContextView) {
      // 清单类视图：仅本次临时覆盖，不动默认清单
      setProjectId(id)
      setProjectTouched(true)
    } else {
      // 日期/智能视图：改 chip = 改默认清单（持久，与 FocusView/左下角双向一致）。
      // 收集箱归一为 null，不存 inbox 真实 id。
      const project = data.projects.find((p) => p.id === id)
      const normalized = !id || isInboxProject(project) ? null : id
      setDefaultProjectId(normalized)
      void setSettings({ defaultProjectId: normalized })
    }
  }
  const handleSelectDate = (d: Dayjs | null) => {
    setDueDate(d)
    setDateTouched(true)
  }

  const handleQuickAdd = async () => {
    if (creating || !quickAddValue.trim()) return

    setCreating(true)
    try {
      // 收集箱按「未指定」交给 adapter 落收集箱，不硬传可能特殊的 inbox id
      const submitProjectId = destination.isInbox
        ? undefined
        : effectiveProjectId

      await onCreate({
        title: quickAddValue.trim(),
        projectId: submitProjectId,
        dueDate: effectiveDate ? effectiveDate.format('YYYY-MM-DD') : undefined,
        priority,
      })
      setQuickAddValue('')
      // 重置回「跟随视图」默认
      setProjectTouched(false)
      setDateTouched(false)
      setDueDate(null)
      setPriority(TASK_PRIORITY.NONE)
      showSaved(tc('quickAdd.added', { list: destination.name }), '˚ ✎')
    } catch {
      // createTask 已写入 error 状态，这里再给一张轻提示贴纸，避免用户以为加成功了
      showError(tc('quickAdd.failed'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mb-6">
      <SurfaceInput
        placeholder={
          creating
            ? `${tc('quickAdd.saving')}${dots}`
            : t('placeholder.quickAdd')
        }
        // 保存中清空显示，让占位的「记下来…」浮现
        value={creating ? '' : quickAddValue}
        onChange={(e) => setQuickAddValue(e.target.value)}
        onPressEnter={handleQuickAdd}
        disabled={creating}
        className={`quick-add-input ${creating ? 'is-saving' : ''}`}
        variant="borderless"
        suffix={
          // 固定高度槽位：保存态转圈与常态「+」按钮高度不同，不固定会让输入框高度跳动
          <span className="inline-flex h-[18px] items-center justify-center">
            {creating ? (
              <LoadingOutlined
                className="text-[var(--accent)]"
                style={{ fontSize: 14 }}
              />
            ) : (
              <span
                className="text-[0.6875rem] text-[var(--text-secondary)] bg-[var(--bg-secondary)] py-0.5 px-1.5 rounded cursor-pointer hover:bg-[var(--border)]"
                onClick={onOpenEditor}
              >
                +
              </span>
            )}
          </span>
        }
      />
      {/* 输入框下方的 chip 工具栏：目的地 / 日期 / 优先级都可点改，默认跟随当前视图。
          保存中保留占位、变暗、禁用——直接卸载会让下方布局往上跳 */}
      <div
        className={`flex items-center gap-3 mt-2 px-1 transition-opacity ${
          creating ? 'opacity-50 pointer-events-none' : ''
        }`}
        aria-disabled={creating}
      >
        <ProjectChip
          value={effectiveProjectId}
          onChange={handleSelectProject}
          projects={data.projects}
          inboxLabel={tc('quickAdd.inbox')}
        />
        <DateChip value={effectiveDate} onChange={handleSelectDate} />
        <PriorityChip
          value={priority}
          onChange={setPriority}
          options={priorityOptions}
        />
      </div>
    </div>
  )
})
