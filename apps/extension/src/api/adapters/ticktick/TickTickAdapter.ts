/**
 * TickTick 适配器
 * 复用 DidaListAdapter，仅替换域名和认证
 */
import { ticktickAuth } from '@/services/ticktickAuth'
import { ticktickConfig } from '@/services/didaCompatConfig'
import { DidaListAdapter } from '../dida/DidaListAdapter'
import { createDidaCompatRequest } from '../dida/client'
import { createTasksApi } from '../dida/tasks'
import { createProjectsApi } from '../dida/projects'

export class TickTickAdapter extends DidaListAdapter {
  constructor() {
    const request = createDidaCompatRequest(ticktickConfig.apiBase, () =>
      ticktickAuth.getValidToken()
    )
    super('ticktick', createTasksApi(request), createProjectsApi(request))
  }
}

export const tickTickAdapter = new TickTickAdapter()
