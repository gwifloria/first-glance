import type { Project } from '@/types'

/**
 * 判断是否为收集箱项目
 */
export function isInboxProject(project: Project | undefined | null): boolean {
  if (!project) return false
  return project.kind === 'INBOX' || project.id.startsWith('inbox')
}

/**
 * 过滤未关闭的项目
 */
export function filterActiveProjects(projects: Project[]): Project[] {
  return projects.filter((p) => !p.closed)
}
