import { useState, useEffect, useRef } from 'react'
import { customFetch as fetch } from '../../../config/backend'

export interface RowData {
  id: string
  encounterNumber: string
  deniedCode: string
  billedAmount: number
  deniedAmount: number
  previousComments: string
  resubmissionComment: string
  raComment: string
  reconciliationType: string
  action: string
  status?: 'pending' | 'success' | 'failed' | 'processing'
  errorMessage?: string
  processedAt?: string
}

export interface ParseError {
  row: number
  encounterNumber: string
  issues: string[]
}

interface ProgressState {
  status: string
  total_rows: number
  processed_rows: number
  success_count: number
  failure_count: number
}

interface ExportProgress {
  total: number
  processed: number
  status: string
}

export function useBulkResubmission(
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [inputText, setInputText] = useState('')
  const [encounters, setEncounters] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [collectFromStorage, setCollectFromStorage] = useState(true)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [isExportProgressModalOpen, setIsExportProgressModalOpen] = useState(false)

  // Job and processing states
  const [jobId, setJobId] = useState<string | null>(null)
  const [rows, setRows] = useState<RowData[]>([])
  const [errors, setErrors] = useState<ParseError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Progress states
  const [progress, setProgress] = useState<ProgressState>({
    status: 'pending',
    total_rows: 0,
    processed_rows: 0,
    success_count: 0,
    failure_count: 0
  })

  const [processLogs, setProcessLogs] = useState<string[]>([])
  const logTerminalEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Parse direct paste text to list of encounters (filtering duplicates)
  useEffect(() => {
    const list = inputText
      .split('\n')
      .map((line) => line.trim().toUpperCase())
      .filter((line) => line.length > 0)
    const uniqueList = Array.from(new Set(list))
    setEncounters(uniqueList)
  }, [inputText])

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (logTerminalEndRef.current) {
      logTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [processLogs])

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  // Step 1: Export template CSV file (Async with progress tracking)
  const handleExportTemplate = async () => {
    if (encounters.length === 0) {
      showToast('Please enter at least one encounter number.', 'warning')
      return
    }

    setIsExporting(true)
    setExportProgress({ total: encounters.length, processed: 0, status: 'processing' })
    setIsExportProgressModalOpen(true)

    try {
      const response = await fetch('/api/bulk-resubmission/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterNumbers: encounters, mode: collectFromStorage ? 'cache-first' : 'force' })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to initiate export job')
      }

      const initData = await response.json()
      const jobId = initData.jobId

      // Start status polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/bulk-resubmission/export-status?jobId=${jobId}`)
          if (!statusRes.ok) throw new Error('Failed to fetch export status')
          const statusData = await statusRes.json()

          setExportProgress({
            total: statusData.total,
            processed: statusData.processed,
            status: statusData.status
          })

          if (statusData.status === 'completed') {
            clearInterval(pollInterval)

            // Trigger file download
            const downloadUrl = `/api/bulk-resubmission/export-download?jobId=${jobId}`
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = `Bulk_Resubmission_Template_${new Date().toISOString().slice(0, 10)}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

            showToast('CSV Template generated and downloaded successfully.', 'success')
            setTimeout(() => {
              setIsExportProgressModalOpen(false)
              setExportProgress(null)
              setIsExporting(false)
            }, 1000)
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval)
            showToast(statusData.error || 'Export generation failed', 'error')
            setIsExportProgressModalOpen(false)
            setExportProgress(null)
            setIsExporting(false)
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval)
          console.error(pollErr)
          showToast(pollErr.message || 'Error tracking progress', 'error')
          setIsExportProgressModalOpen(false)
          setExportProgress(null)
          setIsExporting(false)
        }
      }, 500)
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'Error initiating template generation', 'error')
      setIsExportProgressModalOpen(false)
      setExportProgress(null)
      setIsExporting(false)
    }
  }

  // Step 1: Force all encounters directly to Resubmission Mode (no comments/remarks)
  const handleForceResubmit = async () => {
    if (encounters.length === 0) {
      showToast('Please enter at least one encounter number.', 'warning')
      return
    }

    setIsProcessing(true)
    setProcessLogs([`[${new Date().toLocaleTimeString()}] Initiating Force Set to Resubmission Mode...`])
    setStep(3)

    try {
      const response = await fetch('/api/bulk-resubmission/force-resubmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterNumbers: encounters })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to initiate force resubmission job')
      }

      const initData = await response.json()
      const jobId = initData.jobId
      setJobId(jobId)
      setRows(initData.rows || [])
      setErrors([])

      // Process the job
      const processRes = await fetch('/api/bulk-resubmission/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })

      if (!processRes.ok) {
        const errData = await processRes.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to trigger processing')
      }

      showToast('Force resubmission background job started.', 'info')
      startSseStream(jobId)
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'Error starting force resubmission', 'error')
      setIsProcessing(false)
      setStep(1)
    }
  }

  // Step 1: Handle CSV upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setProcessLogs([])
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer
          const bytes = new Uint8Array(arrayBuffer)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          const base64String = btoa(binary)

          const response = await fetch('/api/bulk-resubmission/import-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileData: base64String })
          })

          const result = await response.json()
          if (!response.ok) {
            throw new Error(result.message || 'Failed to parse CSV file')
          }

          if (result.success) {
            setJobId(result.jobId)
            setRows(result.rows)
            setErrors(result.errors || [])
            setStep(2)
            showToast(`Parsed ${result.rows.length} rows successfully. Please review the preview.`, 'success')
          } else {
            setErrors(result.errors || [])
            setRows([])
            showToast(result.message || 'No valid rows found in CSV.', 'error')
          }
        } catch (innerErr: any) {
          showToast(innerErr.message || 'Error processing parsed file data', 'error')
        } finally {
          setIsUploading(false)
        }
      }

      reader.onerror = () => {
        showToast('Error reading the local file.', 'error')
        setIsUploading(false)
      }

      reader.readAsArrayBuffer(file)
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'Error uploading file', 'error')
      setIsUploading(false)
    }
  }

  // Step 2: Trigger processing execution
  const handleStartProcessing = async () => {
    if (!jobId) return

    setIsProcessing(true)
    setStep(3)
    setProcessLogs([`[${new Date().toLocaleTimeString()}] Initiating bulk job sequential run...`])

    try {
      const response = await fetch('/api/bulk-resubmission/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'Failed to trigger processing')
      }

      showToast('Bulk process queue worker started.', 'info')
      startSseStream(jobId)
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'Error starting processing', 'error')
      setIsProcessing(false)
    }
  }

  // Step 3: SSE Streaming updates
  const startSseStream = (id: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(`/api/bulk-resubmission/progress?jobId=${id}`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.error) {
          setProcessLogs((prev) => [...prev, `[ERROR] ${data.error}`])
          es.close()
          setIsProcessing(false)
          return
        }

        const { job, rows: updatedRows } = data
        setRows(updatedRows)
        setProgress({
          status: job.status,
          total_rows: job.total_rows,
          processed_rows: job.processed_rows,
          success_count: job.success_count,
          failure_count: job.failure_count
        })

        // Add progress logs for newly processed rows
        const currentProcessed = updatedRows.filter((r: RowData) => r.status !== 'pending')
        const latestRow = currentProcessed[currentProcessed.length - 1]
        if (latestRow) {
          const timestamp = latestRow.processedAt
            ? new Date(latestRow.processedAt).toLocaleTimeString()
            : new Date().toLocaleTimeString()
          const logMsg = `[${timestamp}] Encounter ${latestRow.encounterNumber}: ${latestRow.status.toUpperCase()}${
            latestRow.errorMessage ? ` - Error: ${latestRow.errorMessage}` : ''
          }`
          setProcessLogs((prev) => {
            if (
              prev.includes(logMsg) ||
              (prev.length > 0 && prev[prev.length - 1].includes(latestRow.encounterNumber))
            ) {
              return prev
            }
            return [...prev, logMsg]
          })
        }

        if (job.status === 'completed' || job.status === 'failed') {
          const statusText = job.status === 'completed' ? 'COMPLETED SUCCESSFULLY' : 'FAILED'
          setProcessLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] JOB ${statusText}. Total: ${job.total_rows}, Success: ${job.success_count}, Failed: ${job.failure_count}`
          ])
          es.close()
          setIsProcessing(false)
          showToast(
            `Bulk resubmission job finished with status: ${job.status}`,
            job.status === 'completed' ? 'success' : 'error'
          )
        }
      } catch (err) {
        console.error('Error parsing SSE packet:', err)
      }
    }

    es.onerror = () => {
      console.error('SSE Error, reconnecting or closing')
    }
  }

  const resetState = () => {
    setStep(1)
    setInputText('')
    setRows([])
    setErrors([])
  }

  return {
    step,
    setStep,
    inputText,
    setInputText,
    encounters,
    isExporting,
    isUploading,
    collectFromStorage,
    setCollectFromStorage,
    exportProgress,
    isExportProgressModalOpen,
    setIsExportProgressModalOpen,
    jobId,
    rows,
    errors,
    isProcessing,
    progress,
    processLogs,
    logTerminalEndRef,
    handleExportTemplate,
    handleForceResubmit,
    handleFileUpload,
    handleStartProcessing,
    resetState
  }
}
