const DB_NAME = 'ambient-sounds'
const STORE_NAME = 'audio'
const DB_VERSION = 1

interface CacheEntry {
  id: string
  blob: Blob
  version: string
  cachedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
}

export async function get(id: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = tx(db, 'readonly').get(id)
    req.onsuccess = () => {
      const entry = req.result as CacheEntry | undefined
      resolve(entry?.blob ?? null)
    }
    req.onerror = () => resolve(null)
  })
}

export async function put(
  id: string,
  blob: Blob,
  version: string
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const entry: CacheEntry = { id, blob, version, cachedAt: Date.now() }
    const req = tx(db, 'readwrite').put(entry)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function has(id: string, version?: string): Promise<boolean> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = tx(db, 'readonly').get(id)
    req.onsuccess = () => {
      const entry = req.result as CacheEntry | undefined
      if (!entry) return resolve(false)
      if (version && entry.version !== version) return resolve(false)
      resolve(true)
    }
    req.onerror = () => resolve(false)
  })
}

export async function evict(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = tx(db, 'readwrite').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
  })
}

export async function clear(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = tx(db, 'readwrite').clear()
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
  })
}

export async function totalSize(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve) => {
    const req = tx(db, 'readonly').getAll()
    req.onsuccess = () => {
      const entries = req.result as CacheEntry[]
      const bytes = entries.reduce((sum, e) => sum + e.blob.size, 0)
      resolve(bytes)
    }
    req.onerror = () => resolve(0)
  })
}
