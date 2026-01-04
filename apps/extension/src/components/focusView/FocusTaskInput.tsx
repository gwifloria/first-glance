import { useState } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatDateStr } from '@/utils/date'
import type { Task, LocalTask } from '@/types'

interface FocusTaskInputProps {
  isGuestMode: boolean
  canAddMore: boolean
  taskCount: number
  onCreate: (task: Partial<Task>) => Promise<Task | LocalTask | null>
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
