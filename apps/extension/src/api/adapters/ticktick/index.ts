/**
 * TickTick 适配器
 */
import { ticktickAuth } from '@/services/ticktickAuth'
import { ticktickConfig } from '@/services/didaCompatConfig'
import {
  DidaCompatAdapter,
  createRequest,
  createTasksApi,
  createProjectsApi,
} from '../dida-compat'

const request = createRequest(ticktickConfig.apiBase, () =>
  ticktickAuth.getValidToken()
)
const tasksApi = createTasksApi(request)
const projectsApi = createProjectsApi(request)

export class TickTickAdapter extends DidaCompatAdapter {
  constructor() {
    super('ticktick', tasksApi, projectsApi)
  }
}

export const tickTickAdapter = new TickTickAdapter()
