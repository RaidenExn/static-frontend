import { useState, useEffect, useRef, useMemo } from 'react'
import { Tab } from '../types'
import { rcmNumVal, sendExtensionMessage, safeFileName, calculateRcmFinances } from '../utils'
import { useShortcodes } from './useShortcodes'
import { useRecentEncounters } from './useRecentEncounters'
import { useEncounterAttachments } from './useEncounterAttachments'
import { usePortalTabsAndTheme } from './usePortalTabsAndTheme'
import { usePortalToasts } from './usePortalToasts'
import { usePortalQueries } from './usePortalQueries'
import { usePortalLogs } from './usePortalLogs'
import { usePortalStorage } from './usePortalStorage'
import { customFetch as fetch } from '../config/backend'

export function usePortalState() {
  const isSavingInPlaceRef = useRef<boolean>(false)
  const syncSourceRef = useRef<'none' | 'input' | 'table'>('none')

  const { shortcodes, shortcodesLoaded } = useShortcodes()
  const {
    encounterInput,
    setEncounterInput,
    searchFromDate,
    setSearchFromDate,
    searchToDate,
    setSearchToDate,
    resultFromDate,
    setResultFromDate,
    resultToDate,
    setResultToDate,
    activeTab,
    selectTab,
    theme,
    setTheme,
    toggleTheme,
    primaryColor,
    setPrimaryColor,
    bgPalette,
    setBgPalette,
    cornerRadius,
    setCornerRadius,
    activeFont,
    setActiveFont,
    fontScale,
    setFontScale,
    spacingScale,
    setSpacingScale,
    visualStyle,
    setVisualStyle
  } = usePortalTabsAndTheme()

  const { recentEncounters, addRecentEncounter, clearRecentEncounters } = useRecentEncounters()
  const [raRemarks, setRaRemarks] = useState<string>('')
  const [autoCopyRaRemarks, setAutoCopyRaRemarks] = useState<boolean>(() => {
    const stored = localStorage.getItem('lifetrenz.autoCopyRaRemarks')
    return stored === null ? false : stored === 'true'
  })
  const [writeOffRemarks, setWriteOffRemarks] = useState<string>('')
  const [rowActions, setRowActionsState] = useState<Record<number, 're-sub' | 'w-off' | 'close'>>({})
  const [doubleAccumulationMode, setDoubleAccumulationMode] = useState<boolean>(false)
  const [resubmitType, setResubmitType] = useState<string>('2')
  const [selectedRaFileId, setSelectedRaFileId] = useState<string>('')
  const [resubComments, setResubCommentsState] = useState<string>('')
  const [autoTransferToRaRemarks, setAutoTransferToRaRemarks] = useState<boolean>(true)
  const [hasPreExistingRemarksOrComments, setHasPreExistingRemarksOrComments] = useState<boolean>(false)
  const [autoAttachSummary, setAutoAttachSummary] = useState<boolean>(() => {
    const stored = localStorage.getItem('lifetrenz.autoAttachSummary')
    return stored === null ? true : stored === 'true'
  })
  const [adaptiveCardColors, setAdaptiveCardColors] = useState<boolean>(() => {
    const stored = localStorage.getItem('lifetrenz.adaptiveCardColors')
    return stored === null ? true : stored === 'true'
  })

  useEffect(() => {
    localStorage.setItem('lifetrenz.adaptiveCardColors', String(adaptiveCardColors))
  }, [adaptiveCardColors])
  const [aiProvider, setAiProvider] = useState<string>(() => {
    const stored = localStorage.getItem('lifetrenz.aiProvider')
    return stored || 'openrouter'
  })
  const [aiModel, setAiModel] = useState<string>(() => {
    const stored = localStorage.getItem('lifetrenz.aiModel')
    if (stored) return stored
    const provider = localStorage.getItem('lifetrenz.aiProvider') || 'openrouter'
    return provider === 'gemini' ? 'models/gemini-2.5-flash' : 'openrouter/auto'
  })

  useEffect(() => {
    localStorage.setItem('lifetrenz.autoAttachSummary', String(autoAttachSummary))
  }, [autoAttachSummary])

  const [chatInputCount, setChatInputCount] = useState<number>(0)
  const [currentModelInUse, setCurrentModelInUse] = useState<string | null>(null)
  const [chatStats, setChatStats] = useState<{
    latencyMs: number
    attempts: number
    usage: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    } | null
  } | null>(null)

  useEffect(() => {
    localStorage.setItem('lifetrenz.autoCopyRaRemarks', String(autoCopyRaRemarks))
  }, [autoCopyRaRemarks])

  useEffect(() => {
    localStorage.setItem('lifetrenz.aiModel', aiModel)
  }, [aiModel])

  useEffect(() => {
    localStorage.setItem('lifetrenz.aiProvider', aiProvider)
  }, [aiProvider])

  const [calculatedFinances, setCalculatedFinances] = useState({
    grossResub: 0,
    grossWriteOff: 0,
    pendingResub: 0,
    pendingWriteOff: 0
  })

  const setResubComments = (val: string | ((prev: string) => string)) => {
    setResubCommentsState((prev) => {
      const nextVal = typeof val === 'function' ? val(prev) : val
      if (autoTransferToRaRemarks && !hasPreExistingRemarksOrComments) {
        setTimeout(() => {
          setRaRemarks(nextVal)
        }, 0)
      }
      return nextVal
    })
  }

  const { logs, logsLoading, fetchLogs } = usePortalLogs()
  const { showToast, dismissToast, clearToast, toasts, setSummaryLoading, setRcmLoading } = usePortalToasts()

  const {
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
  } = usePortalStorage({ activeTab, showToast })

  const {
    attachedFileBase64,
    setAttachedFileBase64,
    attachedFileName,
    setAttachedFileName,
    serverAttachments,
    uploadFileToServer,
    deleteServerAttachment,
    exportZip,
    fetchServerAttachments
  } = useEncounterAttachments({ encounterInput, showToast })

  const resetDrafts = () => {
    setResubCommentsState('')
    setRaRemarks('')
    setWriteOffRemarks('')
    setAttachedFileName('')
    setAttachedFileBase64('')
    setSelectedRaFileId('')
    setResubmitType('2')
    setRowActionsState({})
  }

  const {
    summaryResult,
    rcmResult,
    setRcmResult,
    summaryLoading,
    rcmLoading,
    resultsLoading,
    historicLoading,
    repeatTrackerLoaded,
    setRepeatTrackerLoaded,
    loadingRepeatTracker,
    setLoadingRepeatTracker,
    repeatTrackerLookbackYears,
    setRepeatTrackerLookbackYears,
    reloadRcmOnly,
    reloadResubmissionsOnly,
    handleLoadRepeatTracker,
    loadEncounter,
    loadSubmissionFile,
    prewarmEncounterCache
  } = usePortalQueries({

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
  })

  const loading = summaryLoading || rcmLoading

  useEffect(() => {
    setSummaryLoading(summaryLoading)
  }, [summaryLoading, setSummaryLoading])

  useEffect(() => {
    setRcmLoading(rcmLoading)
  }, [rcmLoading, setRcmLoading])

  const raFilesList = useMemo(() => {
    const filesMap = new Map<string, string>()
    const historyRows = rcmResult?.Ok?.rcm?.flattened?.history || []
    historyRows.forEach((row: any) => {
      const id = String(row.file_id || row.ra_file_id || '').trim()
      const name = String(row.file_name || row.ra_file_name || '').trim()
      if (id && id !== '0' && name) filesMap.set(id, name)
    })
    const detailHistory = rcmResult?.Ok?.rcm?.detail?.claimHistory || []
    detailHistory.forEach((row: any) => {
      const id = String(row.file_id || row.ra_file_id || '').trim()
      const name = String(row.file_name || row.ra_file_name || '').trim()
      if (id && id !== '0' && name) filesMap.set(id, name)
    })
    return Array.from(filesMap.entries()).map(([id, name]) => ({ id, name }))
  }, [rcmResult])

  const activeEncounterNo = String(
    rcmResult?.Ok?.rcm?.selected?.display_encounter_configno || rcmResult?.Ok?.encounterInput || encounterInput || ''
  )
    .trim()
    .toUpperCase()

  const suggestions = useMemo<string[]>(() => {
    const list: string[] = []
    if (resubmitType !== '1') return list
    const targetComment =
      '1. OP Initial consultation code for the same condition cannot be paid if billed within 28 days. Repeat consultation codes to be used'
        .toLowerCase()
        .trim()
    let matchesRa = raRemarks.toLowerCase().trim() === targetComment
    const activityRows = rcmResult?.Ok?.rcm?.flattened?.activity || []
    if (!matchesRa) {
      matchesRa = activityRows.some((row: any) => {
        const rowComment = (row.ra_claim_comment || row.remarks || row.remarks_ra || '').toLowerCase().trim()
        return rowComment === targetComment
      })
    }
    if (matchesRa) list.push('DSL corrected. ')
    const hasCode001 = activityRows.some((row: any) => {
      const code = (row.claim_denial_code || row.ra_denial_code || row.denialCode || '').trim().toUpperCase()
      return code === 'CODE-001'
    })
    if (hasCode001) list.push('ICD corrected. ')
    return list
  }, [resubmitType, raRemarks, rcmResult])

  const calculateLocalFinances = () => {
    const activityRows = rcmResult?.Ok?.rcm?.flattened?.activity || []
    return calculateRcmFinances(activityRows, rowActions, doubleAccumulationMode)
  }

  useEffect(() => {
    const local = calculateLocalFinances()
    setCalculatedFinances(local)
    if (!encounterInput.trim() || !rcmResult?.Ok) return
    let active = true
    fetch('/api/rcm/calculate-finances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounter: encounterInput.trim(), rowActions, doubleAccumulationMode })
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data) {
          setCalculatedFinances({
            grossResub: Number(data.grossResub ?? 0),
            grossWriteOff: Number(data.grossWriteOff ?? 0),
            pendingResub: Number(data.pendingResub ?? 0),
            pendingWriteOff: Number(data.pendingWriteOff ?? 0)
          })
        }
      })
      .catch((e) => console.warn('Backend finances calculation failed, using client-side fallback:', e))
    return () => {
      active = false
    }
  }, [rowActions, doubleAccumulationMode, rcmResult, encounterInput])

  const setRowActions = (value: React.SetStateAction<Record<number, 're-sub' | 'w-off' | 'close'>>) => {
    syncSourceRef.current = 'table'
    setRowActionsState(value)
  }

  const handleAutoAttach = async () => {
    const toastId = 'auto-attach'
    showToast({
      id: toastId,
      title: '📎 Auto-Attaching',
      message: 'Communicating with PDF extension...',
      tone: 'loading'
    })
    try {
      const response = await sendExtensionMessage('dncniblhlcgipjjfbjohghndadjblcae', {
        type: 'pdf:get-latest-compressed-attachment'
      })
      if (!response?.success) throw new Error(response?.error?.message || 'No compressed PDF has been generated yet.')
      if (!response.data || response.data.length === 0)
        throw new Error('No PDF byte data was returned by the extension.')
      const fileBytes = new Uint8Array(response.data)
      let binary = ''
      for (let i = 0; i < fileBytes.byteLength; i++) binary += String.fromCharCode(fileBytes[i])
      const base64 = window.btoa(binary)
      const fName = response.name || 'auto_attached.pdf'
      setAttachedFileBase64(base64)
      setAttachedFileName(fName)

      // Upload using the same toastId
      await uploadFileToServer(fName, base64, toastId)

      showToast({
        id: toastId,
        title: '📎 Auto-Attached',
        message: `Successfully attached and uploaded: ${fName}`,
        tone: 'ok',
        duration: 6000
      })
    } catch (err: any) {
      showToast({
        id: toastId,
        title: '❌ Auto-Attach Failed',
        message: err.message,
        tone: 'error',
        duration: 6000
      })
    }
  }

  const handleAttachSummary = async () => {
    if (!summaryResult?.Ok) {
      showToast('Summary not loaded.', 'error')
      return
    }
    const encName = safeFileName(summaryResult.Ok.encounterInput || encounterInput)
    const fName = `${encName}-summary.pdf`
    const toastId = 'attach-summary'
    showToast({
      id: toastId,
      title: '📎 Attaching Summary',
      message: `Downloading summary PDF for ${encName}...`,
      tone: 'loading'
    })
    try {
      const selected = summaryResult.Ok.selected
      const patientId = selected?.patient_id
      const encounterId = selected?.encounterid
      const siteId = selected?._site_id

      const summaryPdfUrl = summaryResult.Ok.pdfs?.summaryPdf || ''
      const createdByMatch = summaryPdfUrl.match(/createdby\/(\d+)/)
      const createdBy = createdByMatch ? createdByMatch[1] : '0'

      const downloadUrl = `/download/summary/symfony?patientId=${patientId}&siteId=${siteId}&encounterId=${encounterId}&createdBy=${createdBy}`
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status} downloading PDF`)
      const buffer = await response.arrayBuffer()

      const fileBytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < fileBytes.byteLength; i++) binary += String.fromCharCode(fileBytes[i])
      const base64 = window.btoa(binary)

      setAttachedFileBase64(base64)
      setAttachedFileName(fName)

      // Upload using the same toastId
      await uploadFileToServer(fName, base64, toastId)

      showToast({
        id: toastId,
        title: '📎 Summary Attached',
        message: `Successfully attached and uploaded: ${fName}`,
        tone: 'ok',
        duration: 6000
      })
    } catch (err: any) {
      showToast({
        id: toastId,
        title: '❌ Attach Summary Failed',
        message: err.message,
        tone: 'error',
        duration: 6000
      })
    }
  }

  const handleStopServer = async () => {
    if (
      !window.confirm(
        'Are you sure you want to completely stop the Lifetrenz Local Portal server? You will need to manually start it again from your terminal.'
      )
    )
      return
    showToast('Stopping Lifetrenz Local Portal server...', 'loading')
    try {
      const response = await fetch('/api/admin/server/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) throw new Error('Shutdown request failed')
      showToast('Server shutdown initiated successfully. Closing connection.', 'ok')
    } catch (err: any) {
      showToast(`Shutdown failed: ${err.message}`, 'error')
    }
  }

  const patientHeader = summaryResult?.Ok?.patientHeader || rcmResult?.Ok?.patientHeader
  const encounterDate = patientHeader?.encounterDate || '-'

  return {
    encounterInput,
    setEncounterInput,
    searchFromDate,
    setSearchFromDate,
    searchToDate,
    setSearchToDate,
    resultFromDate,
    setResultFromDate,
    resultToDate,
    setResultToDate,
    activeTab,
    selectTab,
    toasts,
    dismissToast,
    clearToast,
    showToast,
    summaryResult,
    rcmResult,
    setRcmResult,
    loading,
    resultsLoading,
    historicLoading,
    resubmitType,
    setResubmitType,
    selectedRaFileId,
    setSelectedRaFileId,
    resubComments,
    setResubComments,
    suggestions,
    attachedFileBase64,
    setAttachedFileBase64,
    attachedFileName,
    setAttachedFileName,
    raRemarks,
    setRaRemarks,
    autoCopyRaRemarks,
    setAutoCopyRaRemarks,
    writeOffRemarks,
    setWriteOffRemarks,
    rowActions,
    setRowActions: setRowActionsState,
    autoTransferToRaRemarks,
    setAutoTransferToRaRemarks,
    hasPreExistingRemarksOrComments,
    autoAttachSummary,
    setAutoAttachSummary,
    adaptiveCardColors,
    setAdaptiveCardColors,
    calculatedFinances,
    raFilesList,
    handleAutoAttach,
    handleAttachSummary,
    loadEncounter,
    loadSubmissionFile,
    theme,
    toggleTheme,
    setTheme,
    recentEncounters,
    clearRecentEncounters,
    primaryColor,
    setPrimaryColor,
    bgPalette,
    setBgPalette,
    cornerRadius,
    setCornerRadius,
    activeFont,
    setActiveFont,
    fontScale,
    setFontScale,
    spacingScale,
    setSpacingScale,
    visualStyle,
    setVisualStyle,
    repeatTrackerLoaded,
    loadingRepeatTracker,
    repeatTrackerLookbackYears,
    setRepeatTrackerLookbackYears,
    handleLoadRepeatTracker,
    shortcodes,
    logs,
    logsLoading,
    fetchLogs,
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
    cleanStorage,
    handleStopServer,
    dbSearchQuery,
    setDbSearchQuery,
    dbFilteredRows,
    dbMetrics,
    dbQueryLoading,
    querySQLiteIndex,
    serverAttachments,
    uploadFileToServer,
    deleteServerAttachment,
    exportZip,
    aiModel,
    setAiModel,
    aiProvider,
    setAiProvider,
    chatInputCount,
    setChatInputCount,
    currentModelInUse,
    setCurrentModelInUse,
    chatStats,
    setChatStats,
    setResubCommentsState,
    setRowActionsState,
    setHasPreExistingRemarksOrComments,
    setRepeatTrackerLoaded,
    shortcodesLoaded,
    isSavingInPlaceRef,
    syncSourceRef,
    activeEncounterNo,
    encounterDate,
    doubleAccumulationMode,
    setDoubleAccumulationMode,
    prewarmEncounterCache
  }
}

