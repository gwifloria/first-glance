import { PremiumContext } from '@/contexts/PremiumContext'
import { createContextHook } from './createContextHook'

export const usePremium = createContextHook(PremiumContext, 'PremiumProvider')
