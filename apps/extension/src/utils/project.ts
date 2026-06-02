import type { Project } from '@/types'

/**
 * 判断是否为收集箱项目。
 * 只认 adapter 在项目上盖的 kind==='INBOX'（dida/ticktick/todoist 都已盖）；
 * 不再用 id.startsWith('inbox') 猜测——那是滴答专属、对 Todoist 数字 id 不成立，
 * 属于服务特有逻辑泄漏到通用层。
 */
export function isInboxProject(project: Project | undefined | null): boolean {
  if (!project) return false
  return project.kind === 'INBOX'
}

/**
 * 过滤未关闭的项目
 */
export function filterActiveProjects(projects: Project[]): Project[] {
  return projects.filter((p) => !p.closed)
}

/**
 * 新建任务时把「默认清单」解析成要提交的 projectId。
 * 收集箱或未设置都按「未指定」处理：返回 undefined，交给 adapter/API 落到收集箱
 * （各端不传 projectId 即默认收集箱）。收集箱判定走 isInboxProject（adapter 盖的 kind）。
 */
export function resolveDefaultProjectId(
  defaultProjectId: string | null | undefined,
  projects: Project[]
): string | undefined {
  if (!defaultProjectId) return undefined
  const project = projects.find((p) => p.id === defaultProjectId)
  return isInboxProject(project) ? undefined : defaultProjectId
}
