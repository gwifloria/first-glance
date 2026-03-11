import { createDidaCompatAuth } from './auth'
import { ticktickConfig } from './didaCompatConfig'

export const ticktickAuth = createDidaCompatAuth(ticktickConfig)
