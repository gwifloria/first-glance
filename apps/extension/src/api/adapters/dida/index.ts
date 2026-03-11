/**
 * 滴答清单适配器
 */
import { auth } from '@/services/auth'
import { didaConfig } from '@/services/didaCompatConfig'
import {
  DidaCompatAdapter,
  createRequest,
  createTasksApi,
  createProjectsApi,
} from '../dida-compat'

const request = createRequest(didaConfig.apiBase, () => auth.getValidToken())
const tasksApi = createTasksApi(request)
const projectsApi = createProjectsApi(request)

export class DidaListAdapter extends DidaCompatAdapter {
  constructor() {
    super('didaList', tasksApi, projectsApi)
  }
}

export const didaListAdapter = new DidaListAdapter()
