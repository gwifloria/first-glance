import { FILTER_NAMES } from '@/constants/task'
import { getSettings } from '@/services/settingsStorage'
import { useTaskContext } from '@/contexts/TaskContext'
import { resolveDefaultProjectId } from '@/utils/project'
import type { Task } from '@/types'
import { formatDateStr } from '@/utils/date'
import { SurfaceInput } from '../common'
import { LoadingOutlined } from '@ant-design/icons'
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
  const { data } = useTaskContext()
  const [quickAddValue, setQuickAddValue] = useState('')
  const [creating, setCreating] = useState(false)

  const handleQuickAdd = async () => {
    if (creating || !quickAddValue.trim()) return

    setCreating(true)
    try {
      await submitQuickAdd()
      setQuickAddValue('')
    } finally {
      setCreating(false)
    }
  }

  const submitQuickAdd = async () => {
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
      // today/tomorrow 用默认清单；收集箱当作未指定（resolveDefaultProjectId 内处理）
      projectId = resolveDefaultProjectId(
        settings.defaultProjectId,
        data.projects
      )
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
  }

  return (
    <div className="mb-6">
      <SurfaceInput
        placeholder={t('placeholder.quickAdd')}
        value={quickAddValue}
        onChange={(e) => setQuickAddValue(e.target.value)}
        onPressEnter={handleQuickAdd}
        disabled={creating}
        className="quick-add-input"
        variant="borderless"
        suffix={
          creating ? (
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
          )
        }
      />
    </div>
  )
})
