import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  getPremiumStatus,
  activateLicense as activateLicenseService,
  deactivateLicense,
  subscribePremium,
} from '@/services/premium'
import { PremiumContext } from './PremiumContext'

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [premium, setPremium] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    getPremiumStatus().then((status) => setPremium(status.isActivated))
  }, [])

  useEffect(() => {
    return subscribePremium((status) => setPremium(status.isActivated))
  }, [])

  const activateLicense = useCallback(async (key: string) => {
    const result = await activateLicenseService(key)
    if (result.success) {
      setPremium(true)
    }
    return result
  }, [])

  const deactivate = useCallback(async () => {
    await deactivateLicense()
    setPremium(false)
  }, [])

  const openPremiumModal = useCallback(() => {
    setModalOpen(true)
  }, [])

  const closePremiumModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  return (
    <PremiumContext.Provider
      value={{
        isPremium: premium,
        premiumModalOpen: modalOpen,
        activateLicense,
        deactivate,
        openPremiumModal,
        closePremiumModal,
      }}
    >
      {children}
    </PremiumContext.Provider>
  )
}
