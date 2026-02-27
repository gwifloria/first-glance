import { describe, it, expect } from 'vitest'
import { buildTaskMap, getParentTitle } from './taskMap'
import { makeTask } from '@/test/factories'

describe('taskMap', () => {
  describe('buildTaskMap', () => {
    it('按 id 索引', () => {
      const tasks = [
        makeTask({ id: 'a', title: 'Task A' }),
        makeTask({ id: 'b', title: 'Task B' }),
      ]
      const map = buildTaskMap(tasks)

      expect(map.size).toBe(2)
      expect(map.get('a')?.title).toBe('Task A')
      expect(map.get('b')?.title).toBe('Task B')
    })

    it('空数组返回空 Map', () => {
      const map = buildTaskMap([])
      expect(map.size).toBe(0)
    })
  })

  describe('getParentTitle', () => {
    it('返回父任务标题', () => {
      const parent = makeTask({ id: 'parent', title: 'Parent Task' })
      const child = makeTask({ id: 'child', parentId: 'parent' })
      const map = buildTaskMap([parent, child])

      expect(getParentTitle(child, map)).toBe('Parent Task')
    })

    it('无 parentId 返回 undefined', () => {
      const task = makeTask({ id: '1' })
      const map = buildTaskMap([task])

      expect(getParentTitle(task, map)).toBeUndefined()
    })

    it('parentId 不在 map 中返回 undefined', () => {
      const task = makeTask({ id: '1', parentId: 'nonexistent' })
      const map = buildTaskMap([task])

      expect(getParentTitle(task, map)).toBeUndefined()
    })
  })
})
