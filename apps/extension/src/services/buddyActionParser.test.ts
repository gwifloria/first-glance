import { describe, it, expect } from 'vitest'
import {
  extractActions,
  matchTaskByTitle,
  priorityToNumber,
} from './buddyActionParser'
import type { Task } from '@/types'

// 辅助函数：创建测试用 Task
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    projectId: 'proj-1',
    title: '写周报',
    priority: 0,
    status: 0,
    sortOrder: 0,
    ...overrides,
  }
}

const TASKS: Task[] = [
  makeTask({ id: 't1', title: '写周报' }),
  makeTask({ id: 't2', title: '修复登录 Bug' }),
  makeTask({ id: 't3', title: 'Review PR #42' }),
  makeTask({ id: 't4', title: '准备面试' }),
]

describe('matchTaskByTitle', () => {
  it('精确匹配', () => {
    const result = matchTaskByTitle('写周报', TASKS)
    expect(result?.id).toBe('t1')
  })

  it('精确匹配（忽略大小写）', () => {
    const result = matchTaskByTitle('review pr #42', TASKS)
    expect(result?.id).toBe('t3')
  })

  it('精确匹配（前后空白）', () => {
    const result = matchTaskByTitle('  写周报  ', TASKS)
    expect(result?.id).toBe('t1')
  })

  it('包含匹配：搜索词包含在任务标题中', () => {
    const result = matchTaskByTitle('登录 Bug', TASKS)
    expect(result?.id).toBe('t2')
  })

  it('包含匹配：较长的任务标题包含在搜索词中', () => {
    const result = matchTaskByTitle('今天修复登录 Bug 并部署', TASKS)
    expect(result?.id).toBe('t2')
  })

  it('包含匹配：短标题（<4字符）不进行反向匹配，避免误匹配', () => {
    const result = matchTaskByTitle('今天写周报并提交', TASKS)
    // '写周报' 只有 3 个字符，不走 normalized.includes(taskTitle)
    expect(result).toBeUndefined()
  })

  it('无匹配返回 undefined', () => {
    const result = matchTaskByTitle('不存在的任务', TASKS)
    expect(result).toBeUndefined()
  })

  it('优先精确匹配', () => {
    const tasks: Task[] = [
      makeTask({ id: 'a', title: '写周报' }),
      makeTask({ id: 'b', title: '写周报并发送' }),
    ]
    const result = matchTaskByTitle('写周报', tasks)
    expect(result?.id).toBe('a')
  })
})

describe('priorityToNumber', () => {
  it('正确映射所有优先级', () => {
    expect(priorityToNumber.high).toBe(5)
    expect(priorityToNumber.medium).toBe(3)
    expect(priorityToNumber.low).toBe(1)
    expect(priorityToNumber.none).toBe(0)
  })
})

describe('extractActions', () => {
  it('无 actions 区段时返回原始文本和空数组', () => {
    const text = '建议你先做写周报，这个比较紧急。'
    const { cleanText, actions } = extractActions(text, TASKS)

    expect(cleanText).toBe(text)
    expect(actions).toEqual([])
  })

  it('解析 set_priority 操作', () => {
    const text = `建议提高写周报的优先级。

:::actions
set_priority|写周报|high
:::`

    const { cleanText, actions } = extractActions(text, TASKS)

    expect(cleanText).toBe('建议提高写周报的优先级。')
    expect(actions).toHaveLength(1)
    expect(actions[0]).toEqual({
      type: 'set_priority',
      taskId: 't1',
      taskTitle: '写周报',
      priority: 'high',
    })
  })

  it('解析多个 set_priority 操作', () => {
    const text = `调整一下优先级。

:::actions
set_priority|写周报|high
set_priority|修复登录 Bug|medium
set_priority|准备面试|low
:::`

    const { actions } = extractActions(text, TASKS)

    expect(actions).toHaveLength(3)
    expect(actions[0]).toMatchObject({ taskId: 't1', priority: 'high' })
    expect(actions[1]).toMatchObject({ taskId: 't2', priority: 'medium' })
    expect(actions[2]).toMatchObject({ taskId: 't4', priority: 'low' })
  })

  it('解析 add_subtask 操作', () => {
    const text = `可以把写周报拆解为几个小步骤。

:::actions
add_subtask|写周报|打开模板,填写本周事项,检查并发送
:::`

    const { cleanText, actions } = extractActions(text, TASKS)

    expect(cleanText).toBe('可以把写周报拆解为几个小步骤。')
    expect(actions).toHaveLength(1)
    expect(actions[0]).toEqual({
      type: 'add_subtasks',
      taskId: 't1',
      taskTitle: '写周报',
      subtitles: ['打开模板', '填写本周事项', '检查并发送'],
    })
  })

  it('合并同一父任务的多行 add_subtask', () => {
    const text = `拆解一下任务。

:::actions
add_subtask|写周报|回顾本周工作
add_subtask|写周报|整理数据
:::`

    const { actions } = extractActions(text, TASKS)

    expect(actions).toHaveLength(1)
    expect(actions[0]).toEqual({
      type: 'add_subtasks',
      taskId: 't1',
      taskTitle: '写周报',
      subtitles: ['回顾本周工作', '整理数据'],
    })
  })

  it('混合解析 set_priority 和 add_subtask', () => {
    const text = `建议如下。

:::actions
set_priority|修复登录 Bug|high
add_subtask|写周报|收集数据,撰写摘要
:::`

    const { actions } = extractActions(text, TASKS)

    expect(actions).toHaveLength(2)
    expect(actions[0].type).toBe('set_priority')
    expect(actions[1].type).toBe('add_subtasks')
  })

  it('忽略无法匹配任务的行', () => {
    const text = `建议。

:::actions
set_priority|不存在的任务|high
set_priority|写周报|medium
:::`

    const { actions } = extractActions(text, TASKS)

    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({ taskId: 't1', priority: 'medium' })
  })

  it('忽略无效优先级', () => {
    const text = `调整优先级。

:::actions
set_priority|写周报|urgent
:::`

    const { actions } = extractActions(text, TASKS)
    expect(actions).toHaveLength(0)
  })

  it('忽略格式不完整的行', () => {
    const text = `建议。

:::actions
set_priority|写周报
incomplete_line
set_priority|修复登录 Bug|high
:::`

    const { actions } = extractActions(text, TASKS)

    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({ taskId: 't2', priority: 'high' })
  })

  it('处理末尾没有 ::: 闭合的情况', () => {
    const text = `建议提高优先级。

:::actions
set_priority|写周报|high`

    const { cleanText, actions } = extractActions(text, TASKS)

    expect(cleanText).toBe('建议提高优先级。')
    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({ taskId: 't1', priority: 'high' })
  })

  it('空 actions 区段', () => {
    const text = `没什么建议。

:::actions
:::`

    const { cleanText, actions } = extractActions(text, TASKS)
    expect(cleanText).toBe('没什么建议。')
    expect(actions).toEqual([])
  })

  it('空任务列表', () => {
    const text = `建议。

:::actions
set_priority|写周报|high
:::`

    const { actions } = extractActions(text, [])
    expect(actions).toEqual([])
  })

  it('priority 大小写不敏感', () => {
    const text = `:::actions
set_priority|写周报|HIGH
:::`

    const { actions } = extractActions(text, TASKS)
    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({ priority: 'high' })
  })

  it('cleanText 移除 actions 区段后保持整洁', () => {
    const text = `第一段。

第二段。

:::actions
set_priority|写周报|high
:::

第三段。`

    const { cleanText } = extractActions(text, TASKS)
    expect(cleanText).toBe('第一段。\n\n第二段。\n\n第三段。')
  })

  it('add_subtask 空子任务被过滤', () => {
    const text = `:::actions
add_subtask|写周报|,,
:::`

    const { actions } = extractActions(text, TASKS)
    expect(actions).toEqual([])
  })
})
