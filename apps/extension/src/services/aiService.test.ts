import { describe, it, expect } from 'vitest'
import { formatTask, buildChildrenMap, buildTaskSummary } from './aiService'
import type { Task } from '@/types'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    projectId: 'proj-1',
    title: '测试任务',
    priority: 0,
    status: 0,
    sortOrder: 0,
    ...overrides,
  }
}

describe('formatTask', () => {
  it('只有标题', () => {
    expect(formatTask(makeTask())).toBe('- 测试任务')
  })

  it('带优先级', () => {
    expect(formatTask(makeTask({ priority: 5 }))).toBe('- 测试任务 [优先级:高]')
    expect(formatTask(makeTask({ priority: 3 }))).toBe('- 测试任务 [优先级:中]')
    expect(formatTask(makeTask({ priority: 1 }))).toBe('- 测试任务 [优先级:低]')
  })

  it('priority=0 不显示优先级', () => {
    expect(formatTask(makeTask({ priority: 0 }))).toBe('- 测试任务')
  })

  it('带截止日期', () => {
    const result = formatTask(
      makeTask({ dueDate: '2026-03-15T00:00:00+08:00' })
    )
    expect(result).toBe('- 测试任务 [截止:2026-03-15]')
  })

  it('同时带优先级和截止日期', () => {
    const result = formatTask(
      makeTask({ priority: 5, dueDate: '2026-03-15T00:00:00+08:00' })
    )
    expect(result).toBe('- 测试任务 [优先级:高] [截止:2026-03-15]')
  })
})

describe('buildChildrenMap', () => {
  it('空列表返回空 Map', () => {
    expect(buildChildrenMap([]).size).toBe(0)
  })

  it('无子任务返回空 Map', () => {
    const tasks = [makeTask({ id: 'a' }), makeTask({ id: 'b' })]
    expect(buildChildrenMap(tasks).size).toBe(0)
  })

  it('正确分组子任务', () => {
    const tasks = [
      makeTask({ id: 'parent' }),
      makeTask({ id: 'child1', parentId: 'parent', title: '子1' }),
      makeTask({ id: 'child2', parentId: 'parent', title: '子2' }),
      makeTask({ id: 'other' }),
    ]
    const map = buildChildrenMap(tasks)
    expect(map.size).toBe(1)
    expect(map.get('parent')?.length).toBe(2)
    expect(map.get('parent')?.map((t) => t.title)).toEqual(['子1', '子2'])
  })

  it('多个父任务各有子任务', () => {
    const tasks = [
      makeTask({ id: 'p1' }),
      makeTask({ id: 'p2' }),
      makeTask({ id: 'c1', parentId: 'p1' }),
      makeTask({ id: 'c2', parentId: 'p2' }),
      makeTask({ id: 'c3', parentId: 'p1' }),
    ]
    const map = buildChildrenMap(tasks)
    expect(map.size).toBe(2)
    expect(map.get('p1')?.length).toBe(2)
    expect(map.get('p2')?.length).toBe(1)
  })
})

describe('buildTaskSummary', () => {
  it('空任务列表', () => {
    expect(buildTaskSummary([], [])).toBe('当前没有待办任务。')
  })

  it('无焦点任务 — 列出全部顶层任务', () => {
    const tasks = [
      makeTask({ id: 't1', title: '任务A' }),
      makeTask({ id: 't2', title: '任务B' }),
    ]
    const result = buildTaskSummary([], tasks)
    expect(result).toContain('当前用户的任务列表：')
    expect(result).toContain('- 任务A')
    expect(result).toContain('- 任务B')
  })

  it('子任务不作为顶层项，而是缩进在父任务下', () => {
    const tasks = [
      makeTask({ id: 'p1', title: '剪辑视频' }),
      makeTask({ id: 'c1', title: '整理素材', parentId: 'p1' }),
      makeTask({ id: 'c2', title: '添加字幕', parentId: 'p1' }),
    ]
    const result = buildTaskSummary([], tasks)
    const lines = result.split('\n')
    // 顶层只有一个任务
    expect(lines.filter((l) => l.startsWith('- ')).length).toBe(1)
    // 子任务缩进
    expect(lines.filter((l) => l.startsWith('  - ')).length).toBe(2)
    expect(result).toContain('  - 整理素材')
    expect(result).toContain('  - 添加字幕')
  })

  it('有焦点任务时区分两个分区', () => {
    const focus = [makeTask({ id: 't1', title: '焦点任务' })]
    const all = [
      makeTask({ id: 't1', title: '焦点任务' }),
      makeTask({ id: 't2', title: '其他任务' }),
    ]
    const result = buildTaskSummary(focus, all)
    expect(result).toContain('【当前焦点任务】')
    expect(result).toContain('- 焦点任务')
    expect(result).toContain('【其他待办任务】')
    expect(result).toContain('- 其他任务')
  })

  it('焦点中的子任务不作为独立焦点项', () => {
    const parent = makeTask({ id: 'p1', title: '大任务' })
    const child = makeTask({ id: 'c1', title: '小步骤', parentId: 'p1' })
    // focusTasks 包含子任务（可能来自今日视图）
    const result = buildTaskSummary([parent, child], [parent, child])
    // 焦点区只显示父任务，子任务缩进
    const focusSection = result.split('【其他待办任务】')[0]
    const topLines = focusSection.split('\n').filter((l) => l.startsWith('- '))
    expect(topLines.length).toBe(1)
    expect(focusSection).toContain('  - 小步骤')
  })

  it('无焦点时超过 15 个顶层任务截断', () => {
    const tasks = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: `t${i}`, title: `任务${i}` })
    )
    const result = buildTaskSummary([], tasks)
    expect(result).toContain('...还有 5 个任务')
    // 只包含前 15 个
    expect(result).toContain('任务0')
    expect(result).toContain('任务14')
    expect(result).not.toContain('- 任务15')
  })

  it('有焦点时其他任务超过 10 个截断', () => {
    const focus = [makeTask({ id: 'f1', title: '焦点' })]
    const all = [
      makeTask({ id: 'f1', title: '焦点' }),
      ...Array.from({ length: 12 }, (_, i) =>
        makeTask({ id: `o${i}`, title: `其他${i}` })
      ),
    ]
    const result = buildTaskSummary(focus, all)
    expect(result).toContain('...还有 2 个任务')
  })

  it('焦点任务的子任务也显示在摘要中', () => {
    const parent = makeTask({ id: 'p1', title: '项目' })
    const child1 = makeTask({ id: 'c1', title: '步骤1', parentId: 'p1' })
    const child2 = makeTask({ id: 'c2', title: '步骤2', parentId: 'p1' })
    const other = makeTask({ id: 't2', title: '买菜' })
    const result = buildTaskSummary([parent], [parent, child1, child2, other])
    expect(result).toContain('- 项目')
    expect(result).toContain('  - 步骤1')
    expect(result).toContain('  - 步骤2')
    expect(result).toContain('- 买菜')
  })
})
