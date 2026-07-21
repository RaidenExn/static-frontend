import { useState } from 'react'
import {
  safeFileName,
  openBlobUrl,
  openPdfInExtension,
  copyTextToClipboardFast,
  ensureNotificationPermission,
  showSystemNotification,
  applyRowAction
} from '../utils'

import { usePortal } from '../context/PortalContext'
import { customFetch as fetch } from '../config/backend'

export function usePortalActions() {
  const {
    encounterInput,
    summaryResult,
    rcmResult,
    setRcmResult,
    resubmitType,
    setResubmitType,
    selectedRaFileId,
    setSelectedRaFileId,
    resubComments,
    setResubComments,
    raRemarks,
    setRaRemarks,
    autoCopyRaRemarks,
    writeOffRemarks,
    setWriteOffRemarks,
    attachedFileBase64,
    setAttachedFileBase64,
    attachedFileName,
    setAttachedFileName,
    rowActions,
    setRowActions,
    doubleAccumulationMode,
    isSavingInPlaceRef,
    showToast,
    raFilesList,
    uploadFileToServer,
    autoAttachSummary
  } = usePortal()
  const [isSavingResub, setIsSavingResub] = useState<boolean>(false)
  const [isSavingRaRemarks, setIsSavingRaRemarks] = useState<boolean>(false)
  const [isSavingWriteOff, setIsSavingWriteOff] = useState<boolean>(false)

  const handleSaveResubmissionAndUpload = async () => {
    if (!encounterInput.trim()) return showToast('No active encounter loaded.', 'error')
    if (!resubComments.trim()) return showToast('Please enter resubmission comments.', 'error')
    if (!selectedRaFileId) return showToast('Please select an associated RA file.', 'error')

    const toastId = 'resubmission'
    setIsSavingResub(true)
    showToast({
      id: toastId,
      title: 'Resubmitting Claim',
      message: !attachedFileBase64
        ? 'Saving comments to server without a PDF attachment...'
        : 'Saving resubmission comments to server...',
      tone: 'loading'
    })

    const writeContext = rcmResult?.Ok?.rcm?.writeContext || {}
    const payload = {
      encounter: encounterInput.trim(),
      body: {
        resubmitType: Number(resubmitType),
        comments: resubComments.trim(),
        raFileId: Number(selectedRaFileId),
        resubmitReasonId: Number(writeContext.resubmitReasonId || 0),
        attachmentBase64: attachedFileBase64,
        autoAttachSummary
      }
    }

    try {
      const response = await fetch('/api/rcm/resubmission-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)

      showToast({
        id: toastId,
        title: 'Claim Resubmitted',
        message: 'Resubmission comments saved and updated successfully.',
        tone: 'ok',
        duration: 5000
      })

      const newReasonId =
        data.resubmit_reason_id ||
        data.resubmitReasonId ||
        data.Data?.[0]?.resubmit_reason_id ||
        writeContext.resubmitReasonId ||
        0
      const newReasonObj = {
        type: Number(resubmitType),
        fileId: Number(selectedRaFileId),
        fileName: attachedFileName || raFilesList.find((f) => f.id === selectedRaFileId)?.name || '',
        comments: resubComments.trim()
      }

      isSavingInPlaceRef.current = true
      setRcmResult((prev: any) => {
        if (!prev || !prev.Ok) return prev
        const currentResubmissions = prev.Ok.rcm?.flattened?.resubmissions || []
        const hasSavedComment = currentResubmissions.some((r: any) => r.source === 'Saved Comment')

        let nextResubmissions = [...currentResubmissions]
        const typeLabel =
          resubmitType === '1' ? 'Correction' : resubmitType === '3' ? 'Reconciliation' : 'Internal Complaints'
        const raFileName = attachedFileName || raFilesList.find((f) => f.id === selectedRaFileId)?.name || ''

        if (hasSavedComment) {
          nextResubmissions = nextResubmissions.map((r: any) => {
            if (r.source === 'Saved Comment') {
              return {
                ...r,
                type: typeLabel,
                ra_file_name: raFileName,
                file_id: selectedRaFileId,
                reason: resubComments.trim(),
                captured_on: new Date().toISOString()
              }
            }
            return r
          })
        } else {
          const newResubRow = {
            _encounter: encounterInput.trim(),
            source: 'Saved Comment',
            type: typeLabel,
            ra_file_name: raFileName,
            file_id: selectedRaFileId,
            site_id: prev.Ok.rcm?.selected?.site_id || '',
            file_type_id: 1,
            reason: resubComments.trim(),
            user_name: 'Local Portal',
            captured_on: new Date().toISOString(),
            payment_ref: prev.Ok.rcm?.selected?.payment_reference_no || ''
          }
          nextResubmissions = [newResubRow, ...nextResubmissions]
        }

        return {
          ...prev,
          Ok: {
            ...prev.Ok,
            rcm: {
              ...prev.Ok.rcm,
              writeContext: {
                ...prev.Ok.rcm.writeContext,
                resubmitReasonId: newReasonId,
                existingReason: newReasonObj,
                canSaveRaRemarks: true,
                canSaveResubmission: true
              },
              flattened: {
                ...prev.Ok.rcm.flattened,
                resubmissions: nextResubmissions
              }
            }
          }
        }
      })
    } catch (err: any) {
      showToast({
        id: toastId,
        title: 'Resubmission Failed',
        message: `Failed to save resubmission: ${err.message}`,
        tone: 'error',
        duration: 6000
      })
    } finally {
      setIsSavingResub(false)
    }
  }

  const handleClearResubmission = () => {
    let defaultFileId = ''
    const historyRows = rcmResult?.Ok?.rcm?.flattened?.history || []
    historyRows.forEach((row: any) => {
      const id = String(row.file_id || row.ra_file_id || '').trim()
      if (id && id !== '0') defaultFileId = id
    })
    setResubmitType('2')
    setSelectedRaFileId(defaultFileId)
    setResubComments('')
    setAttachedFileName('')
    setAttachedFileBase64('')

    showToast({
      id: 'resubmission',
      title: 'Form Reset',
      message: 'Resubmission form cleared successfully.',
      tone: 'ok',
      duration: 4000
    })
  }

  const handleRemoveAttachment = () => {
    setAttachedFileName('')
    setAttachedFileBase64('')
    showToast({
      id: 'resubmission',
      title: 'Attachment Removed',
      message: 'PDF attachment removed from resubmission form.',
      tone: 'ok',
      duration: 4000
    })
  }

  const handleSaveRaRemarks = async () => {
    const toastId = 'ra-action'
    if (!encounterInput.trim()) return showToast('No active encounter loaded.', 'error')
    if (!raRemarks.trim()) return showToast('Please enter remarks before saving.', 'error')

    const existingReason = rcmResult?.Ok?.rcm?.writeContext?.existingReason
    const serverComments = (existingReason?.comments || '').trim()

    const hasReSubAction = Object.values(rowActions).some((action) => action === 're-sub')
    if (!serverComments && hasReSubAction) {
      return showToast({
        id: toastId,
        title: 'RA Remarks Action Check',
        message: 'Please enter resubmission comments before saving RA remarks.',
        tone: 'error',
        duration: 6000
      })
    }

    setIsSavingRaRemarks(true)
    showToast({
      id: toastId,
      title: 'RA Remarks',
      message: 'Saving Remittance Advice remarks to server...',
      tone: 'loading'
    })
    void ensureNotificationPermission()

    const payload = {
      encounter: encounterInput.trim(),
      body: {
        tabStatusId: 1,
        resubmitType: Number(resubmitType),
        remarks: raRemarks.trim(),
        rowActions,
        doubleAccumulationMode
      }
    }

    const copyText = raRemarks.trim()
    if (autoCopyRaRemarks && copyText) {
      void copyTextToClipboardFast(copyText, 250)
        .then(() =>
          showToast({
            id: toastId,
            title: 'Clipboard',
            message: 'RA remarks saved & copied to clipboard.',
            tone: 'ok',
            duration: 5000
          })
        )
        .catch((clipboardErr) => {
          console.warn('RA remarks clipboard copy failed:', clipboardErr)
          showToast({
            id: toastId,
            title: 'Remarks Warning',
            message: 'RA remarks saved but clipboard copy failed.',
            tone: 'warning',
            duration: 5000
          })
        })
    }

    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 45000)
      const response = await fetch('/api/rcm/ra-remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).finally(() => window.clearTimeout(timeout))
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)

      if (!autoCopyRaRemarks) {
        showToast({
          id: toastId,
          title: 'RA Remarks Saved',
          message: 'RA remarks saved and synced successfully.',
          tone: 'ok',
          duration: 5000
        })
      }

      isSavingInPlaceRef.current = true
      setRcmResult((prev: any) => {
        if (!prev || !prev.Ok) return prev

        const currentRemarks = prev.Ok.rcm?.flattened?.remarks || []
        const hasRaRemark = currentRemarks.some((r: any) => Number(r.status_id) === 1)

        let nextRemarks = [...currentRemarks]
        if (hasRaRemark) {
          nextRemarks = nextRemarks.map((r: any) => {
            if (Number(r.status_id) === 1) {
              return {
                ...r,
                remarks_ra: raRemarks.trim(),
                remarks: raRemarks.trim(),
                created_on: new Date().toISOString()
              }
            }
            return r
          })
        } else {
          const newRemark = {
            _encounter: encounterInput.trim(),
            status_id: 1,
            remarks_from: 'RA Remarks',
            remarks_ra: raRemarks.trim(),
            remarks: raRemarks.trim(),
            created_by_name: 'Local Portal',
            created_on: new Date().toISOString()
          }
          nextRemarks = [newRemark, ...nextRemarks]
        }

        const currentActivities = prev.Ok.rcm?.flattened?.activity || []
        const nextActivities = currentActivities.map((row: any) => {
          const authId = Number(row.order_authorization_id)
          if (!authId) return row
          const action = rowActions[authId]
          return action ? applyRowAction(row, action) : row
        })

        return {
          ...prev,
          Ok: {
            ...prev.Ok,
            rcm: {
              ...prev.Ok.rcm,
              flattened: {
                ...prev.Ok.rcm.flattened,
                remarks: nextRemarks,
                activity: nextActivities
              }
            }
          }
        }
      })
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        showToast({
          id: toastId,
          title: 'Save Timed Out',
          message: 'RA remarks save timed out. Please try again.',
          tone: 'error',
          duration: 6000
        })
        showSystemNotification(
          'RA Remarks save timed out',
          'The server did not finish saving RA remarks. Please try again.'
        )
      } else {
        showToast({
          id: toastId,
          title: 'Save Failed',
          message: `Failed to save RA remarks: ${err.message}`,
          tone: 'error',
          duration: 6000
        })
      }
      void ensureNotificationPermission()
      showSystemNotification('RA Remarks save failed', 'RA remarks may need to be saved again.')
    } finally {
      setIsSavingRaRemarks(false)
    }
  }

  const handleSaveWriteOffRemarks = async () => {
    const toastId = 'ra-action'
    if (!encounterInput.trim()) return showToast('No active encounter loaded.', 'error')

    const rcm = rcmResult?.Ok?.rcm
    const activityRows = rcm?.flattened?.activity || []

    const eligibleRows = activityRows.filter((row: any) => {
      if (Number(row.ra_payer || 0) < 0 || Number(row.ra_patient || 0) < 0) return false
      if (Number(row.pending_for_write_off || 0) === 2 || Number(row.maked_for_write_off || 0) === 2) return false
      const isEligibleAuth = Number(row.claim_auth_status) === 2 || Number(row.claim_is_partial_activity) === 1
      const hasRejection = Number(row.total_rej_amount || 0) > 0
      const hasDenialCode = String(row.claim_denial_code || '').trim() !== ''
      return isEligibleAuth && (hasRejection || hasDenialCode)
    })

    const eligibleIds = new Set(eligibleRows.map((row: any) => Number(row.order_authorization_id)))

    const writeOffRows = activityRows.filter((row: any) => {
      const authId = Number(row.order_authorization_id)
      if (!authId || !eligibleIds.has(authId)) return false
      const action = rowActions[authId]
      return (
        action === 'w-off' ||
        (action as any) === 'written-off' ||
        Number(row.pending_for_write_off || 0) === 1 ||
        Number(row.maked_for_write_off || 0) === 1
      )
    })

    const totalEligibleCount = eligibleRows.length
    const totalWriteOffCount = writeOffRows.length

    if (totalWriteOffCount === 0) {
      return showToast({
        id: toastId,
        title: 'Write-off Error',
        message: 'No activities are set to write-off status.',
        tone: 'error',
        duration: 5000
      })
    }

    const isFullWriteOff = totalWriteOffCount === totalEligibleCount

    if (isFullWriteOff) {
      if (!writeOffRemarks.trim()) {
        return showToast({
          id: toastId,
          title: 'Remarks Required',
          message: 'Write-off remarks are mandatory when writing off all activities.',
          tone: 'error',
          duration: 5000
        })
      }
    } else {
      const hasRaRemarkSaved = (rcm?.flattened?.remarks || []).some((r: any) => Number(r.status_id) === 1)
      if (!hasRaRemarkSaved) {
        return showToast({
          id: toastId,
          title: 'Save Remarks First',
          message: 'Please save RA remarks first to set partial activities to written off.',
          tone: 'error',
          duration: 5000
        })
      }
    }

    setIsSavingWriteOff(true)
    showToast({
      id: toastId,
      title: 'Financial Write-off',
      message: 'Processing write-off in dual-layer cache & ledger...',
      tone: 'loading'
    })

    const payload = {
      encounter: encounterInput.trim(),
      body: {
        remarks: writeOffRemarks.trim(),
        rowActions,
        doubleAccumulationMode
      }
    }

    try {
      const response = await fetch('/api/rcm/write-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)

      showToast({
        id: toastId,
        title: 'Write-off Processed',
        message: 'Write-off processed and posted successfully.',
        tone: 'ok',
        duration: 5000
      })
      setWriteOffRemarks('')

      isSavingInPlaceRef.current = true
      setRcmResult((prev: any) => {
        if (!prev || !prev.Ok) return prev

        const currentRemarks = prev.Ok.rcm?.flattened?.remarks || []
        const hasWriteOffRemark = currentRemarks.some((r: any) => Number(r.status_id) === 2)

        let nextRemarks = [...currentRemarks]
        if (hasWriteOffRemark) {
          nextRemarks = nextRemarks.map((r: any) => {
            if (Number(r.status_id) === 2) {
              return {
                ...r,
                remarks_ra: writeOffRemarks.trim(),
                remarks: writeOffRemarks.trim(),
                created_on: new Date().toISOString()
              }
            }
            return r
          })
        } else {
          const newRemark = {
            _encounter: encounterInput.trim(),
            status_id: 2,
            remarks_from: 'Write-Off Remarks',
            remarks_ra: writeOffRemarks.trim(),
            remarks: writeOffRemarks.trim(),
            created_by_name: 'Local Portal',
            created_on: new Date().toISOString()
          }
          nextRemarks = [newRemark, ...nextRemarks]
        }

        const currentActivities = prev.Ok.rcm?.flattened?.activity || []
        const nextActivities = currentActivities.map((row: any) => {
          const authId = Number(row.order_authorization_id)
          if (!authId || !eligibleIds.has(authId)) return row
          const action = rowActions[authId]
          if (
            action === 'w-off' ||
            Number(row.pending_for_write_off || 0) === 1 ||
            Number(row.maked_for_write_off || 0) === 1
          ) {
            return {
              ...row,
              maked_for_write_off: 2,
              pending_for_write_off: 2,
              isClosed: 1,
              marked_closed: 1
            }
          }
          return row
        })

        const nextRowActions = { ...rowActions }
        for (const key of Object.keys(nextRowActions)) {
          const authId = Number(key)
          if (nextRowActions[authId] === 'w-off') {
            nextRowActions[authId] = 'written-off' as any
          }
        }
        setTimeout(() => setRowActions(nextRowActions), 0)

        return {
          ...prev,
          Ok: {
            ...prev.Ok,
            rcm: {
              ...prev.Ok.rcm,
              flattened: {
                ...prev.Ok.rcm.flattened,
                remarks: nextRemarks,
                activity: nextActivities
              }
            }
          }
        }
      })
    } catch (err: any) {
      showToast({
        id: toastId,
        title: 'Write-off Failed',
        message: `Failed to process write-off: ${err.message}`,
        tone: 'error',
        duration: 6000
      })
    } finally {
      setIsSavingWriteOff(false)
    }
  }

  const exportHtml = () => {
    if (!summaryResult?.Ok) return showToast('Summary not loaded.', 'error')
    const encName = safeFileName(summaryResult.Ok.encounterInput || encounterInput)
    const htmlStr = `<!doctype html><html><head><meta charset="utf-8"><title>${encName}</title></head><body>${summaryResult.Ok.summaryHtml}</body></html>`
    openBlobUrl(new Blob([htmlStr], { type: 'text/html;charset=utf-8' }), `${encName}-summary.html`)
  }

  const exportPdf = async () => {
    if (!summaryResult?.Ok) return showToast('Summary not loaded.', 'error')
    const encName = safeFileName(summaryResult.Ok.encounterInput || encounterInput)
    try {
      const selected = summaryResult.Ok.selected
      const patientId = selected?.patient_id
      const encounterId = selected?.encounterid
      const siteId = selected?._site_id

      const summaryPdfUrl = summaryResult.Ok.pdfs?.summaryPdf || ''
      const createdByMatch = summaryPdfUrl.match(/createdby\/(\d+)/)
      const createdBy = createdByMatch ? createdByMatch[1] : '0'

      const downloadUrl = `/download/summary/symfony?patientId=${patientId}&siteId=${siteId}&encounterId=${encounterId}&createdBy=${createdBy}`

      await openPdfInExtension(downloadUrl, `${encName}-summary`, false, showToast)
    } catch (e: any) {
      showToast(e.message, 'error')
    }
  }

  const exportXml = async () => {
    const activeEncounter =
      rcmResult?.Ok?.rcm?.query?.encounter || summaryResult?.Ok?.encounterInput || encounterInput.trim()
    const toastId = 'resubmission'
    if (!activeEncounter) {
      showToast({
        id: toastId,
        title: 'Export Warning',
        message: 'Please load an encounter first.',
        tone: 'warning',
        duration: 4000
      })
      return
    }

    showToast({
      id: toastId,
      title: 'Claim XML',
      message: 'Fetching fresh claim XML payload...',
      tone: 'loading'
    })
    try {
      const response = await fetch('/api/rcm/generate-claim-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounter: activeEncounter })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      const xmlContent = data.xml
      if (!xmlContent) {
        throw new Error('No XML payload was returned from the server.')
      }

      const sText = xmlContent.replace(/\r?\n/g, '\r\n')
      const d = new Date()
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      const ss = String(d.getSeconds()).padStart(2, '0')
      const timeString = `${yyyy}${mm}${dd}${hh}${min}${ss}`
      const safeEncounter = activeEncounter.replace(/\//g, '-')
      const fileName = `${safeEncounter}_${timeString}.xml`

      const blob = new Blob([sText], { type: 'application/xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast({
        id: toastId,
        title: 'Claim XML Fetched',
        message: `XML file ${fileName} downloaded successfully.`,
        tone: 'ok',
        duration: 5000
      })
    } catch (e: any) {
      showToast({
        id: toastId,
        title: 'XML Fetch Failed',
        message: `Failed to download XML: ${e.message}`,
        tone: 'error',
        duration: 6000
      })
    }
  }

  const processFile = (file: File) => {
    const toastId = 'resubmission'
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast({
        id: toastId,
        title: 'Attachment Failed',
        message: 'Please upload a PDF file only.',
        tone: 'error',
        duration: 5000
      })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      setAttachedFileBase64(base64)
      setAttachedFileName(file.name)
      showToast({
        id: toastId,
        title: 'File Attached',
        message: `Successfully attached local file: ${file.name}`,
        tone: 'ok',
        duration: 4000
      })
      uploadFileToServer(file.name, base64)
    }
    reader.onerror = () =>
      showToast({
        id: toastId,
        title: 'Read Failed',
        message: 'Failed to read local attachment file.',
        tone: 'error',
        duration: 5000
      })
    reader.readAsDataURL(file)
  }

  return {
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
  }
}
