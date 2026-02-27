import { useState } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatDateStr } from '@/utils/date'
import { getSettings } from '@/services/settingsStorage'
import type { Task } from '@/types'

interface FocusTaskInputProps {
  isGuestMode: boolean
  canAddMore: boolean
  taskCount: number
  onCreate: (task: Partial<Task>) => Promise<Task | null>
}

export function FocusTaskInput({
  isGuestMode,
  canAddMore,
  taskCount,
  onCreate,
}: FocusTaskInputProps) {
  const { t } = useTranslation('focus')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || creating) return

    setCreating(true)
    try {
      // 获取 defaultProjectId
      const settings = await getSettings()
      let projectId: string | undefined

      // Focus View 始终使用 defaultProjectId
      // 如果 defaultProjectId 是 inbox 或未设置，不传 projectId（API 默认放到 inbox）
      const isInbox =
        !settings.defaultProjectId ||
        settings.defaultProjectId.startsWith('inbox')
      if (!isInbox && settings.defaultProjectId) {
        projectId = settings.defaultProjectId
      }

      // 今天凌晨 + 时区（由 adapter transform 处理时区附加）
      const dueDate = `${formatDateStr(new Date())}T00:00:00`

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
        className="!mx-auto !mt-2 !flex"
      />
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
