import { FILTER_NAMES } from '@/constants/task'
import { getSettings, subscribeSettings } from '@/services/settingsStorage'
import { useTaskContext } from '@/contexts/TaskContext'
import { projectDisplayName, resolveQuickAddProjectId } from '@/utils/project'
import type { Task } from '@/types'
import { formatDateStr } from '@/utils/date'
import { SurfaceInput, useJournalToast } from '../common'
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

  // 默认清单可在设置里随时改，订阅保持「目的地提示」实时
  useEffect(() => {
    getSettings().then((s) => setDefaultProjectId(s.defaultProjectId))
    return subscribeSettings((s) => setDefaultProjectId(s.defaultProjectId))
  }, [])

  // 当前回车会落到哪个清单（与提交逻辑同一真相源）
  const destination = useMemo(
    () =>
      projectDisplayName(
        resolveQuickAddProjectId(filter, defaultProjectId, data.projects),
        data.projects,
        tc('quickAdd.inbox')
      ),
    [filter, defaultProjectId, data.projects, tc]
  )

  const handleQuickAdd = async () => {
    if (creating || !quickAddValue.trim()) return

    setCreating(true)
    try {
      const projectId = resolveQuickAddProjectId(
        filter,
        defaultProjectId,
        data.projects
      )

      // 根据 filter 设置 dueDate（全天任务，纯日期字符串）；inbox/项目不设默认日期
      let dueDate: string | undefined
      if (filter === FILTER_NAMES.TODAY) {
        dueDate = formatDateStr(new Date())
      } else if (filter === FILTER_NAMES.TOMORROW) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        dueDate = formatDateStr(tomorrow)
      }

      await onCreate({ title: quickAddValue.trim(), projectId, dueDate })
      setQuickAddValue('')
      showSaved(tc('quickAdd.added', { list: destination }), '˚ ✎')
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
          creating ? tc('quickAdd.saving') : t('placeholder.quickAdd')
        }
        // 保存中清空显示，让占位的「记下来…」浮现
        value={creating ? '' : quickAddValue}
        onChange={(e) => setQuickAddValue(e.target.value)}
        onPressEnter={handleQuickAdd}
        disabled={creating}
        className={`quick-add-input ${creating ? 'is-saving' : ''}`}
        variant="borderless"
        suffix={
          creating ? (
            <LoadingOutlined
              className="text-[var(--accent)]"
              style={{ fontSize: 14 }}
            />
          ) : (
            <span className="flex items-center gap-2">
              <span
                className="text-[0.6875rem] text-[var(--text-secondary)] max-w-[7rem] truncate"
                title={destination}
              >
                {tc('quickAdd.destination', { list: destination })}
              </span>
              <span
                className="text-[0.6875rem] text-[var(--text-secondary)] bg-[var(--bg-secondary)] py-0.5 px-1.5 rounded cursor-pointer hover:bg-[var(--border)]"
                onClick={onOpenEditor}
              >
                +
              </span>
            </span>
          )
        }
      />
    </div>
  )
})
