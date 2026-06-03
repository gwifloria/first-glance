import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingOutlined } from '@ant-design/icons'
import { formatDateStr } from '@/utils/date'
import { getSettings, subscribeSettings } from '@/services/settingsStorage'
import { useTaskContext } from '@/contexts/TaskContext'
import { projectDisplayName, resolveDefaultProjectId } from '@/utils/project'
import { RefreshButton } from '../common/RefreshButton'
import { useJournalToast } from '../common'
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

  // 默认清单可在设置里随时改，订阅保持「目的地提示」实时
  useEffect(() => {
    getSettings().then((s) => setDefaultProjectId(s.defaultProjectId))
    return subscribeSettings((s) => setDefaultProjectId(s.defaultProjectId))
  }, [])

  // Focus View 始终落默认清单；收集箱/未设置 → 收集箱
  const destination = useMemo(
    () =>
      projectDisplayName(
        resolveDefaultProjectId(defaultProjectId, data.projects),
        data.projects,
        tc('quickAdd.inbox')
      ),
    [defaultProjectId, data.projects, tc]
  )

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || creating) return

    setCreating(true)
    try {
      const projectId = resolveDefaultProjectId(defaultProjectId, data.projects)

      const result = await onCreate({
        title: newTaskTitle.trim(),
        projectId,
        dueDate: formatDateStr(new Date()), // 全天任务，纯日期字符串
        priority: 5, // 最高优先级
      })

      // 只有创建成功才清空输入框 + 报喜；失败（如访客上限）给一张轻提示贴纸
      if (result) {
        setNewTaskTitle('')
        showSaved(tc('quickAdd.added', { list: destination }), '˚ ✎')
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
              ? tc('quickAdd.saving')
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
        {showRefresh && <RefreshButton className="shrink-0" />}
      </div>
      {isGuestMode ? (
        // 访客模式限制提示
        <div className="text-xs text-[var(--text-secondary)] text-center mt-2 opacity-60">
          {canAddMore
            ? t('guestLimit.available', { remaining: 3 - taskCount })
            : t('guestLimit.unlock')}
        </div>
      ) : (
        // 连接模式：常驻「回车会落到哪个清单」提示
        <div className="text-xs text-[var(--text-secondary)] text-center mt-2 opacity-60 truncate">
          {tc('quickAdd.destination', { list: destination })}
        </div>
      )}
    </div>
  )
}
