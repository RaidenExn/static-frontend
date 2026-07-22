const DB_NAME = 'lt_portal_cache_v1'
const STORE_NAME = 'encounter_bundles'
const DB_VERSION = 1
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface CachedBundle {
  encounterId: string
  summaryResult: any
  rcmResult: any
  timestamp: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in current environment'))
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'encounterId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveEncounterToIndexedDb(
  encounterId: string,
  summaryResult: any,
  rcmResult: any
): Promise<void> {
  if (!encounterId) return
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const record: CachedBundle = {
      encounterId: encounterId.trim(),
      summaryResult,
      rcmResult,
      timestamp: Date.now()
    }
    store.put(record)
  } catch (err) {
    console.warn('[IndexedDB] Failed to save encounter bundle:', err)
  }
}

export async function getEncounterFromIndexedDb(encounterId: string): Promise<CachedBundle | null> {
  if (!encounterId) return null
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(encounterId.trim())

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result as CachedBundle | undefined
        if (!result) return resolve(null)
        if (Date.now() - result.timestamp > MAX_AGE_MS) {
          // Expired record
          resolve(null)
        } else {
          resolve(result)
        }
      }
      request.onerror = () => resolve(null)
    })
  } catch (err) {
    console.warn('[IndexedDB] Failed to read encounter bundle:', err)
    return null
  }
}

export async function clearIndexedDbCache(): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
  } catch (err) {
    console.warn('[IndexedDB] Failed to clear cache:', err)
  }
}
