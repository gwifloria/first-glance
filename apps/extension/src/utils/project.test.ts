import { describe, it, expect } from 'vitest'
import type { Project } from '@/types'
import {
  isInboxProject,
  filterActiveProjects,
  resolveDefaultProjectId,
  resolveQuickAddProjectId,
  describeDestination,
  isListContextFilter,
} from './project'

// 最小化 Project 工厂：只填测试关心的字段
function mkProject(p: Partial<Project> & { id: string }): Project {
  return { name: p.id, sortOrder: 0, ...p }
}

const inbox = mkProject({ id: 'inbox1', name: '收集箱', kind: 'INBOX' })
const work = mkProject({ id: 'work1', name: '工作' })
const personal = mkProject({ id: 'personal1', name: '个人' })
const closed = mkProject({ id: 'closed1', name: '已归档', closed: true })
const projects = [inbox, work, personal, closed]

describe('utils/project', () => {
  describe('isInboxProject', () => {
    it('kind===INBOX 为真', () => {
      expect(isInboxProject(inbox)).toBe(true)
    })
    it('普通项目为假', () => {
      expect(isInboxProject(work)).toBe(false)
    })
    it('null / undefined 为假', () => {
      expect(isInboxProject(null)).toBe(false)
      expect(isInboxProject(undefined)).toBe(false)
    })
  })

  describe('filterActiveProjects', () => {
    it('过滤掉 closed 项目', () => {
      expect(filterActiveProjects(projects).map((p) => p.id)).toEqual([
        'inbox1',
        'work1',
        'personal1',
      ])
    })
  })

  describe('resolveDefaultProjectId', () => {
    it('未设置默认 → undefined（交给 API 落收集箱）', () => {
      expect(resolveDefaultProjectId(null, projects)).toBeUndefined()
      expect(resolveDefaultProjectId(undefined, projects)).toBeUndefined()
    })
    it('默认是收集箱 → undefined', () => {
      expect(resolveDefaultProjectId('inbox1', projects)).toBeUndefined()
    })
    it('默认是已删除/不存在的 id → undefined（不硬传）', () => {
      expect(resolveDefaultProjectId('ghost', projects)).toBeUndefined()
    })
    it('默认是有效普通项目 → 原样返回', () => {
      expect(resolveDefaultProjectId('work1', projects)).toBe('work1')
    })
  })

  describe('isListContextFilter', () => {
    it('收集箱 / 项目视图为真', () => {
      expect(isListContextFilter('inbox')).toBe(true)
      expect(isListContextFilter('project:abc')).toBe(true)
    })
    it('日期 / 智能视图为假', () => {
      expect(isListContextFilter('today')).toBe(false)
      expect(isListContextFilter('tomorrow')).toBe(false)
      expect(isListContextFilter('week')).toBe(false)
    })
  })

  describe('resolveQuickAddProjectId', () => {
    it('收集箱视图 → undefined', () => {
      expect(
        resolveQuickAddProjectId('inbox', 'work1', projects)
      ).toBeUndefined()
    })
    it('项目视图 → 该项目 id（即使有默认清单也用视图项目）', () => {
      expect(
        resolveQuickAddProjectId('project:personal1', 'work1', projects)
      ).toBe('personal1')
    })
    it('日期/智能视图 → 默认清单', () => {
      expect(resolveQuickAddProjectId('today', 'work1', projects)).toBe('work1')
    })
    it('日期视图 + 默认是收集箱 → undefined', () => {
      expect(
        resolveQuickAddProjectId('today', 'inbox1', projects)
      ).toBeUndefined()
    })
  })

  describe('describeDestination', () => {
    it('undefined → 收集箱', () => {
      expect(describeDestination(undefined, projects, '收集箱')).toEqual({
        name: '收集箱',
        isInbox: true,
      })
    })
    it('收集箱项目 id → 收集箱（标记 isInbox）', () => {
      expect(describeDestination('inbox1', projects, '收集箱')).toEqual({
        name: '收集箱',
        isInbox: true,
      })
    })
    it('已删除/不存在 id → 回退收集箱', () => {
      expect(describeDestination('ghost', projects, '收集箱')).toEqual({
        name: '收集箱',
        isInbox: true,
      })
    })
    it('有效普通项目 → 项目名 + 非收集箱', () => {
      expect(describeDestination('work1', projects, '收集箱')).toEqual({
        name: '工作',
        isInbox: false,
      })
    })
  })
})
