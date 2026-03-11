import { FILTER_NAMES } from '@/constants/task'
import { getSettings } from '@/services/settingsStorage'
import type { Task } from '@/types'
import { formatDateStr } from '@/utils/date'
import { Input } from 'antd'
import { memo, useState } from 'react'
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
  const [quickAddValue, setQuickAddValue] = useState('')

  const handleQuickAdd = async () => {
    if (!quickAddValue.trim()) return

    const settings = await getSettings()
    let projectId: string | undefined
    let dueDate: string | undefined

    // 根据 filter 设置 projectId
    // 注意：不传 projectId 时，滴答清单 API 默认放到 inbox
    if (filter === 'inbox') {
      // inbox: 不传 projectId，API 默认放到 inbox
      projectId = undefined
    } else if (filter.startsWith('project:')) {
      // 选中具体项目时，使用该项目
      projectId = filter.replace('project:', '')
    } else {
      // today/tomorrow 使用 defaultProjectId
      // 如果 defaultProjectId 是 inbox 或未设置，不传 projectId（API 默认放到 inbox）
      const isInbox =
        !settings.defaultProjectId ||
        settings.defaultProjectId.startsWith('inbox')
      if (!isInbox && settings.defaultProjectId) {
        projectId = settings.defaultProjectId
      }
    }

    // 根据 filter 设置 dueDate（全天任务，纯日期字符串）
    if (filter === FILTER_NAMES.TODAY) {
      dueDate = formatDateStr(new Date())
    } else if (filter === FILTER_NAMES.TOMORROW) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      dueDate = formatDateStr(tomorrow)
    }
    // inbox 不设置默认日期

    await onCreate({
      title: quickAddValue.trim(),
      projectId,
      dueDate,
    })
    setQuickAddValue('')
  }

  return (
    <div className="mb-6">
      <Input
        placeholder={t('placeholder.quickAdd')}
        value={quickAddValue}
        onChange={(e) => setQuickAddValue(e.target.value)}
        onPressEnter={handleQuickAdd}
        className="quick-add-input"
        variant="borderless"
        suffix={
          <span
            className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] py-0.5 px-1.5 rounded cursor-pointer hover:bg-[var(--border)]"
            onClick={onOpenEditor}
          >
            +
          </span>
        }
      />
    </div>
  )
})
