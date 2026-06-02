import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingOutlined } from '@ant-design/icons'
import { formatDateStr } from '@/utils/date'
import { getSettings } from '@/services/settingsStorage'
import { useTaskContext } from '@/contexts/TaskContext'
import { resolveDefaultProjectId } from '@/utils/project'
import { RefreshButton } from '../common/RefreshButton'
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
  const { data } = useTaskContext()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || creating) return

    setCreating(true)
    try {
      // Focus View 始终用默认清单；收集箱当作未指定，交给 adapter 落到收集箱
      const settings = await getSettings()
      const projectId = resolveDefaultProjectId(
        settings.defaultProjectId,
        data.projects
      )

      // 全天任务，使用纯日期字符串
      const dueDate = formatDateStr(new Date())

      const result = await onCreate({
        title: newTaskTitle.trim(),
        projectId,
        dueDate,
        priority: 5, // 最高优先级
      })
      // 只有创建成功才清空输入框
      if (result) {
        setNewTaskTitle('')
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-1">
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
          className="flex-1 text-center text-[var(--text-secondary)] placeholder:text-[var(--text-secondary)] bg-transparent border-0 border-b border-[var(--border)] py-2 text-sm outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
        />
        {creating && (
          <LoadingOutlined
            className="text-[var(--accent)] shrink-0"
            style={{ fontSize: 14 }}
          />
        )}
        {showRefresh && <RefreshButton className="shrink-0" />}
      </div>
      {/* 访客模式限制提示 */}
      {isGuestMode && (
        <div className="text-xs text-[var(--text-secondary)] text-center mt-2 opacity-60">
          {canAddMore
            ? t('guestLimit.available', {
                remaining: 3 - taskCount,
              })
            : t('guestLimit.unlock')}
        </div>
      )}
    </div>
  )
}
