import { createContext } from 'react'

export interface PremiumContextValue {
  isPremium: boolean
  premiumModalOpen: boolean
  activateLicense: (
    key: string
  ) => Promise<{ success: boolean; error?: string }>
  deactivate: () => Promise<void>
  openPremiumModal: () => void
  closePremiumModal: () => void
}

export const PremiumContext = createContext<PremiumContextValue | null>(null)
