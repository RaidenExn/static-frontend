import React, { useRef, useEffect, useState } from 'react'
import { MantineProvider, Tabs, Box, Grid } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import { theme as portalTheme, resolver as portalResolver } from './theme'
import { PortalProvider, usePortal } from './context/PortalContext'
import { usePortalActions } from './hooks/usePortalActions'
import { usePortalPrompts } from './hooks/usePortalPrompts'
import { openPdfInExtension, compressPdfOnBackend } from './utils'
import { compressAndMergePdfsOnBackend } from './services/recommendationEngine'
import { Attachment } from './types'
import { customFetch as fetch } from './config/backend'

// Component imports
import EncounterSearch from './components/EncounterSearch'
import CeedValidationModal from './components/CeedValidationModal'
import SummaryPanel from './components/SummaryPanel'
import VisitPanel from './components/VisitPanel'
import ActivityPanel from './components/ActivityPanel'
import RcmActionCenter from './components/RcmActionCenter'
import PromptPanel from './components/PromptPanel'
import SettingsPanel from './components/SettingsPanel'
import BulkOperationsPanel from './components/BulkOperationsPanel'
import ExcelWorkshopPanel from './components/ExcelWorkshopPanel'
import AppleIntelligencePanel from './components/AppleIntelligencePanel'

// Newly extracted components
import { ResultsHistoryTable } from './components/ResultsHistoryTable'
import { ClaimHistoryTable } from './components/ClaimHistoryTable'
import { LocalStorageController } from './components/LocalStorageController'
import { StorageJobMonitor } from './components/StorageJobMonitor'
import { NodeBackendFeed } from './components/NodeBackendFeed'
import ResubmissionLimitAlert from './components/ResubmissionLimitAlert'
import RemarksAndResubmissionsPanel from './components/activity/RemarksAndResubmissionsPanel'
import ResubmissionPreviewCard from './components/activity/ResubmissionPreviewCard'
import { useEncounterSync } from './hooks/useEncounterSync'
import { FRONTEND_VERSION } from './version'

import BackendConnectionScreen from './components/BackendConnectionScreen'

if (typeof window !== 'undefined' && window.location.hostname === '0.0.0.0') {
  window.location.hostname = 'localhost'
}

// customTheme removed - central theme imported from './theme'

export default function App() {
  const backendUrl = typeof window !== 'undefined' ? localStorage.getItem('lt-local-backend-url') : null

  if (!backendUrl) {
    return (
      <MantineProvider theme={portalTheme} cssVariablesResolver={portalResolver} forceColorScheme="dark">
        <Notifications />
        <BackendConnectionScreen />
      </MantineProvider>
    )
  }

  return (
    <PortalProvider>
      <style>{`
        /* Prevent nested/overlapping backdrop-filter calculations on children to protect GPU performance */
        [style*="backdrop-filter"] * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      `}</style>
      <AppInner />
    </PortalProvider>
  )
}

function AppInner() {
  const state = usePortal()
  const actions = usePortalActions()
  const prompts = usePortalPrompts()

  const {
    encounterInput,
    setEncounterInput,
    activeTab,
    selectTab,
    showToast,
    toasts,
    dismissToast,
    summaryResult,
    rcmResult,
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
    attachedFileName,
    setAttachedFileName,
    attachedFileBase64,
    setAttachedFileBase64,
    uploadFileToServer,
    raRemarks,
    setRaRemarks,
    autoCopyRaRemarks,
    setAutoCopyRaRemarks,
    writeOffRemarks,
    setWriteOffRemarks,
    rowActions,
    setRowActions,
    doubleAccumulationMode,
    setDoubleAccumulationMode,
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
    repeatTrackerLoaded,
    loadingRepeatTracker,
    repeatTrackerLookbackYears,
    setRepeatTrackerLookbackYears,
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
    handleLoadRepeatTracker,
    logs,
    logsLoading,
    storageInput,
    setStorageInput,
    storageConcurrency,
    setStorageConcurrency,
    storageJob,
    storedCount,
    storageLoading,
    startStorageCaching,
    clearStorageJob,
    cleanStorage,
    handleStopServer,
    serverAttachments,
    deleteServerAttachment,
    exportZip,
    shortcodes,
    aiModel,
    setAiModel,
    aiProvider,
    setAiProvider,
    chatInputCount,
    currentModelInUse,
    chatStats,
    prewarmEncounterCache
  } = state


  const {
    isSavingResub,
    isSavingRaRemarks,
    isSavingWriteOff,
    handleSaveResubmissionAndUpload,
    handleClearResubmission,
    handleRemoveAttachment,
    handleSaveRaRemarks,
    handleSaveWriteOffRemarks,
    exportHtml,
    exportPdf,
    exportXml,
    processFile
  } = actions

  const {
    handleAutoPrompt,
    handleCopyPrompt,
    handleNewChat,
    handleSendFollowUpReply,
    handleFollowUpReplyChange,
    followUpReply
  } = prompts

  const [dateEditMode, setDateEditMode] = useState(false)
  const [mnecLookbackYears, setMnecLookbackYears] = useState(2)
  const [autoScroll, setAutoScroll] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const terminalBodyRef = useRef<HTMLDivElement>(null)

  const handleGlobalPasteAndLoad = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText()
        const cleaned = text.trim()
        if (cleaned) {
          if (cleaned.includes('/ENC-') || cleaned.includes('-ENC-')) {
            setEncounterInput(cleaned)
            showToast?.(`Pasted and loading: "${cleaned}"`, 'ok')
            loadEncounter(cleaned)
          } else {
            showToast?.(`Invalid encounter format in clipboard`, 'warning')
          }
        } else {
          showToast?.('Clipboard is empty.', 'warning')
        }
      } else {
        showToast?.('Clipboard permission is restricted by browser policy.', 'error')
      }
    } catch (err) {
      console.error('Failed to read clipboard: ', err)
      showToast?.('Clipboard permission denied or failed.', 'error')
    }
  }

  useHotkeys([
    [
      'mod+k',
      (e) => {
        e.preventDefault()
        handleGlobalPasteAndLoad()
      }
    ],
    [
      'mod+i',
      (e) => {
        e.preventDefault()
        handleAutoPrompt?.()
      }
    ],
    [
      'mod+u',
      (e) => {
        e.preventDefault()
        handleAutoRecommendationAttachment()
      }
    ]
  ])

  useEffect(() => {
    if (activeTab === 'logs' && terminalBodyRef.current && autoScroll) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
    }
  }, [logs, activeTab, autoScroll])

  const patientHeader = summaryResult?.Ok?.patientHeader || rcmResult?.Ok?.patientHeader
  const selected = summaryResult?.Ok?.selected || rcmResult?.Ok?.rcm?.selected
  const isPaperClaim = Number(selected?.is_paper_claim) === 1 || Number(selected?.is_paper) === 1
  const resolvedEncounter = patientHeader?.resolvedEncounter || (encounterInput === '' ? '-' : encounterInput)

  // Dynamic fallback for encounter start and end dates derived from activities
  const activityRows = rcmResult?.Ok?.rcm?.flattened?.activity || []
  const fallbackStartDate = React.useMemo(() => {
    if (selected?.encounter_start_date || selected?.enc_date) {
      return selected.encounter_start_date || selected.enc_date
    }
    const firstAct = activityRows.find((r: any) => r.activity_start_date_time) || activityRows.find((r: any) => r.auth_item_date)
    return firstAct ? (firstAct.activity_start_date_time || firstAct.auth_item_date || '') : ''
  }, [selected, activityRows])

  const fallbackEndDate = React.useMemo(() => {
    if (selected?.encounter_end_date || selected?.enc_end_date) {
      return selected.encounter_end_date || selected.enc_end_date
    }
    let maxDate: Date | null = null
    let maxStr = ''
    activityRows.forEach((r: any) => {
      const str = r.auth_item_exp_date || r.auth_item_date || r.activity_start_date_time
      if (!str) return
      const match = str.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})/)
      if (match) {
        const [_, day, month, year, hour, minute] = match
        const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
        if (!maxDate || d.getTime() > maxDate.getTime()) {
          maxDate = d
          maxStr = str
        }
      } else {
        const d = new Date(str)
        if (!isNaN(d.getTime()) && (!maxDate || d.getTime() > maxDate.getTime())) {
          maxDate = d
          maxStr = str
        }
      }
    })
    return maxStr || fallbackStartDate
  }, [selected, activityRows, fallbackStartDate])

  useEncounterSync({
    encounterNumber: resolvedEncounter && resolvedEncounter !== '-' ? resolvedEncounter : undefined,
    onUpdate: () => {
      if (!loading) {
        loadEncounter(resolvedEncounter, false)
      }
    }
  })

  const [ceedModalOpen, setCeedModalOpen] = useState<boolean>(false)
  const encounterDate = patientHeader?.encounterDate || '-'
  const visitCount = rcmResult?.Ok?.rcm?.flattened?.visit?.length || 0
  const historicCount = summaryResult?.Ok?.patientHistoricFiles?.length || 0
  const claimHistory = rcmResult?.Ok?.rcm?.detail?.claimHistory || []

  const recommendations = React.useMemo<{
    recommended: Attachment[]
    reasons: Record<string, string>
    scores: Record<string, number>
  }>(() => {
    return (
      summaryResult?.Ok?.recommendations ||
      rcmResult?.Ok?.rcm?.recommendations || {
        recommended: [],
        reasons: {},
        scores: {}
      }
    )
  }, [summaryResult, rcmResult])

  const recommendedUrls = React.useMemo(() => {
    return new Set(recommendations.recommended.map((att: Attachment) => att.downloadUrl).filter(Boolean) as string[])
  }, [recommendations])

  const handleAutoRecommendationAttachment = async () => {
    const recs = recommendations.recommended || []
    if (recs.length === 0) {
      showToast?.('No matching clinical PDFs recommended for this encounter.', 'info')
      return
    }

    const startTime = Date.now()
    const pdfPayloads = recs
      .map((att: Attachment) => ({
        downloadUrl: att.downloadUrl || '',
        fileName: att.name || 'document.pdf'
      }))
      .filter((item: { downloadUrl: string; fileName: string }) => !!item.downloadUrl)

    if (pdfPayloads.length === 0) {
      showToast?.('No valid recommended download URLs found.', 'error')
      return
    }

    const result = await compressAndMergePdfsOnBackend(pdfPayloads, resolvedEncounter, showToast, resolvedEncounter)
    if (result && (result.base64 || result.success)) {
      if (result.base64) {
        setAttachedFileBase64(result.base64)
        setAttachedFileName(result.fileName)
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      }

      let statsString = ''
      if (result.beforeBytes && result.afterBytes) {
        const beforeStr = formatBytes(result.beforeBytes)
        const afterStr = formatBytes(result.afterBytes)
        const savings = Math.round(((result.beforeBytes - result.afterBytes) / result.beforeBytes) * 100)
        statsString = ` (${beforeStr} → ${afterStr}, saved ${savings}%)`
      }

      showToast?.(`Merged and attached ${pdfPayloads.length} PDFs in ${elapsed}s${statsString}!`, 'ok')
      selectTab('activity')
    } else {
      showToast?.('Failed to merge and compress recommended PDFs.', 'error')
    }
  }

  useEffect(() => {
    if (resolvedEncounter && resolvedEncounter !== '-' && !loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [resolvedEncounter, loading])

  useEffect(() => {
    document.title = `lt-portal v${FRONTEND_VERSION}`


    // Dynamic browser tab favicon using Lucide Activity SVG styled in neutral monochrome gray
    const svgString = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#8e8e8e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M22 12h-4l-3 9L9 3l-3 9H2'/></svg>`
    const base64Svg = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`

    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/svg+xml'
    link.href = base64Svg
  }, [patientHeader?.resolvedEncounter])

  const handleOpenPdf = (downloadUrl: string, fileName: string) => {
    openPdfInExtension(downloadUrl, fileName, false, showToast)
  }

  const handleCompressPdf = async (downloadUrl: string, fileName: string) => {
    const startTime = Date.now()
    const result = await compressPdfOnBackend(downloadUrl, fileName, showToast, true)
    if (result && result.base64) {
      setAttachedFileBase64(result.base64)
      setAttachedFileName(result.fileName)

      await uploadFileToServer(result.fileName, result.base64, 'pdf-compression')

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      }
      const shortenFileName = (name: string, maxLen = 22): string => {
        const clean = name.trim()
        if (clean.length <= maxLen) return clean
        const extIdx = clean.lastIndexOf('.')
        const ext = extIdx !== -1 ? clean.substring(extIdx) : '.pdf'
        const base = extIdx !== -1 ? clean.substring(0, extIdx) : clean
        const charsToShow = maxLen - ext.length - 3
        if (charsToShow <= 0) return clean.substring(0, maxLen)
        return `${base.substring(0, charsToShow)}...${ext}`
      }

      let statsString = ''
      if (result.beforeBytes && result.afterBytes) {
        const beforeStr = formatBytes(result.beforeBytes)
        const afterStr = formatBytes(result.afterBytes)
        const savings = Math.round(((result.beforeBytes - result.afterBytes) / result.beforeBytes) * 100)
        statsString = `\nSaved ${savings}% (${beforeStr} → ${afterStr}) in ${elapsed}s`
      } else {
        statsString = `\nCompleted in ${elapsed}s`
      }

      const sourcePrefix = result.source === 'cache' ? ' [Cache Hit]' : ' [EHR Streamed]'

      showToast({
        id: 'pdf-compression',
        title: `PDF Compressed${sourcePrefix}`,
        message: `File: ${shortenFileName(result.fileName)}${statsString}\nAttached to server portfolio successfully.`,
        tone: 'ok',
        duration: 6000
      })
    }
  }

  const handleCopyLink = async (downloadUrl: string) => {
    try {
      const res = await fetch('/api/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl })
      })
      const data = await res.json()
      await navigator.clipboard.writeText(data.resolvedUrl || downloadUrl)
      showToast('PDF link copied to clipboard!', 'ok')
    } catch (_) {
      showToast('Failed to copy link', 'error')
    }
  }

  const handleCopyPdfPrompt = async (downloadUrl: string) => {
    try {
      const res = await fetch('/api/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl })
      })
      const data = await res.json()
      const url = data.resolvedUrl || downloadUrl
      const match = url.match(/\/encounter\/(\d+)/)
      const recordId = match ? `Encounter ${match[1]}` : 'Unknown'

      const prompt = `<PromptTask>
    <Instruction>Parse the attached medical record document and extract out-of-reference-range (abnormal) data findings matching the plain text parameters exactly.</Instruction>
    <SourceContext>
        <RecordID>${recordId}</RecordID>
        <SourceURL>${url}</SourceURL>
    </SourceContext>
    <Constraints>
        <Constraint>Extract abnormal findings only.</Constraint>
        <Constraint>Output raw plain text format only.</Constraint>
        <Constraint>Strictly forbid XML tags, markdown wrappers, introductions, summaries, or conversational chatter in the final output.</Constraint>
    </Constraints>
    <ExpectedOutputFormat>
        <![CDATA[
        Name: [patient name]

        [short test name] [value] [unit] [flag] (Normal: [range])
        
        Note: Output exactly one finding per line.
        ]]>
    </ExpectedOutputFormat>
    <FallbackCondition>
        <![CDATA[
        If no abnormalities are present in the lab record, output exactly:
        Name: [patient name]
        NO ABNORMAL DATA
        ]]>
    </FallbackCondition>
</PromptTask>`

      await navigator.clipboard.writeText(prompt)
      showToast('Prompt copied to clipboard!', 'ok')
    } catch (_) {
      showToast('Failed to copy prompt', 'error')
    }
  }

  const { grossResub, grossWriteOff, pendingResub, pendingWriteOff } = calculatedFinances
  const activityRowsForCalc = rcmResult?.Ok?.rcm?.flattened?.activity || []
  const preExistingWriteOff = Number(activityRowsForCalc[0]?.write_off_amount) || 0.0

  const allActivitiesWriteOff =
    activityRowsForCalc.length > 0 &&
    activityRowsForCalc.every((row: any) => {
      const authId = Number(row.order_authorization_id)
      return rowActions[authId] === 'w-off'
    })

  const writeContext = rcmResult?.Ok?.rcm?.writeContext || {}
  const guardrails = writeContext.guardrails || {}
  const resubmissionCount = guardrails.count !== undefined ? Number(guardrails.count) : 0
  const resubmissionRateCard = guardrails.rateCard !== undefined ? Number(guardrails.rateCard) : 3
  const limitExceeded = !!guardrails.limitExceeded
  const limitWarning = guardrails.warning || ''

  const submissionStateColor = React.useMemo(() => {
    return rcmResult?.Ok?.rcm?.writeContext?.submissionState?.badgeColor || 'gray'
  }, [rcmResult])

  const fontSizes = React.useMemo(() => {
    const scales: Record<string, { xs: string; sm: string; md: string; lg: string; xl: string }> = {
      compact: { xs: '10px', sm: '11px', md: '13px', lg: '15px', xl: '17px' },
      standard: { xs: '11px', sm: '12px', md: '14px', lg: '16px', xl: '18px' },
      comfortable: { xs: '12px', sm: '13px', md: '15px', lg: '17px', xl: '19px' },
      large: { xs: '13px', sm: '14px', md: '16px', lg: '18px', xl: '20px' }
    }
    return scales[fontScale] || scales.standard
  }, [fontScale])

  const spacingScaleValues = React.useMemo(() => {
    const scales: Record<string, { xs: string; sm: string; md: string; lg: string; xl: string }> = {
      xs: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
      sm: { xs: '6px', sm: '10px', md: '14px', lg: '18px', xl: '26px' },
      md: { xs: '8px', sm: '12px', md: '16px', lg: '20px', xl: '28px' },
      lg: { xs: '10px', sm: '14px', md: '18px', lg: '22px', xl: '30px' },
      xl: { xs: '12px', sm: '16px', md: '20px', lg: '24px', xl: '32px' }
    }
    return scales[spacingScale] || scales.xs
  }, [spacingScale])

  const dynamicTheme = React.useMemo(() => {
    let fontString = 'Inter, system-ui, -apple-system, sans-serif'
    if (activeFont === 'Outfit') {
      fontString = 'Outfit, system-ui, -apple-system, sans-serif'
    } else if (activeFont === 'Roboto') {
      fontString = 'Roboto, system-ui, -apple-system, sans-serif'
    } else if (activeFont === 'JetBrains Mono') {
      fontString = 'JetBrains Mono, Courier New, monospace'
    }

    return {
      ...portalTheme,
      primaryColor: primaryColor === 'dark' ? 'dark' : primaryColor,
      defaultRadius: cornerRadius,
      fontFamily: fontString,
      fontSizes: fontSizes,
      spacing: spacingScaleValues
    }
  }, [primaryColor, cornerRadius, activeFont, fontSizes, spacingScaleValues])

  return (
    <MantineProvider
      theme={dynamicTheme as any}
      cssVariablesResolver={portalResolver}
      forceColorScheme={theme === 'dark' ? 'dark' : 'light'}
    >
      <Notifications
        position="bottom-left"
        zIndex={99999}
        style={{ left: '12px', bottom: '12px', pointerEvents: 'none', position: 'fixed' }}
      />
      <Tabs value={activeTab} onChange={(val) => selectTab((val || 'summary') as any)}>
        <Box
          style={{
            backgroundColor: 'var(--bg-app)',
            color: 'var(--ink)',
            minHeight: '100vh',
            padding: activeTab === 'summary' ? '0px 10px 10px 10px' : '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <Box
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              backgroundColor: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingTop: '10px',
              marginTop: '-10px',
              paddingBottom: '8px'
            }}
          >
            <EncounterSearch
              encounterInput={encounterInput}
              setEncounterInput={setEncounterInput}
              loading={loading}
              onLoadEncounter={(val) => loadEncounter(val)}
              onForceReload={() => loadEncounter(undefined, true)}
              onAutoPrompt={handleAutoPrompt}
              onCopyPrompt={handleCopyPrompt}
              onNewChat={handleNewChat}
              onPrewarmEncounter={prewarmEncounterCache}
              recentEncounters={recentEncounters}

              clearRecentEncounters={clearRecentEncounters}
              resolvedEncounter={resolvedEncounter}
              patientName={patientHeader?.patientName || '-'}
              patientAge={patientHeader?.patientAge || '-'}
              patientGender={patientHeader?.gender || '-'}
              doctorName={patientHeader?.doctorName || '-'}
              encounterDate={encounterDate}
              insuranceCardNo={patientHeader?.insuranceCardNo || '-'}
              insuranceCardNoSource={patientHeader?.insuranceCardNoSource}
              receiverName={patientHeader?.receiverName || '-'}
              payerName={patientHeader?.payerName || '-'}
              networkName={patientHeader?.networkName || '-'}
              expiryDate={patientHeader?.expiryDate || '-'}
              resubmissionCount={resubmissionCount}
              claimHistory={claimHistory}
              submissionState={rcmResult?.Ok?.rcm?.writeContext?.submissionState}
              activeTab={activeTab}
              onSelectTab={selectTab as (id: string) => void}
              showToast={showToast}
              isPaperClaim={isPaperClaim}
              onDownloadXml={exportXml}
              dateEditMode={dateEditMode}
              setDateEditMode={setDateEditMode}
              aiModel={aiModel}
              setAiModel={setAiModel}
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              chatInputCount={chatInputCount}
              currentModelInUse={currentModelInUse}
              onOpenCeedValidator={() => setCeedModalOpen(true)}
              chatStats={chatStats}
              activityCount={activityRowsForCalc.length}
              visitCount={visitCount}
            />
          </Box>

          <Tabs.Panel value="summary">
            <SummaryPanel
              active={activeTab === 'summary'}
              summaryHtml={summaryResult?.Ok?.summaryHtml || ''}
              onExportHtml={exportHtml}
              onExportPdf={exportPdf}
              onExportZip={exportZip}
              showToast={showToast as any}
              encounter={encounterInput}
              theme={theme}
            />
          </Tabs.Panel>

          <Tabs.Panel value="activity">
            <ActivityPanel
              active={activeTab === 'activity'}
              activityCount={rcmResult?.Ok?.rcm?.flattened?.activity?.length || 0}
              activityRows={rcmResult?.Ok?.rcm?.flattened?.activity || []}
              remarksCount={rcmResult?.Ok?.rcm?.flattened?.remarks?.length || 0}
              remarksRows={rcmResult?.Ok?.rcm?.flattened?.remarks || []}
              resubmissionsCount={rcmResult?.Ok?.rcm?.flattened?.resubmissions?.length || 0}
              resubmissionsRows={rcmResult?.Ok?.rcm?.flattened?.resubmissions || []}
              rowActions={rowActions}
              setRowActions={setRowActions}
              canSaveRaRemarks={!!rcmResult?.Ok?.rcm?.writeContext?.canSaveRaRemarks}
              appDateTime={selected?.app_date_time}
              visits={rcmResult?.Ok?.rcm?.flattened?.visit || []}
              onLoadSubmissionFile={loadSubmissionFile}
              loading={loading}
              repeatTrackerLoaded={repeatTrackerLoaded}
              onLoadRepeatTracker={handleLoadRepeatTracker}
              loadingRepeatTracker={loadingRepeatTracker}
              repeatTrackerLookbackYears={repeatTrackerLookbackYears}
              setRepeatTrackerLookbackYears={setRepeatTrackerLookbackYears}
              shortcodes={shortcodes}
              dateEditMode={dateEditMode}
              setDateEditMode={setDateEditMode}
              encounter={resolvedEncounter}
              {...({ onRefreshEncounter: () => loadEncounter(resolvedEncounter) } as any)}
              encounterStartDate={fallbackStartDate}
              encounterEndDate={fallbackEndDate}
              showToast={showToast}
            />

            {activeTab === 'activity' && (
              <>
                <ResubmissionLimitAlert
                  limitExceeded={limitExceeded}
                  limitWarning={limitWarning}
                  resubmissionCount={resubmissionCount}
                  resubmissionRateCard={resubmissionRateCard}
                />

                <Grid mt="md" style={{ alignItems: 'start' }} {...({ gutter: 'md' } as any)}>
                  <Grid.Col
                    span={{ base: 12, lg: 7.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}
                  >
                    <RemarksAndResubmissionsPanel
                      loading={!!loading}
                      remarksCount={rcmResult?.Ok?.rcm?.flattened?.remarks?.length || 0}
                      remarksRows={rcmResult?.Ok?.rcm?.flattened?.remarks || []}
                      resubmissionsCount={rcmResult?.Ok?.rcm?.flattened?.resubmissions?.length || 0}
                      resubmissionsRows={rcmResult?.Ok?.rcm?.flattened?.resubmissions || []}
                      onLoadSubmissionFile={loadSubmissionFile}
                      adaptiveCardColors={adaptiveCardColors}
                      submissionStateColor={submissionStateColor}
                      theme={theme}
                    />

                    <ResultsHistoryTable
                      resultsLoading={resultsLoading}
                      attachments={summaryResult?.Ok?.attachments || []}
                      encounterDate={encounterDate}
                      onCopyLink={handleCopyLink}
                      onCopyPdfPrompt={handleCopyPdfPrompt}
                      onCompressPdf={handleCompressPdf}
                      onOpenPdf={handleOpenPdf}
                      recommendedUrls={recommendedUrls}
                      recommendationReasons={recommendations.reasons}
                    />
                  </Grid.Col>

                  <Grid.Col
                    span={{ base: 12, lg: 4.8 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}
                  >
                    <ResubmissionPreviewCard
                      activityRows={rcmResult?.Ok?.rcm?.flattened?.activity || []}
                      rowActions={rowActions}
                      shortcodes={shortcodes}
                    />
                    <RcmActionCenter
                      onAutoPrompt={handleAutoPrompt}
                      loading={loading}
                      adaptiveCardColors={adaptiveCardColors}
                      submissionStateColor={submissionStateColor}
                      canSaveResubmission={!!rcmResult?.Ok?.rcm?.writeContext?.canSaveResubmission}
                      canSaveRaRemarks={!!rcmResult?.Ok?.rcm?.writeContext?.canSaveRaRemarks}
                      resubmitType={resubmitType}
                      setResubmitType={setResubmitType}
                      selectedRaFileId={selectedRaFileId}
                      setSelectedRaFileId={setSelectedRaFileId}
                      raFilesList={raFilesList}
                      onAttachSummary={handleAttachSummary}
                      attachedFileName={attachedFileName}
                      attachedFileBase64={attachedFileBase64}
                      fileInputRef={fileInputRef}
                      onFileChange={(e) => {
                        if (e.target.files && e.target.files[0]) processFile(e.target.files[0])
                      }}
                      showToast={showToast}
                      serverAttachments={serverAttachments}
                      onDeleteServerAttachment={deleteServerAttachment}
                      isDragOver={false}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0])
                      }}
                      resubComments={resubComments}
                      setResubComments={setResubComments}
                      suggestions={suggestions}
                      isSavingResub={isSavingResub}
                      onSaveResubmissionAndUpload={handleSaveResubmissionAndUpload}
                      followUpReply={followUpReply}
                      onFollowUpReplyChange={handleFollowUpReplyChange}
                      onSendFollowUpReply={handleSendFollowUpReply}
                      onClearResubmission={handleClearResubmission}
                      onRemoveAttachment={handleRemoveAttachment}
                      raRemarks={raRemarks}
                      setRaRemarks={setRaRemarks}
                      autoCopyRaRemarks={autoCopyRaRemarks}
                      setAutoCopyRaRemarks={setAutoCopyRaRemarks}
                      isSavingRaRemarks={isSavingRaRemarks}
                      onSaveRaRemarks={handleSaveRaRemarks}
                      onClearRaRemarks={() => {
                        setRaRemarks('')
                        showToast('Remarks cleared.', 'ok')
                      }}
                      writeOffRemarks={writeOffRemarks}
                      setWriteOffRemarks={setWriteOffRemarks}
                      isSavingWriteOff={isSavingWriteOff}
                      onSaveWriteOff={handleSaveWriteOffRemarks}
                      onClearWriteOff={() => {
                        setWriteOffRemarks('')
                        showToast('Write-off remarks cleared.', 'ok')
                      }}
                      doubleAccumulationMode={doubleAccumulationMode}
                      setDoubleAccumulationMode={setDoubleAccumulationMode}
                      grossResub={grossResub}
                      grossWriteOff={grossWriteOff}
                      pendingResub={pendingResub}
                      pendingWriteOff={pendingWriteOff}
                      preExistingWriteOff={preExistingWriteOff}
                      hasExistingReason={!!rcmResult?.Ok?.rcm?.writeContext?.existingReason}
                      autoTransferToRaRemarks={autoTransferToRaRemarks}
                      setAutoTransferToRaRemarks={setAutoTransferToRaRemarks}
                      hasPreExistingRemarksOrComments={hasPreExistingRemarksOrComments}
                      autoAttachSummary={autoAttachSummary}
                      setAutoAttachSummary={setAutoAttachSummary}
                      allActivitiesWriteOff={allActivitiesWriteOff}
                    />
                  </Grid.Col>
                </Grid>

                <ClaimHistoryTable claimHistory={claimHistory} />
              </>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="visit">
            <VisitPanel
              active={activeTab === 'visit'}
              visitCount={visitCount}
              visitRows={rcmResult?.Ok?.rcm?.flattened?.visit || []}
              currentEncounter={resolvedEncounter}
              historicCount={historicCount}
              historicFiles={summaryResult?.Ok?.patientHistoricFiles || []}
              onOpenPdf={handleOpenPdf}
              historicLoading={historicLoading}
              loading={loading}
              sortedRows={[]}
              loadingRepeatTracker={loadingRepeatTracker}
              repeatTrackerLoaded={repeatTrackerLoaded}
              {...({} as any)}
            />
          </Tabs.Panel>

          <Tabs.Panel value="storage">
            {activeTab === 'storage' && (
              <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <LocalStorageController
                  storageInput={storageInput}
                  setStorageInput={setStorageInput}
                  storageLoading={storageLoading}
                  storageJob={storageJob}
                  storageConcurrency={storageConcurrency}
                  setStorageConcurrency={setStorageConcurrency}
                  onStartStorageCaching={startStorageCaching}
                />
                <StorageJobMonitor
                  storedCount={storedCount}
                  storageJob={storageJob}
                  onClearStorageJob={clearStorageJob}
                  onCleanStorage={cleanStorage}
                />
              </section>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="logs">
            {activeTab === 'logs' && (
              <NodeBackendFeed
                logs={logs}
                logsLoading={logsLoading}
                terminalBodyRef={terminalBodyRef}
                onTerminalScroll={() => {
                  if (!terminalBodyRef.current) return
                  const { scrollTop, scrollHeight, clientHeight } = terminalBodyRef.current
                  setAutoScroll(scrollHeight - scrollTop - clientHeight < 15)
                }}
                autoScroll={autoScroll}
                onToggleAutoScroll={setAutoScroll}
              />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="prompt">
            <PromptPanel active={activeTab === 'prompt'} showToast={showToast} />
          </Tabs.Panel>

          <Tabs.Panel value="settings">
            <SettingsPanel
              active={activeTab === 'settings'}
              showToast={showToast}
              theme={theme}
              toggleTheme={toggleTheme}
              setTheme={setTheme}
              onStopServer={handleStopServer}
              aiModel={aiModel}
              setAiModel={setAiModel}
              primaryColor={primaryColor}
              setPrimaryColor={setPrimaryColor}
              bgPalette={bgPalette}
              setBgPalette={setBgPalette}
              cornerRadius={cornerRadius}
              setCornerRadius={setCornerRadius}
              activeFont={activeFont}
              setActiveFont={setActiveFont}
              fontScale={fontScale}
              setFontScale={setFontScale}
              spacingScale={spacingScale}
              setSpacingScale={setSpacingScale}
              visualStyle={visualStyle}
              setVisualStyle={setVisualStyle}
              adaptiveCardColors={adaptiveCardColors}
              setAdaptiveCardColors={setAdaptiveCardColors}
            />
          </Tabs.Panel>

          <Tabs.Panel value="bulk">
            <BulkOperationsPanel
              active={activeTab === 'bulk'}
              showToast={showToast}
              repeatTrackerLookbackYears={repeatTrackerLookbackYears}
              setRepeatTrackerLookbackYears={setRepeatTrackerLookbackYears}
              mnecLookbackYears={mnecLookbackYears}
              setMnecLookbackYears={setMnecLookbackYears}
            />
          </Tabs.Panel>

          <Tabs.Panel value="workshop">
            <ExcelWorkshopPanel active={activeTab === 'workshop'} showToast={showToast} />
          </Tabs.Panel>

          <Tabs.Panel value="afm">
            <AppleIntelligencePanel active={activeTab === 'afm'} showToast={showToast} />
          </Tabs.Panel>
        </Box>
      </Tabs>
      <CeedValidationModal
        isOpen={ceedModalOpen}
        onClose={() => setCeedModalOpen(false)}
        encounterId={resolvedEncounter !== '-' ? resolvedEncounter : ''}
      />
    </MantineProvider>
  )
}
