import { useState, useEffect, useCallback } from 'react'
import { auth } from '@/services/auth'
import { storage } from '@/services/storage'

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const token = await storage.getToken()
    setIsLoggedIn(!!token)
    setLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async () => {
    setLoading(true)
    try {
      await auth.login()
      setIsLoggedIn(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await auth.logout()
    setIsLoggedIn(false)
  }, [])

  return { isLoggedIn, loading, login, logout }
}
