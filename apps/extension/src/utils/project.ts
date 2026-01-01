import type { Project } from '@/types'

/**
 * 过滤未关闭的项目
 */
export function filterActiveProjects(projects: Project[]): Project[] {
  return projects.filter((p) => !p.closed)
}
