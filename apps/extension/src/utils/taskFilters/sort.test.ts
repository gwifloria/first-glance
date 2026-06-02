import { describe, it, expect } from 'vitest'
import { sortTasks } from './sort'
import { makeTask } from '@/test/factories'

describe('sortTasks', () => {
  it('priority：高优先级在前', () => {
    const tasks = [
      makeTask({ id: '1', priority: 1 }),
      makeTask({ id: '2', priority: 5 }),
      makeTask({ id: '3', priority: 3 }),
    ]
    expect(sortTasks(tasks, 'priority').map((t) => t.id)).toEqual([
      '2',
      '3',
      '1',
    ])
  })

  it('name：按标题序', () => {
    const tasks = [
      makeTask({ id: '1', title: 'Cherry' }),
      makeTask({ id: '2', title: 'Apple' }),
      makeTask({ id: '3', title: 'Banana' }),
    ]
    expect(sortTasks(tasks, 'name').map((t) => t.title)).toEqual([
      'Apple',
      'Banana',
      'Cherry',
    ])
  })

  it('deadline：早截止在前，无截止日在后', () => {
    const tasks = [
      makeTask({ id: '1' }),
      makeTask({ id: '2', deadline: '2026-03-01' }),
      makeTask({ id: '3', deadline: '2026-02-01' }),
    ]
    expect(sortTasks(tasks, 'deadline').map((t) => t.id)).toEqual([
      '3',
      '2',
      '1',
    ])
  })

  it('不可变：返回新数组，不改动入参', () => {
    const tasks = [makeTask({ id: '1' }), makeTask({ id: '2' })]
    const sorted = sortTasks(tasks, 'name')
    expect(sorted).not.toBe(tasks)
  })
})
