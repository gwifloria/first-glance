export function setupChromeMock() {
  const store: Record<string, unknown> = {}
  const listeners: Array<
    (
      changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
      areaName: string
    ) => void
  > = []

  vi.stubGlobal('chrome', {
    storage: {
      sync: {
        get: vi.fn((keys: string | string[]) => {
          const keyArr = Array.isArray(keys) ? keys : [keys]
          const result: Record<string, unknown> = {}
          for (const key of keyArr) {
            if (key in store) {
              result[key] = store[key]
            }
          }
          return Promise.resolve(result)
        }),
        set: vi.fn((items: Record<string, unknown>) => {
          Object.assign(store, items)
          return Promise.resolve()
        }),
        remove: vi.fn((keys: string | string[]) => {
          const keyArr = Array.isArray(keys) ? keys : [keys]
          for (const key of keyArr) {
            delete store[key]
          }
          return Promise.resolve()
        }),
      },
      local: {
        get: vi.fn(() => Promise.resolve({})),
        set: vi.fn(() => Promise.resolve()),
        remove: vi.fn(() => Promise.resolve()),
      },
      onChanged: {
        addListener: vi.fn(
          (
            fn: (
              changes: Record<
                string,
                { oldValue?: unknown; newValue?: unknown }
              >,
              areaName: string
            ) => void
          ) => listeners.push(fn)
        ),
        removeListener: vi.fn(
          (
            fn: (
              changes: Record<
                string,
                { oldValue?: unknown; newValue?: unknown }
              >,
              areaName: string
            ) => void
          ) => {
            const idx = listeners.indexOf(fn)
            if (idx >= 0) listeners.splice(idx, 1)
          }
        ),
      },
    },
  })

  return { store, listeners }
}
