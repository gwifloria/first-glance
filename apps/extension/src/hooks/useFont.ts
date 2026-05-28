import { FontContext } from '@/contexts/FontContext'
import { createContextHook } from './createContextHook'

export const useFont = createContextHook(FontContext, 'FontProvider')
