import { useState, useEffect, useCallback } from 'react'

interface UpdateInfo {
  from: string
  to: string
  time: number
  seen: boolean
}

interface VersionUpdateState {
  currentVersion: string
  updateInfo: UpdateInfo | null
  hasUnseenUpdate: boolean
  markUpdateSeen: () => Promise<void>
}

/**
 * 版本更新 Hook
 * 用于检测扩展是否刚更新，并提供标记已读的方法
 */
export function useVersionUpdate(): VersionUpdateState {
  const [currentVersion] = useState(() => chrome.runtime.getManifest().version)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    chrome.storage.local.get('last_update').then((result) => {
      const info = result.last_update as UpdateInfo | undefined
      if (info) {
        setUpdateInfo(info)
      }
    })
  }, [])

  const markUpdateSeen = useCallback(async () => {
    if (!updateInfo) return

    const newInfo = { ...updateInfo, seen: true }
    await chrome.storage.local.set({ last_update: newInfo })
    setUpdateInfo(newInfo)
  }, [updateInfo])

  return {
    currentVersion,
    updateInfo,
    hasUnseenUpdate: updateInfo !== null && !updateInfo.seen,
    markUpdateSeen,
  }
}

/**
 * 判断是否为重要更新（主版本或次版本变化）
 */
export function isMajorUpdate(from: string, to: string): boolean {
  const [fromMajor, fromMinor] = from.split('.').map(Number)
  const [toMajor, toMinor] = to.split('.').map(Number)
  return toMajor > fromMajor || toMinor > fromMinor
}
