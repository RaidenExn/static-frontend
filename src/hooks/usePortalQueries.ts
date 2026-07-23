import { useState, useEffect, useRef } from 'react'
import { SubmissionFileResponse } from '../types'
import { openBlobUrl, openPdfInExtension, rowHasRepeatTrackerMarker, isoDate } from '../utils'
import { customFetch as fetch } from '../config/backend'
import { saveEncounterToIndexedDb, getEncounterFromIndexedDb } from '../services/indexedDbCache'
import { pdfCache } from '../services/pdfMemoryCache'


interface EncounterCacheEntry {
  summaryResult: any
  rcmResult: any
  ts: number
}
const encounterDataCache = new Map<string, EncounterCacheEntry>()

interface UsePortalQueriesProps {
  encounterInput: string
  setEncounterInput: (val: string) => void
  searchFromDate: string
  searchToDate: string
  resultFromDate: string
  resultToDate: string
  showToast: (textOrPayload: any, tone?: string) => void
  addRecentEncounter: (enc: string) => void
  fetchServerAttachments: (enc: string) => void
  resetDrafts: () => void
}

export function usePortalQueries({
  encounterInput,
  setEncounterInput,
  searchFromDate,
  searchToDate,
  resultFromDate,
  resultToDate,
  showToast,
  addRecentEncounter,
  fetchServerAttachments,
  resetDrafts
}: UsePortalQueriesProps) {
  const activeLoadIdRef = useRef<number>(0)
  const loadDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastInitializedEncounterRef = useRef<string>('')
  const initializedEncounterRef = useRef<string>('')

  const [summaryResult, setSummaryResult] = useState<any | null>(null)
  const [rcmResult, setRcmResult] = useState<any | null>(null)
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false)
  const [rcmLoading, setRcmLoading] = useState<boolean>(false)
  const [resultsLoading, setResultsLoading] = useState<boolean>(false)
  const [historicLoading, setHistoricLoading] = useState<boolean>(false)
  const [loadToken, setLoadToken] = useState<number>(0)

  const [repeatTrackerLoaded, setRepeatTrackerLoaded] = useState<boolean>(false)
  const [loadingRepeatTracker, setLoadingRepeatTracker] = useState<boolean>(false)
  const [repeatTrackerLookbackYears, setRepeatTrackerLookbackYears] = useState<number>(2)

  const reloadRcmOnly = async (targetEnc: string) => {
    setRcmLoading(true)
    const payload = {
      encounter: targetEnc,
      searchFromDate: searchFromDate.trim(),
      searchToDate: searchToDate.trim(),
      resultFromDate: resultFromDate.trim(),
      resultToDate: resultToDate.trim()
    }
    try {
      const r = await fetch('/api/encounter/rcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      setRcmResult({ Ok: data })
    } catch (e: any) {
      showToast(`Failed to refresh RCM: ${e.message}`, 'error')
    } finally {
      setRcmLoading(false)
    }
  }

  const buildRepeatTrackerDateRange = (years: number) => {
    const safeYears = [1, 2, 3].includes(Number(years)) ? Number(years) : 2
    const today = new Date()
    const fromDate = new Date(today)
    fromDate.setFullYear(fromDate.getFullYear() - safeYears)
    return {
      years: safeYears,
      searchFromDate: isoDate(fromDate),
      searchToDate: isoDate(today)
    }
  }

  const updateRepeatTrackerSummary = (rowIndex: number, summary: string) => {
    setRcmResult((prev: any) => {
      if (!prev?.Ok?.rcm) return prev
      const patchRows = (rows: any[] = []) =>
        rows.map((row: any, idx: number) => (idx === rowIndex ? { ...row, repeatTrackerBillingSummary: summary } : row))
      return {
        ...prev,
        Ok: {
          ...prev.Ok,
          rcm: {
            ...prev.Ok.rcm,
            detail: prev.Ok.rcm.detail
              ? {
                  ...prev.Ok.rcm.detail,
                  activityWiseStatus: patchRows(prev.Ok.rcm.detail.activityWiseStatus || [])
                }
              : prev.Ok.rcm.detail,
            flattened: {
              ...prev.Ok.rcm.flattened,
              activity: patchRows(prev.Ok.rcm.flattened?.activity || [])
            }
          }
        }
      }
    })
  }

  const reloadResubmissionsOnly = async (targetEnc: string) => {
    const payload = {
      encounter: targetEnc,
      section: 'resubmissions',
      refresh: 'force',
      searchFromDate: searchFromDate.trim(),
      searchToDate: searchToDate.trim(),
      resultFromDate: resultFromDate.trim(),
      resultToDate: resultToDate.trim()
    }
    try {
      const r = await fetch('/api/encounter/rcm-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()

      const updatedResubmissions = data.rcm?.flattened?.resubmissions || []
      const updatedWriteContext = data.rcm?.writeContext || {}

      setRcmResult((prev: any) => {
        if (!prev || !prev.Ok) return prev
        return {
          ...prev,
          Ok: {
            ...prev.Ok,
            rcm: {
              ...prev.Ok.rcm,
              writeContext: updatedWriteContext,
              flattened: {
                ...prev.Ok.rcm.flattened,
                resubmissions: updatedResubmissions
              }
            }
          }
        }
      })
    } catch (e: any) {
      showToast(`Failed to refresh resubmissions: ${e.message}`, 'error')
    }
  }

  const handleLoadRepeatTracker = async (encValue?: any, lookbackYears?: number, mode?: 'auto' | 'manual') => {
    const targetEnc = (typeof encValue === 'string' && encValue.trim() ? encValue : encounterInput).trim()
    const toastId = 'repeat-tracker'
    if (!targetEnc) return showToast('No active encounter loaded.', 'error')

    const selectedYears = buildRepeatTrackerDateRange(
      typeof lookbackYears === 'number' ? lookbackYears : repeatTrackerLookbackYears
    )
    setRepeatTrackerLookbackYears(selectedYears.years)
    setLoadingRepeatTracker(true)
    setRepeatTrackerLoaded(true)

    showToast({
      id: toastId,
      title: 'Repeat Tracker',
      message: `Loading Repeat Tracker analysis for ${selectedYears.years} year${selectedYears.years === 1 ? '' : 's'}...`,
      tone: 'loading'
    })

    const activityRows = (rcmResult?.Ok?.rcm?.detail?.activityWiseStatus ||
      rcmResult?.Ok?.rcm?.flattened?.activity ||
      []) as any[]

    const isManual = mode === 'manual'
    const excludeCodes = new Set(['9.01', '10.01', '11.01'])
    const isExcludedCode = (row: any) => {
      const code = String(row.code || row.code_id || '').trim()
      return excludeCodes.has(code)
    }

    const repeatTrackerRows = activityRows
      .map((row: any, index: number) => ({ row, index }))
      .filter(({ row }) => {
        if (isExcludedCode(row)) return false
        return isManual ? true : rowHasRepeatTrackerMarker(row)
      })

    if (!repeatTrackerRows.length) {
      showToast({
        id: toastId,
        title: 'Repeat Tracker Status',
        message: 'No Repeat Tracker rows found on the current encounter.',
        tone: 'info',
        duration: 5000
      })
      setLoadingRepeatTracker(false)
      return
    }

    const requestPayloads = repeatTrackerRows.map(({ row, index }) => ({
      encounter: targetEnc,
      row,
      rowIndex: index,
      searchFromDate: selectedYears.searchFromDate,
      searchToDate: selectedYears.searchToDate,
      resultFromDate: resultFromDate.trim(),
      resultToDate: resultToDate.trim(),
      manual: isManual || undefined
    }))

    try {
      await Promise.allSettled(
        requestPayloads.map(async (payload) => {
          const response = await fetch('/api/encounter/repeat-tracker-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          if (!response.ok) {
            const t = await response.text()
            throw new Error(t)
          }
          const data = await response.json()
          updateRepeatTrackerSummary(Number(data.rowIndex), String(data.summary || ''))
        })
      )

      showToast({
        id: toastId,
        title: 'Repeat Tracker Analysis',
        message: 'Repeat Tracker analysis loaded successfully.',
        tone: 'ok',
        duration: 5000
      })
    } catch (e: any) {
      showToast({
        id: toastId,
        title: 'Repeat Tracker Failed',
        message: `Repeat Tracker load failed: ${e.message}`,
        tone: 'error',
        duration: 6000
      })
    } finally {
      setLoadingRepeatTracker(false)
    }
  }

  const loadEncounter = async (encValue?: string, mode?: 'force' | 'cache-first') => {
    const targetEnc = (encValue || encounterInput).trim()
    if (!targetEnc) return showToast('Enter an encounter number.', 'error')

    if (loadDebounceRef.current) {
      clearTimeout(loadDebounceRef.current)
    }

    if (mode !== 'force') {
      const encKey = targetEnc.toUpperCase()
      if (encounterDataCache.has(encKey)) {
        return doLoadEncounter(targetEnc, 'cache-first')
      }

      return new Promise<void>((resolve) => {
        loadDebounceRef.current = setTimeout(() => {
          loadDebounceRef.current = undefined
          doLoadEncounter(targetEnc, 'cache-first')
          resolve()
        }, 300)
      })
    }

    return doLoadEncounter(targetEnc, 'force')
  }

  const doLoadEncounter = async (targetEnc: string, mode: 'force' | 'cache-first') => {
    const currentLoadId = ++activeLoadIdRef.current
    const encKey = targetEnc.toUpperCase()
    const isForce = mode === 'force'

    if (!isForce) {
      const dbCached = await getEncounterFromIndexedDb(encKey)
      if (dbCached) {
        encounterDataCache.set(encKey, {
          summaryResult: dbCached.summaryResult,
          rcmResult: dbCached.rcmResult,
          ts: dbCached.timestamp
        })
        setEncounterInput(targetEnc)
        addRecentEncounter(targetEnc)
        setSummaryResult(dbCached.summaryResult)
        setRcmResult(dbCached.rcmResult)
        setSummaryLoading(false)
        setRcmLoading(false)
        setResultsLoading(false)
        setHistoricLoading(false)
        setRepeatTrackerLoaded(!!dbCached.rcmResult?.Ok?.detail?.activityWiseStatus?.length)
        fetchServerAttachments(targetEnc)
        return
      }
    }

    // Force path (or cache-first miss — clear + fetch fresh)
    encounterDataCache.delete(encKey)
    pdfCache.clear()

    lastInitializedEncounterRef.current = ''
    initializedEncounterRef.current = ''

    setEncounterInput(targetEnc)

    const isDifferentEncounter = encKey !== encounterInput.trim().toUpperCase()

    setSummaryLoading(true)
    setRcmLoading(true)
    setResultsLoading(true)
    setHistoricLoading(true)
    setSummaryResult(null)
    setRcmResult(null)
    setRepeatTrackerLoaded(false)
    setLoadToken((prev) => prev + 1)

    resetDrafts()

    fetchServerAttachments(targetEnc)

    const states = {
      summary: 'loading',
      results: 'loading',
      historic: 'loading',
      rcm: 'loading'
    }

    const updateLoadToast = () => {
      if (activeLoadIdRef.current !== currentLoadId) return
      if (!isDifferentEncounter && !isForce) return

      const getSymbol = (s: string) => {
        if (s === 'loading') return '•'
        if (s === 'ok') return '✓'
        return '✕'
      }

      const lines = [
        `${getSymbol(states.summary)} EMR Summary`,
        `${getSymbol(states.results)} Lab Results`,
        `${getSymbol(states.historic)} Historic Files`,
        `${getSymbol(states.rcm)} RCM Claim Details`
      ]

      const isAnyError =
        states.summary === 'error' ||
        states.results === 'error' ||
        states.historic === 'error' ||
        states.rcm === 'error'
      const isAllDone =
        states.summary !== 'loading' &&
        states.results !== 'loading' &&
        states.historic !== 'loading' &&
        states.rcm !== 'loading'

      let tone: 'loading' | 'ok' | 'error' | 'warning' = 'loading'
      let title = `Loading Encounter: ${targetEnc}`
      let duration = Infinity

      if (isAllDone) {
        if (isAnyError) {
          tone = 'warning'
          title = `Loaded with Errors: ${targetEnc}`
          duration = 6000
        } else {
          tone = 'ok'
          title = `Loaded Successfully: ${targetEnc}`
          duration = 5000
        }
      }

      showToast({
        id: 'load-encounter',
        title,
        message: lines.join('\n'),
        tone,
        duration
      })
    }

    updateLoadToast()

    localStorage.setItem('lifetrenz.lastEncounter', targetEnc)
    localStorage.setItem('lifetrenz.lastSearchFromDate', searchFromDate)
    localStorage.setItem('lifetrenz.lastSearchToDate', searchToDate)
    localStorage.setItem('lifetrenz.lastResultFromDate', resultFromDate)
    localStorage.setItem('lifetrenz.lastResultToDate', resultToDate)

    const params = new URLSearchParams(window.location.search)
    params.set('encounter', targetEnc)
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)

    const autoAttachSummary = localStorage.getItem('lifetrenz.autoAttachSummary') !== 'false'
    const payload = {
      encounter: targetEnc,
      searchFromDate: searchFromDate.trim(),
      searchToDate: searchToDate.trim(),
      resultFromDate: resultFromDate.trim(),
      resultToDate: resultToDate.trim(),
      refresh: mode,
      autoAttachSummary
    }

    const _cacheBuf: { summaryResult?: any; rcmResult?: any } = {}
    let _cacheReady = 0
    const _tryCache = () => {
      _cacheReady++
      if (_cacheReady >= 4 && _cacheBuf.summaryResult && _cacheBuf.rcmResult) {
        encounterDataCache.set(encKey, {
          summaryResult: _cacheBuf.summaryResult,
          rcmResult: _cacheBuf.rcmResult,
          ts: Date.now()
        })
        saveEncounterToIndexedDb(encKey, _cacheBuf.summaryResult, _cacheBuf.rcmResult)
      }
    }


    fetch('/api/encounter/summary-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (r) => {
        if (activeLoadIdRef.current !== currentLoadId) throw new Error('STALE_LOAD')
        if (!r.ok) {
          const t = await r.text()
          throw new Error(t)
        }
        return r.json()
      })
      .then((data) => {
        if (activeLoadIdRef.current !== currentLoadId) return
        const prevOk = _cacheBuf.summaryResult?.Ok || {}
        const existingAttachments = prevOk.attachments || []
        const existingHistoric = prevOk.patientHistoricFiles || []
        const merged = {
          Ok: {
            ...prevOk,
            ...data,
            attachments:
              data.attachments && data.attachments.length > 0
                ? data.attachments
                : existingAttachments,
            patientHistoricFiles:
              data.patientHistoricFiles && data.patientHistoricFiles.length > 0
                ? data.patientHistoricFiles
                : existingHistoric
          }
        }
        _cacheBuf.summaryResult = merged
        setSummaryResult(merged)
        states.summary = 'ok'
        updateLoadToast()
        addRecentEncounter(targetEnc)
      })
      .catch((e) => {
        if (e.message === 'STALE_LOAD' || activeLoadIdRef.current !== currentLoadId) return
        if (isDifferentEncounter || isForce) {
          setSummaryResult({ Err: e.message || 'Failed to load summary' })
        } else {
          showToast(`Background sync failed: ${e.message || 'Failed to load summary'}`, 'warning')
        }
        states.summary = 'error'
        updateLoadToast()
      })
      .finally(() => {
        if (activeLoadIdRef.current !== currentLoadId) return
        setSummaryLoading(false)
        _tryCache()
      })

    fetch('/api/encounter/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (r) => {
        if (activeLoadIdRef.current !== currentLoadId) throw new Error('STALE_LOAD')
        if (!r.ok) {
          const t = await r.text()
          throw new Error(t)
        }
        return r.json()
      })
      .then((resData) => {
        if (activeLoadIdRef.current !== currentLoadId) return
        const newAttachments = resData.attachments || []
        const currentSummaryOk = _cacheBuf.summaryResult?.Ok || {}
        if (newAttachments.length > 0) {
          _cacheBuf.summaryResult = {
            Ok: {
              ...currentSummaryOk,
              attachments: newAttachments
            }
          }
        }
        setSummaryResult((prev: any) => {
          const prevOk = prev?.Ok || {}
          return {
            Ok: {
              ...prevOk,
              attachments: newAttachments.length > 0 ? newAttachments : (prevOk.attachments || [])
            }
          }
        })
        states.results = 'ok'
        updateLoadToast()
      })
      .catch((e) => {
        if (e.message === 'STALE_LOAD' || activeLoadIdRef.current !== currentLoadId) return
        states.results = 'error'
        updateLoadToast()
      })
      .finally(() => {
        if (activeLoadIdRef.current !== currentLoadId) return
        setResultsLoading(false)
        _tryCache()
      })

    fetch('/api/encounter/historic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (r) => {
        if (activeLoadIdRef.current !== currentLoadId) throw new Error('STALE_LOAD')
        if (!r.ok) {
          const t = await r.text()
          throw new Error(t)
        }
        return r.json()
      })
      .then((histData) => {
        if (activeLoadIdRef.current !== currentLoadId) return
        const newFiles = histData.patientHistoricFiles || []
        const currentSummaryOk = _cacheBuf.summaryResult?.Ok || {}
        if (newFiles.length > 0) {
          _cacheBuf.summaryResult = {
            Ok: {
              ...currentSummaryOk,
              patientHistoricFiles: newFiles
            }
          }
        }
        setSummaryResult((prev: any) => {
          const prevOk = prev?.Ok || {}
          return {
            Ok: {
              ...prevOk,
              patientHistoricFiles: newFiles.length > 0 ? newFiles : (prevOk.patientHistoricFiles || [])
            }
          }
        })
        states.historic = 'ok'
        updateLoadToast()
      })
      .catch((e) => {
        if (e.message === 'STALE_LOAD' || activeLoadIdRef.current !== currentLoadId) return
        states.historic = 'error'
        updateLoadToast()
      })
      .finally(() => {
        if (activeLoadIdRef.current !== currentLoadId) return
        setHistoricLoading(false)
        _tryCache()
      })

    fetch('/api/encounter/rcm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (r) => {
        if (activeLoadIdRef.current !== currentLoadId) throw new Error('STALE_LOAD')
        if (!r.ok) {
          const t = await r.text()
          throw new Error(t)
        }
        return r.json()
      })
      .then((data) => {
        if (activeLoadIdRef.current !== currentLoadId) return
        const rcmRes = { Ok: data }
        _cacheBuf.rcmResult = rcmRes
        setRcmResult(rcmRes)
        states.rcm = 'ok'
        updateLoadToast()
      })
      .catch((e) => {
        if (e.message === 'STALE_LOAD' || activeLoadIdRef.current !== currentLoadId) return
        if (isDifferentEncounter || isForce) {
          setRcmResult({ Err: e.message || 'Failed to load RCM' })
        } else {
          showToast(`Background sync failed: ${e.message || 'Failed to load RCM'}`, 'warning')
        }
        states.rcm = 'error'
        updateLoadToast()
      })
      .finally(() => {
        if (activeLoadIdRef.current !== currentLoadId) return
        setRcmLoading(false)
        _tryCache()
      })
  }

  const loadSubmissionFile = async (fileId: string, siteId: string, fileName: string, isViewXml: boolean) => {
    const toastId = 'xml-pdf-extract'
    showToast({
      id: toastId,
      title: isViewXml ? 'XML Extraction' : 'PDF Extraction',
      message: `${isViewXml ? 'Opening' : 'Extracting'} ${fileName}...`,
      tone: 'loading'
    })
    try {
      const response = await fetch('/api/rcm/submission-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, siteId, typeId: 1 })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data: SubmissionFileResponse = await response.json()
      if (isViewXml && data.content) {
        openBlobUrl(new Blob([data.content], { type: 'text/xml' }), fileName)
        showToast({
          id: toastId,
          title: 'XML Document Opened',
          message: `Opened XML file ${fileName} successfully.`,
          tone: 'ok',
          duration: 4000
        })
      } else if (!isViewXml && data.pdfBase64) {
        await openPdfInExtension(data.pdfBase64, fileName, true, showToast, toastId)
        showToast({
          id: toastId,
          title: 'PDF Document Opened',
          message: `Attached/Opened PDF file ${fileName}.`,
          tone: 'ok',
          duration: 4000
        })
      } else {
        showToast({
          id: toastId,
          title: 'Extraction Warning',
          message: `No ${isViewXml ? 'XML' : 'PDF'} content found on the server.`,
          tone: 'error',
          duration: 6000
        })
      }
    } catch (e: any) {
      showToast({
        id: toastId,
        title: 'Extraction Failed',
        message: `Operation failed: ${e.message}`,
        tone: 'error',
        duration: 6000
      })
    }
  }

  useEffect(() => {
    if (encounterInput.trim()) loadEncounter(encounterInput.trim())
  }, [])

  return {
    summaryResult,
    setSummaryResult,
    rcmResult,
    setRcmResult,
    summaryLoading,
    rcmLoading,
    resultsLoading,
    historicLoading,
    loadToken,
    repeatTrackerLoaded,
    setRepeatTrackerLoaded,
    loadingRepeatTracker,
    setLoadingRepeatTracker,
    repeatTrackerLookbackYears,
    setRepeatTrackerLookbackYears,
    lastInitializedEncounterRef,
    initializedEncounterRef,
    reloadRcmOnly,
    reloadResubmissionsOnly,
    handleLoadRepeatTracker,
    loadEncounter,
    loadSubmissionFile
  }
}

