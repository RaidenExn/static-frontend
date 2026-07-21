import { useEffect, useRef, useMemo } from 'react'
import { activityRaStatus, getShortcode, rcmNumVal, rowHasRepeatTrackerMarker } from '../utils'

import { usePortal } from '../context/PortalContext'

export function usePortalSync() {
  const {
    rcmResult,
    setRcmResult,
    encounterInput,
    shortcodes,
    shortcodesLoaded,
    resubmitType,
    setResubmitType,
    selectedRaFileId,
    setSelectedRaFileId,
    resubComments,
    setResubComments,
    raRemarks,
    setRaRemarks,
    setWriteOffRemarks,
    rowActions,
    setRowActionsState,

    autoTransferToRaRemarks,
    setAutoTransferToRaRemarks,
    hasPreExistingRemarksOrComments,
    setHasPreExistingRemarksOrComments,
    doubleAccumulationMode,
    repeatTrackerLoaded,
    setRepeatTrackerLoaded,
    loadingRepeatTracker,
    handleLoadRepeatTracker,
    showToast,
    isSavingInPlaceRef,
    syncSourceRef
  } = usePortal()
  const lastSuggestedRef = useRef<string>('')
  const lastInitializedEncounterRef = useRef<string>('')
  const initializedEncounterRef = useRef<string>('')

  // Auto-suggestions logic
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

  useEffect(() => {
    if (!activeEncounterNo) return
    const key = `${activeEncounterNo}_${resubmitType}_${suggestions.join(',')}`
    if (suggestions.length > 0 && !resubComments.trim() && lastSuggestedRef.current !== key) {
      lastSuggestedRef.current = key
      const nextVal = suggestions.join(' ')
      setResubComments(nextVal)
    }
  }, [
    suggestions,
    resubComments,
    resubmitType,
    activeEncounterNo,
    setResubComments
  ])

  // Bidirectional sync: Input -> Table

  // Sync Context & Pre-population
  useEffect(() => {
    if (isSavingInPlaceRef.current) {
      isSavingInPlaceRef.current = false
      return
    }
    if (!rcmResult?.Ok || !shortcodesLoaded) return
    const canonicalEncounter = String(
      rcmResult.Ok.rcm?.selected?.display_encounter_configno || rcmResult.Ok.encounterInput || ''
    )
      .trim()
      .toUpperCase()
    if (!canonicalEncounter) return

    if (initializedEncounterRef.current !== canonicalEncounter) {
      initializedEncounterRef.current = canonicalEncounter
      lastInitializedEncounterRef.current = canonicalEncounter

      let defaultFileId = ''
      const historyRows = rcmResult?.Ok?.rcm?.flattened?.history || []
      historyRows.forEach((row: any) => {
        const id = String(row.file_id || row.ra_file_id || '').trim()
        if (id && id !== '0') defaultFileId = id
      })
      const detailHistory = rcmResult?.Ok?.rcm?.detail?.claimHistory || []
      detailHistory.forEach((row: any) => {
        const id = String(row.file_id || row.ra_file_id || '').trim()
        if (id && id !== '0') defaultFileId = id
      })

      const claimRemarks = rcmResult?.Ok?.rcm?.detail?.claimRemarks || []
      setRaRemarks('')
      setWriteOffRemarks('')

      const writeContext = rcmResult?.Ok?.rcm?.writeContext
      const hasSavedRaRemarks = claimRemarks.some(
        (row: any) => Number(row.status_id) === 1 && String(row.remarks_ra || row.remarks || '').trim() !== ''
      )
      const hasSavedResubComments = String(writeContext?.existingReason?.comments || '').trim() !== ''
      const preExisting = hasSavedRaRemarks || hasSavedResubComments
      setHasPreExistingRemarksOrComments(preExisting)
      setAutoTransferToRaRemarks(!preExisting)

      setResubmitType('2')
      setSelectedRaFileId(defaultFileId)
      setResubComments('')

      const activityRows = rcmResult?.Ok?.rcm?.flattened?.activity || []
      const initialActions: Record<number, 're-sub' | 'w-off' | 'close'> = {}
      activityRows.forEach((row: any) => {
        const authId = Number(row.order_authorization_id)
        if (!authId) return

        const raStatus = activityRaStatus(row)
        if (raStatus !== 'Denied' && raStatus !== 'Partial Remittance') return

        const isFinalizedWriteOff =
          Number(row.pending_for_write_off || 0) === 2 ||
          Number(row.maked_for_write_off || 0) === 2 ||
          Number(row.activity_status_id || 0) === 9 ||
          String(row.activity_status || '').toLowerCase() === 'write-off' ||
          String(row.status || '').toLowerCase() === 'written off' ||
          String(row.status || '').toLowerCase() === 'write-off'

        if (isFinalizedWriteOff) {
          initialActions[authId] = 'w-off'
          return
        }

        if (Number(row.marked_closed || row.isClosed || 0) === 1) {
          initialActions[authId] = 'close'
          return
        }

        if (raStatus === 'Partial Remittance') {
          initialActions[authId] = 'w-off'
        } else {
          initialActions[authId] = 're-sub'
        }
      })
      setRowActionsState(initialActions)
    }
  }, [rcmResult, encounterInput, shortcodesLoaded, shortcodes])

  // Background trigger of Repeat Tracker analysis
  useEffect(() => {
    if (!rcmResult?.Ok) return
    const activityRows = rcmResult.Ok.rcm?.flattened?.activity || []
    const hasRepeatTrackerRow = activityRows.some((row: any) => rowHasRepeatTrackerMarker(row))
    const alreadyAnalyzed = activityRows.some(
      (row: any) => rowHasRepeatTrackerMarker(row) && row.repeatTrackerBillingSummary
    )
    if (hasRepeatTrackerRow) {
      if (alreadyAnalyzed) {
        if (!repeatTrackerLoaded) setRepeatTrackerLoaded(true)
      } else if (!repeatTrackerLoaded && !loadingRepeatTracker) {
        handleLoadRepeatTracker(rcmResult.Ok.encounterInput || encounterInput)
      }
    }
  }, [rcmResult, repeatTrackerLoaded, loadingRepeatTracker])

  return {
    suggestions,
    activeEncounterNo
  }
}
