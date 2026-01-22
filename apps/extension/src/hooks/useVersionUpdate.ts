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
 * 解析版本号，支持 major.minor.patch 格式
 * 返回 [major, minor, patch]，无法解析的部分返回 0
 */
function parseVersion(version: string): [number, number, number] {
  // 移除可能的前缀（如 v1.0.0）和后缀（如 1.0.0-beta）
  const cleaned = version.replace(/^v/, '').split('-')[0]
  const parts = cleaned.split('.').map((p) => {
    const num = parseInt(p, 10)
    return isNaN(num) ? 0 : num
  })
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

/**
 * 判断是否为重要更新（主版本或次版本变化）
 */
export function isMajorUpdate(from: string, to: string): boolean {
  const [fromMajor, fromMinor] = parseVersion(from)
  const [toMajor, toMinor] = parseVersion(to)
  return toMajor > fromMajor || (toMajor === fromMajor && toMinor > fromMinor)
}
