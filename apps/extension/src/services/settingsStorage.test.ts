import { describe, it, expect, beforeEach } from 'vitest'
import { setupChromeMock } from '@/test/chromeMock'

describe('settingsStorage', () => {
  let store: Record<string, unknown>
  let listeners: Array<
    (
      changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
      areaName: string
    ) => void
  >

  beforeEach(() => {
    vi.resetModules()
    const mock = setupChromeMock()
    store = mock.store
    listeners = mock.listeners
  })

  async function importModule() {
    return import('./settingsStorage')
  }

  describe('getSettings', () => {
    it('空 storage 返回默认值', async () => {
      const { getSettings } = await importModule()
      const settings = await getSettings()

      expect(settings.defaultProjectId).toBeNull()
      expect(settings.blockedSites).toEqual([])
    })

    it('合并已存储值', async () => {
      store['app_settings'] = { defaultProjectId: 'proj-1' }
      store['settings_version'] = 5

      const { getSettings } = await importModule()
      const settings = await getSettings()

      expect(settings.defaultProjectId).toBe('proj-1')
      expect(settings.blockedSites).toEqual([])
    })
  })

  describe('setSettings', () => {
    it('合并更新', async () => {
      store['settings_version'] = 5
      store['app_settings'] = {
        defaultProjectId: null,
        blockedSites: [],
      }

      const { setSettings, getSettings } = await importModule()

      await setSettings({ defaultProjectId: 'proj-2' })
      const settings = await getSettings()

      expect(settings.defaultProjectId).toBe('proj-2')
      expect(settings.blockedSites).toEqual([])
    })
  })

  describe('migrations', () => {
    it('v1→v2 主题重命名', async () => {
      store['app_settings'] = {
        defaultProjectId: null,
        theme: 'journal',
      }
      store['settings_version'] = 1

      const { getSettings } = await importModule()
      await getSettings()

      // 迁移后 theme 应该变成 'beige'
      const saved = store['app_settings'] as Record<string, unknown>
      // v1→v2: journal→beige, then v3: add blockedSites, v4: remove theme
      // 最终版本不含 theme
      expect(saved).not.toHaveProperty('theme')
      expect(saved).toHaveProperty('blockedSites')
    })

    it('v1→v2 ocean→blue', async () => {
      store['app_settings'] = {
        defaultProjectId: null,
        theme: 'ocean',
      }
      store['settings_version'] = 1

      const { getSettings } = await importModule()
      await getSettings()

      // 经过所有迁移后，theme 被 v4 移除
      const saved = store['app_settings'] as Record<string, unknown>
      expect(saved).not.toHaveProperty('theme')
    })

    it('v2→v3 添加 blockedSites', async () => {
      store['app_settings'] = {
        defaultProjectId: 'proj-1',
        theme: 'blue',
      }
      store['settings_version'] = 2

      const { getSettings } = await importModule()
      const settings = await getSettings()

      expect(settings.blockedSites).toEqual([])
    })

    it('v0 无版本号触发全量迁移', async () => {
      store['app_settings'] = {}

      const { getSettings } = await importModule()
      const settings = await getSettings()

      expect(settings.defaultProjectId).toBeNull()
      expect(settings.blockedSites).toEqual([])
    })
  })

  describe('subscribeSettings', () => {
    it('只响应 sync 区域变更', async () => {
      const { subscribeSettings } = await importModule()
      const callback = vi.fn()

      subscribeSettings(callback)

      // 模拟 sync 变更
      const syncChange = {
        app_settings: {
          newValue: { defaultProjectId: 'proj-1', blockedSites: [] },
        },
      }
      for (const listener of listeners) {
        listener(syncChange, 'sync')
      }
      expect(callback).toHaveBeenCalledTimes(1)

      // 模拟 local 变更，不应触发
      callback.mockClear()
      for (const listener of listeners) {
        listener(syncChange, 'local')
      }
      expect(callback).not.toHaveBeenCalled()
    })

    it('返回取消订阅函数', async () => {
      const { subscribeSettings } = await importModule()
      const callback = vi.fn()

      const unsubscribe = subscribeSettings(callback)
      unsubscribe()

      expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled()
    })
  })
})
