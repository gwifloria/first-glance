import type { FocusStatsData, FocusSession } from '@/services/focusStats'

/**
 * 锁定态（非会员）展示用的静态示意数据。
 * 故意用确定性的伪造数据，避免把用户真实记录渲染进 DOM 后仅靠 CSS 模糊遮挡。
 */
const DAY_MS = 24 * 60 * 60 * 1000
// 偏好时段：上午、午后、晚间，形成可辨认的分布形状
const SAMPLE_HOURS = [9, 9, 10, 10, 11, 14, 15, 15, 16, 21, 22]
// 示意任务（标题 + 优先级 0/1/3/5），让锁定态日志看起来真实
const SAMPLE_TASKS: { title: string; priority: number }[] = [
  { title: 'Deep work · 写作', priority: 5 },
  { title: '阅读《心流》', priority: 3 },
  { title: 'Inbox zero', priority: 1 },
  { title: '代码 review', priority: 3 },
  { title: '复盘与规划', priority: 5 },
  { title: '学习新框架', priority: 0 },
]

function buildSampleSessions(): FocusSession[] {
  const sessions: FocusSession[] = []
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  for (let d = 89; d >= 0; d--) {
    // 确定性"伪随机"：每 7 天一个低谷，间或休息日
    const wave = (Math.sin(d / 4) + 1) * 2.5 // 0–5 起伏
    const rest = d % 9 === 0 && d > 9 // 周期性休息日
    const count = rest ? 0 : Math.round(wave) + (d % 3)

    const dayStart = todayStart.getTime() - d * DAY_MS
    for (let i = 0; i < count; i++) {
      const hour = SAMPLE_HOURS[(d + i) % SAMPLE_HOURS.length]
      const task = SAMPLE_TASKS[(d + i) % SAMPLE_TASKS.length]
      sessions.push({
        timestamp: dayStart + hour * 3600000 + ((i * 17) % 60) * 60000,
        duration: 25,
        taskId: `sample-${(d + i) % SAMPLE_TASKS.length}`,
        taskTitle: task.title,
        priority: task.priority,
      })
    }
  }
  return sessions
}

export const SAMPLE_STATS: FocusStatsData = { sessions: buildSampleSessions() }
