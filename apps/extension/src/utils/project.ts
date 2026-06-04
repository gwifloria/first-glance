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
  // 未找到（清单已删除/收集箱未在列表中）或本就是收集箱 → 按「未指定」交给 API 落收集箱，
  // 不把一个可能已不存在的 id 硬传给 API。
  if (!project || isInboxProject(project)) return undefined
  return defaultProjectId
}

/**
 * 当前视图是否自带「清单归属」：某个项目视图 / 收集箱。
 * 这类视图里加任务天然落在该清单，改 chip 只是本次临时覆盖；
 * 日期/智能视图没有清单归属，改 chip 走「持久默认清单」。
 */
export function isListContextFilter(filter: string): boolean {
  return filter === 'inbox' || filter.startsWith('project:')
}

/**
 * 快速添加时根据当前 filter 解析要提交的 projectId。
 * 抽出 QuickAddInput 原内联逻辑，让「目的地提示」与实际提交共用一个真相源：
 * - inbox：不传，交给 adapter/API 落收集箱
 * - project:<id>：用该项目
 * - 其它（today/tomorrow/smart list）：用默认清单
 */
export function resolveQuickAddProjectId(
  filter: string,
  defaultProjectId: string | null | undefined,
  projects: Project[]
): string | undefined {
  if (filter === 'inbox') return undefined
  if (filter.startsWith('project:')) return filter.replace('project:', '')
  return resolveDefaultProjectId(defaultProjectId, projects)
}

export interface TaskDestination {
  /** 展示用清单名 */
  name: string
  /** 是否落到收集箱（决定图标用 inbox 还是 folder） */
  isInbox: boolean
}

/**
 * 把要提交的 projectId 解析成展示用目的地，供输入框「会写到哪」的 chip 与成功 toast 复用。
 * undefined / 收集箱 / 已删除的 id → 回退到 inboxLabel（由调用方传 i18n 文案）并标记为收集箱。
 */
export function describeDestination(
  projectId: string | undefined,
  projects: Project[],
  inboxLabel: string
): TaskDestination {
  if (!projectId) return { name: inboxLabel, isInbox: true }
  const project = projects.find((p) => p.id === projectId)
  if (!project || isInboxProject(project))
    return { name: inboxLabel, isInbox: true }
  return { name: project.name, isInbox: false }
}
