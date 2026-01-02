/**
 * 项目相关类型定义
 */

/** 项目/清单 */
export interface Project {
  id: string
  name: string
  color?: string
  sortOrder: number
  closed?: boolean
  groupId?: string
  viewMode?: string
  permission?: string
  kind?: string
}
