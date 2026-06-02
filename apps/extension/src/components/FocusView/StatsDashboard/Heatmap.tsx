import { Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  getHeatmapData,
  getLongestStreak,
  type HeatmapDay,
  type FocusStatsData,
} from '@/services/focusStats'
import { SectionLabel } from '../../common/SectionLabel'

const RANGE_DAYS = 90
const CELL = 11 // 格子边长（px），固定小尺寸走紧凑 GitHub 风
const GAP = 3 // 格子间距（px）
/** 周标签只显示周一/三/五（Mon-first 的 0/2/4），其余留空，对齐 GitHub */
const WEEKDAY_SHOW = [0, 2, 4]

/** count → 0-4 强度档 */
function intensityLevel(count: number): number {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 6) return 3
  return 4
}

const LEVEL_OPACITY = [0, 0.3, 0.55, 0.8, 1]

function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/** 切成「周列」：每列 7 行（周一→周日），首列用 null 补齐 */
function toWeeks(days: HeatmapDay[]): (HeatmapDay | null)[][] {
  const weeks: (HeatmapDay | null)[][] = []
  let current: (HeatmapDay | null)[] = new Array(7).fill(null)
  for (const day of days) {
    const dow = mondayIndex(day.date)
    if (dow === 0 && current.some((c) => c !== null)) {
      weeks.push(current)
      current = new Array(7).fill(null)
    }
    current[dow] = day
  }
  if (current.some((c) => c !== null)) weeks.push(current)
  return weeks
}

/** 每个周列对应的月份标签：仅在月份切换的列显示 */
function monthLabels(
  weeks: (HeatmapDay | null)[][],
  fmt: Intl.DateTimeFormat
): string[] {
  let prevMonth = -1
  return weeks.map((week) => {
    const first = week.find((d) => d !== null)
    if (!first) return ''
    const m = first.date.getMonth()
    if (m !== prevMonth) {
      prevMonth = m
      return fmt.format(first.date)
    }
    return ''
  })
}

function Cell({ level }: { level: number }) {
  return (
    <div
      style={{
        width: CELL,
        height: CELL,
        borderRadius: 3,
        backgroundColor:
          level === 0 ? 'var(--surface-raised)' : 'var(--accent)',
        opacity: level === 0 ? 1 : LEVEL_OPACITY[level],
        border: level === 0 ? '1px solid var(--border)' : 'none',
      }}
    />
  )
}

/** 右侧 insight 单条 */
function Insight({
  value,
  hint,
  label,
}: {
  value: string | number
  hint?: string
  label: string
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
          {value}
        </span>
        {hint && (
          <span className="text-[11px] text-[var(--text-secondary)]">
            {hint}
          </span>
        )}
      </div>
      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
        {label}
      </div>
    </div>
  )
}

export function Heatmap({ data }: { data: FocusStatsData }) {
  const { t, i18n } = useTranslation('focus')
  const days = getHeatmapData(data, RANGE_DAYS)
  const weeks = toWeeks(days)
  const activeDays = days.filter((d) => d.count > 0).length
  const maxDay = days.reduce((m, d) => Math.max(m, d.count), 0)
  const longestStreak = getLongestStreak(data, RANGE_DAYS)

  const dayNames = t('stats.days', { returnObjects: true }) as string[]
  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  })
  const monthFmt = new Intl.DateTimeFormat(i18n.language, { month: 'short' })
  const months = monthLabels(weeks, monthFmt)

  const colTemplate = `repeat(${weeks.length}, ${CELL}px)`

  return (
    <div>
      <SectionLabel className="mb-3">{t('stats.heatmap.title')}</SectionLabel>

      <div className="flex gap-5">
        {/* 左：紧凑热力图 */}
        <div className="shrink-0">
          {/* 月份标签行（左侧留出周标签槽位） */}
          <div className="flex mb-1" style={{ gap: GAP }}>
            <div className="w-7 shrink-0" />
            <div
              className="grid"
              style={{ gridTemplateColumns: colTemplate, gap: GAP }}
            >
              {months.map((m, i) => (
                <div
                  key={i}
                  className="text-[9px] text-[var(--text-secondary)] leading-none whitespace-nowrap"
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* 周标签 + 网格 */}
          <div className="flex" style={{ gap: GAP }}>
            <div
              className="w-7 shrink-0 flex flex-col items-end pr-1"
              style={{ gap: GAP }}
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="text-[9px] text-[var(--text-secondary)]"
                  style={{ height: CELL, lineHeight: `${CELL}px` }}
                >
                  {WEEKDAY_SHOW.includes(i) ? dayNames?.[i] : ''}
                </div>
              ))}
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: colTemplate, gap: GAP }}
            >
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day, di) => {
                    if (!day)
                      return (
                        <div key={di} style={{ width: CELL, height: CELL }} />
                      )
                    const level = intensityLevel(day.count)
                    const title =
                      day.count > 0
                        ? `${dateFmt.format(day.date)} · ${t('stats.heatmap.tooltip', { count: day.count })}`
                        : dateFmt.format(day.date)
                    return (
                      <Tooltip key={di} title={title}>
                        <div>
                          <Cell level={level} />
                        </div>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-1 mt-3 text-[9px] text-[var(--text-secondary)]">
            <span>{t('stats.heatmap.less')}</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <Cell key={l} level={l} />
            ))}
            <span>{t('stats.heatmap.more')}</span>
          </div>
        </div>

        {/* 右：insight 栏，填充空白并补充信息 */}
        <div className="flex-1 flex flex-col justify-center gap-4 min-w-0">
          <Insight
            value={activeDays}
            hint={`/ ${RANGE_DAYS}`}
            label={t('stats.heatmap.activeDays')}
          />
          <Insight value={maxDay} label={t('stats.heatmap.maxDay')} />
          <Insight
            value={longestStreak}
            hint={t('stats.heatmap.dayUnit')}
            label={t('stats.heatmap.longestStreak')}
          />
        </div>
      </div>
    </div>
  )
}
