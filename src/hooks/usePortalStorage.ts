import { useState, useEffect } from 'react'
import { sanitizeExcelInput } from '../utils/stringSanitizer.ts'
import { customFetch as fetch } from '../config/backend'

interface UsePortalStorageProps {
  activeTab: string
  showToast: (text: string, tone: string) => void
}

export function usePortalStorage({ activeTab, showToast }: UsePortalStorageProps) {
  const [dbSearchQuery, setDbSearchQuery] = useState<string>('')
  const [dbFilteredRows, setDbFilteredRows] = useState<any[]>([])
  const [dbMetrics, setDbMetrics] = useState<{ totalCount: number; totalGross: number; totalDisputed: number }>({
    totalCount: 0,
    totalGross: 0,
    totalDisputed: 0
  })
  const [dbQueryLoading, setDbQueryLoading] = useState<boolean>(false)

  const [storageInput, setStorageInput] = useState<string>('')
  const [storageConcurrency, setStorageConcurrency] = useState<number>(16)
  const [storageJob, setStorageJob] = useState<any | null>(null)
  const [storedCount, setStoredCount] = useState<number>(0)
  const [storageLoading, setStorageLoading] = useState<boolean>(false)
  const [storageRows, setStorageRows] = useState<any[]>([])
  const [storageStatsData, setStorageStatsData] = useState<any | null>(null)

  const querySQLiteIndex = async (searchStr: string) => {
    setDbQueryLoading(true)
    try {
      const url = new URL('/api/storage/query', window.location.origin)
      if (searchStr) {
        url.searchParams.set('search', searchStr)
      }
      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setDbFilteredRows(data.rows || [])
        setDbMetrics(data.stats || { totalCount: 0, totalGross: 0, totalDisputed: 0 })
      }
    } catch (e) {
      console.error('[SQLite] Error querying cache index:', e)
    } finally {
      setDbQueryLoading(false)
    }
  }

  const fetchStorageData = async () => {
    try {
      const response = await fetch('/api/storage/list')
      if (response.ok) {
        const data = await response.json()
        setStoredCount(data.count || 0)
        setStorageRows(data.rows || [])
        setStorageStatsData(data.stats || null)
      }
      querySQLiteIndex(dbSearchQuery)
    } catch (e) {
      console.error('Failed to fetch storage data:', e)
    }
  }

  useEffect(() => {
    querySQLiteIndex(dbSearchQuery)
  }, [dbSearchQuery])

  useEffect(() => {
    if (activeTab === 'storage') {
      fetchStorageData()
    }
  }, [activeTab])

  useEffect(() => {
    if (!storageJob || storageJob.status !== 'running') return

    let isSubscribed = true
    const poll = async () => {
      try {
        const response = await fetch('/api/storage/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: storageJob.id })
        })
        if (!response.ok) throw new Error('Status API returned error')
        const job = await response.json()
        if (isSubscribed) {
          setStorageJob(job)
          if (job.status === 'completed' || job.status === 'stopped') {
            fetchStorageData()
            showToast(`Storage job ${job.status}: ${job.success} stored, ${job.failed} failed.`, 'ok')
          }
        }
      } catch (err) {
        console.error('Error polling storage job status:', err)
      }
    }

    const interval = setInterval(poll, 1000)
    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [storageJob])

  const startStorageCaching = async () => {
    const trimmedInput = storageInput.trim()
    if (!trimmedInput) {
      showToast('Please enter or paste encounter numbers first.', 'error')
      return
    }

    const sanitizedEncounters = sanitizeExcelInput(trimmedInput)
    if (!sanitizedEncounters.length) {
      showToast('No valid encounter numbers found after sanitizing raw copy-paste data.', 'error')
      return
    }

    const sanitizedText = sanitizedEncounters.join('\n')
    setStorageInput(sanitizedText)

    setStorageLoading(true)
    try {
      const response = await fetch('/api/storage/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sanitizedText,
          concurrency: storageConcurrency,
          refresh: true
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to start storage process')
      }
      const job = await response.json()
      setStorageJob(job)
      showToast(`Superfast storing started for ${job.total} encounters with concurrency ${job.concurrency}!`, 'ok')
    } catch (err: any) {
      showToast(`Failed to start storage process: ${err.message}`, 'error')
    } finally {
      setStorageLoading(false)
    }
  }

  const cleanStorage = async (options: { encounter?: string; olderThanDays?: number } = {}) => {
    const { encounter, olderThanDays } = options
    const isGlobal = !encounter && olderThanDays === undefined
    const isPrune = olderThanDays !== undefined

    if (isGlobal && !window.confirm('Are you sure you want to delete ALL stored files? This cannot be undone.')) {
      return
    }
    if (isPrune && !window.confirm(`Are you sure you want to delete stored files older than ${olderThanDays} days?`)) {
      return
    }

    let loadingMsg = 'Deleting...'
    if (isGlobal) loadingMsg = 'Deleting all stored files...'
    else if (isPrune) loadingMsg = `Deleting files older than ${olderThanDays} days...`
    else if (encounter) loadingMsg = `Deleting ${encounter}...`

    showToast(loadingMsg, 'loading')
    try {
      const response = await fetch('/api/storage/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounter, olderThanDays })
      })
      if (!response.ok) throw new Error('Storage cleanup API returned error')
      const data = await response.json()
      setStoredCount(data.count || 0)
      setStorageRows(data.rows || [])
      setStorageStatsData(data.stats || null)

      // Instantly trigger index cache querying to sync the UI empty state
      await querySQLiteIndex(dbSearchQuery)

      let successMsg = 'Successfully completed cleanup!'
      if (isGlobal) successMsg = 'All stored files successfully deleted!'
      else if (isPrune) successMsg = `Successfully deleted stored files older than ${olderThanDays} days!`
      else if (encounter) successMsg = `Successfully deleted stored file: ${encounter}`

      showToast(successMsg, 'ok')
    } catch (err: any) {
      showToast(`Storage cleanup failed: ${err.message}`, 'error')
    }
  }

  const clearStorageJob = () => {
    setStorageJob(null)
  }

  return {
    dbSearchQuery,
    setDbSearchQuery,
    dbFilteredRows,
    dbMetrics,
    dbQueryLoading,
    querySQLiteIndex,
    storageInput,
    setStorageInput,
    storageConcurrency,
    setStorageConcurrency,
    storageJob,
    setStorageJob,
    storedCount,
    fetchStorageData,
    storageLoading,
    startStorageCaching,
    clearStorageJob,
    storageRows,
    storageStatsData,
    cleanStorage
  }
}
