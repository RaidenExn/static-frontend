import React, { useState, useEffect } from 'react'
import {
  Card,
  Text,
  Button,
  Progress,
  Stack,
  Box,
  Group,
  SegmentedControl,
  Switch,
  Badge,
  Table,
  Alert,
  Loader
} from '@mantine/core'
import { Repeat, UploadCloud, FileSpreadsheet, Play, Check, RefreshCw, X, Info } from 'lucide-react'
import { customFetch as fetch } from '../config/backend'

interface BulkRepeatTrackerExtractionProps {
  active: boolean
  showToast: (msg: string, type: 'ok' | 'error' | 'warning' | 'info' | 'loading') => void
  repeatTrackerLookbackYears: number
  setRepeatTrackerLookbackYears: (val: number) => void
}

interface JobStatus {
  jobId: string
  status: string
  total: number
  processed: number
  error: string | null
}

export default function BulkRepeatTrackerExtraction({
  active,
  showToast,
  repeatTrackerLookbackYears,
  setRepeatTrackerLookbackYears
}: BulkRepeatTrackerExtractionProps) {
  const [extractIcdCodes, setExtractIcdCodes] = useState<boolean>(true)
  const [dragOver, setDragOver] = useState(false)
  const [activeJob, setActiveJob] = useState<JobStatus | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file')
  const [pastedRows, setPastedRows] = useState<any[] | null>(null)

  // Status poller
  useEffect(() => {
    if (!activeJob || activeJob.status !== 'processing') return

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/repeat-tracker-extraction/status?jobId=${activeJob.jobId}`)
        if (!res.ok) throw new Error(`HTTP error ${res.status}`)
        const data = await res.json()

        setActiveJob({
          jobId: data.jobId,
          status: data.status,
          total: data.total,
          processed: data.processed,
          error: data.error
        })

        if (data.status === 'completed') {
          showToast('Bulk Repeat Tracker extraction completed successfully!', 'ok')
        } else if (data.status === 'failed') {
          showToast(`Extraction failed: ${data.error || 'Unknown error'}`, 'error')
        }
      } catch (err: any) {
        console.error('Poller error:', err)
      }
    }

    const interval = setInterval(pollStatus, 1000)
    return () => clearInterval(interval)
  }, [activeJob, showToast])

  // Smart TSV parse helper
  const parseAndSetPastedText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      showToast('No readable text copied from spreadsheet.', 'error')
      return
    }

    const parsedRows = lines.map((line) => line.split('\t').map((c) => c.trim()))

    let colIdIdx = -1
    let colStartIdx = -1
    let colCodeIdx = -1

    const firstRow = parsedRows[0]
    if (firstRow) {
      // Pass 1: Exact matches first
      firstRow.forEach((cell, idx) => {
        const val = cell.toLowerCase()
        if (
          val === 'id' ||
          val === 'encounter' ||
          val === 'encounter id' ||
          val === 'encounter_id' ||
          val === 'encounterid'
        ) {
          colIdIdx = idx
        } else if (
          val === 'start' ||
          val === 'start date' ||
          val === 'start_date' ||
          val === 'startdate' ||
          val === 'encounter start' ||
          val === 'encounter start date'
        ) {
          colStartIdx = idx
        } else if (
          val === 'code' ||
          val === 'cpt' ||
          val === 'cpt code' ||
          val === 'cpt_code' ||
          val === 'activity code' ||
          val === 'service code'
        ) {
          colCodeIdx = idx
        }
      })

      // Pass 2: Fallback to partial matches for any missing columns with exclusions
      firstRow.forEach((cell, idx) => {
        const val = cell.toLowerCase()

        if (colIdIdx === -1) {
          const isExcludedId =
            val.includes('payer') ||
            val.includes('provider') ||
            val.includes('facility') ||
            val.includes('reference') ||
            val.includes('sender') ||
            val.includes('receiver') ||
            val === 'id2'
          if (!isExcludedId && (val.includes('encounter') || val.startsWith('enc') || val === 'id')) {
            colIdIdx = idx
          }
        }

        if (colStartIdx === -1) {
          const isExcludedDate =
            val.includes('settlement') ||
            val.includes('transaction') ||
            val.includes('creation') ||
            val.includes('invoice') ||
            val.includes('posting') ||
            val.includes('billing') ||
            val.includes('end')
          if (!isExcludedDate && (val.includes('start') || val.includes('visit') || val === 'date' || val === 'time')) {
            colStartIdx = idx
          }
        }

        if (colCodeIdx === -1) {
          if (val.includes('code') || val.includes('cpt') || val.includes('service')) {
            colCodeIdx = idx
          }
        }
      })
    }

    const hasHeaders = colIdIdx !== -1 || colStartIdx !== -1 || colCodeIdx !== -1
    const startIndex = hasHeaders ? 1 : 0

    if (colIdIdx === -1) colIdIdx = 0
    if (colStartIdx === -1) colStartIdx = 1
    if (colCodeIdx === -1) colCodeIdx = 2

    const rowsData: any[] = []
    for (let r = startIndex; r < parsedRows.length; r++) {
      const cols = parsedRows[r]
      const id = cols[colIdIdx] || ''
      const start = cols[colStartIdx] || ''
      const code = cols[colCodeIdx] || ''

      if (id) {
        rowsData.push({ id, start, code })
      }
    }

    if (rowsData.length === 0) {
      showToast('Could not extract any valid records. Check columns order (ID, Start, Code).', 'error')
      return
    }

    setPastedRows(rowsData)
    showToast(`Successfully parsed ${rowsData.length} records! Check the preview below.`, 'ok')
  }

  // Handle global paste event when active and in paste mode
  useEffect(() => {
    if (!active || uploadMode !== 'paste') return

    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }
      const text = e.clipboardData?.getData('text/plain')
      if (text) {
        parseAndSetPastedText(text)
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [active, uploadMode])

  const processFileBuffer = async (file: File) => {
    setIsUploading(true)
    showToast(`Uploading and analyzing ${file.name}...`, 'loading')

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1]
        try {
          const res = await fetch('/api/repeat-tracker-extraction/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64,
              lookbackYears: repeatTrackerLookbackYears,
              extractIcdCodes
            })
          })

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData.message || `HTTP ${res.status}`)
          }

          const data = await res.json()
          setActiveJob({
            jobId: data.jobId,
            status: 'processing',
            total: 0,
            processed: 0,
            error: null
          })
          showToast('Bulk Repeat Tracker extraction job registered successfully. Processing...', 'info')
        } catch (err: any) {
          showToast(`Failed to start job: ${err.message}`, 'error')
        } finally {
          setIsUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (e: any) {
      showToast(`File reading error: ${e.message}`, 'error')
      setIsUploading(false)
    }
  }

  const handleStartPastedExtraction = async () => {
    if (!pastedRows || pastedRows.length === 0) return
    setIsUploading(true)
    showToast(`Initiating background extraction for ${pastedRows.length} pasted records...`, 'loading')

    try {
      const res = await fetch('/api/repeat-tracker-extraction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastedRows,
          lookbackYears: repeatTrackerLookbackYears,
          extractIcdCodes
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setActiveJob({
        jobId: data.jobId,
        status: 'processing',
        total: 0,
        processed: 0,
        error: null
      })
      showToast('Bulk Repeat Tracker extraction job for pasted records started successfully!', 'ok')
    } catch (err: any) {
      showToast(`Failed to initiate paste job: ${err.message}`, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileBuffer(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileBuffer(e.target.files[0])
    }
  }

  const handleDownload = () => {
    if (!activeJob || activeJob.status !== 'completed') return
    window.location.href = `/api/repeat-tracker-extraction/download?jobId=${activeJob.jobId}`
    showToast('Spreadsheet download initiated.', 'ok')
  }

  const handleReset = () => {
    setActiveJob(null)
    setPastedRows(null)
  }

  const completionPercent =
    activeJob && activeJob.total > 0 ? Math.min(100, Math.round((activeJob.processed / activeJob.total) * 100)) : 0

  if (!active) return null

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        {/* Header Block */}
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Repeat size={20} color="var(--mantine-color-indigo-filled)" />
            <Text fw={700} size="sm" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Bulk Repeat Tracker Extraction
            </Text>
          </Group>
          {activeJob && (
            <Badge
              size="sm"
              variant="filled"
              color={activeJob.status === 'completed' ? 'green' : activeJob.status === 'failed' ? 'red' : 'blue'}
            >
              {activeJob.status}
            </Badge>
          )}
        </Group>

        <Group
          gap="xs"
          wrap="nowrap"
          align="flex-start"
          style={{
            backgroundColor: 'var(--panel-soft, rgba(255,255,255,0.02))',
            padding: '10px',
            borderRadius: 'var(--mantine-radius-sm)'
          }}
        >
          <Info size={16} style={{ marginTop: '2px', color: 'var(--muted)' }} />
          <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
            Upload an Excel template or paste spreadsheet rows to automatically evaluate repeat tracker rules across
            lookback periods, checking for previous occurrences dynamically.
          </Text>
        </Group>

        {!activeJob ? (
          <Stack gap="md">
            {/* Options configuration */}
            <Group
              grow
              align="center"
              gap="md"
              style={{ border: '1px solid var(--line)', padding: '12px', borderRadius: 'var(--mantine-radius-sm)' }}
            >
              <Box style={{ minWidth: '180px' }}>
                <Text size="xs" fw={700} c="dimmed" mb={4} style={{ textTransform: 'uppercase' }}>
                  Lookback Period
                </Text>
                <SegmentedControl
                  value={String(repeatTrackerLookbackYears)}
                  onChange={(val) => setRepeatTrackerLookbackYears(Number(val))}
                  data={[
                    { label: '1 Year', value: '1' },
                    { label: '2 Years', value: '2' },
                    { label: '3 Years', value: '3' }
                  ]}
                  size="xs"
                />
              </Box>

              <Box style={{ flex: 1 }}>
                <Text size="xs" fw={700} c="dimmed" mb={4} style={{ textTransform: 'uppercase' }}>
                  Diagnoses Codes
                </Text>
                <Switch
                  label="Extract ICD Diagnoses Codes"
                  checked={extractIcdCodes}
                  onChange={(event) => setExtractIcdCodes(event.currentTarget.checked)}
                  size="xs"
                />
              </Box>
            </Group>

            {/* Mode Selector */}
            <SegmentedControl
              value={uploadMode}
              onChange={(val) => {
                setUploadMode(val as any)
                setPastedRows(null)
              }}
              data={[
                { label: '📁 Upload Excel File (.xlsx)', value: 'file' },
                { label: '📋 Paste Spreadsheet Cells', value: 'paste' }
              ]}
              size="xs"
              fullWidth
            />

            {/* File Mode */}
            {uploadMode === 'file' && (
              <Box
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('repeatTrackerFileUploader')?.click()}
                style={{
                  border: `1.5px dashed ${dragOver ? 'var(--mantine-color-blue-filled)' : 'var(--line)'}`,
                  borderRadius: 'var(--mantine-radius-sm)',
                  padding: '30px 15px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--panel-soft, rgba(255,255,255,0.01))',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  id="repeatTrackerFileUploader"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <UploadCloud size={32} style={{ margin: '0 auto 8px', color: 'var(--muted)' }} />
                <Text size="sm" fw={600}>
                  {isUploading ? 'Preparing upload...' : 'Drag & drop Excel template file here'}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  or click to select file from folder (supports .xlsx formulas)
                </Text>
              </Box>
            )}

            {/* Paste Mode */}
            {uploadMode === 'paste' && (
              <Stack gap="sm">
                {!pastedRows ? (
                  <Box
                    tabIndex={0}
                    onPaste={(e) => {
                      const text = e.clipboardData?.getData('text/plain')
                      if (text) parseAndSetPastedText(text)
                    }}
                    style={{
                      border: '1.5px dashed var(--line)',
                      borderRadius: 'var(--mantine-radius-sm)',
                      padding: '30px 15px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      outline: 'none',
                      backgroundColor: 'var(--panel-soft, rgba(255,255,255,0.01))'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--mantine-color-blue-filled)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--line)'
                    }}
                  >
                    <UploadCloud size={32} style={{ margin: '0 auto 8px', color: 'var(--muted)' }} />
                    <Text size="sm" fw={600}>
                      Click here & press Cmd+V / Ctrl+V to paste cells
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Copy CPT columns (Encounter ID, Start Date, Code) and paste them directly
                    </Text>
                  </Box>
                ) : (
                  <Stack
                    gap="xs"
                    style={{
                      border: '1px solid var(--line)',
                      padding: '12px',
                      borderRadius: 'var(--mantine-radius-sm)'
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Text size="xs" fw={700} style={{ textTransform: 'uppercase' }}>
                        Preview ({pastedRows.length} Records)
                      </Text>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          leftSection={<Play size={12} />}
                          onClick={handleStartPastedExtraction}
                          loading={isUploading}
                        >
                          Start Extraction
                        </Button>
                        <Button size="xs" variant="default" onClick={() => setPastedRows(null)}>
                          Clear
                        </Button>
                      </Group>
                    </Group>

                    <Box style={{ overflowX: 'auto', maxHeight: '180px' }}>
                      <Table highlightOnHover verticalSpacing={2} horizontalSpacing="xs" style={{ fontSize: '10.5px' }}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ padding: '2px 4px' }}>ID / Encounter</Table.Th>
                            <Table.Th style={{ padding: '2px 4px' }}>Start Date</Table.Th>
                            <Table.Th style={{ padding: '2px 4px' }}>Target Code</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {pastedRows.slice(0, 5).map((row, idx) => (
                            <Table.Tr key={idx}>
                              <Table.Td style={{ padding: '2px 4px', fontWeight: 600 }}>{row.id}</Table.Td>
                              <Table.Td style={{ padding: '2px 4px', color: 'var(--muted)' }}>{row.start}</Table.Td>
                              <Table.Td
                                style={{
                                  padding: '2px 4px',
                                  fontFamily: 'var(--mantine-font-family-monospace)',
                                  color: 'var(--mantine-color-blue-filled)'
                                }}
                              >
                                {row.code}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Box>
                    {pastedRows.length > 5 && (
                      <Text size="xs" c="dimmed" ta="center">
                        Showing first 5 of {pastedRows.length} records.
                      </Text>
                    )}
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        ) : (
          /* Running Job Progress Card */
          <Stack gap="md" align="center" style={{ padding: '16px 0' }}>
            {activeJob.status === 'processing' && (
              <>
                <Loader size="md" color="indigo" />
                <Stack gap={2} align="center">
                  <Text size="sm" fw={700}>
                    Extracting & Cross-Verifying...
                  </Text>
                  <Text size="xs" c="dimmed">
                    Processed {activeJob.processed} of {activeJob.total > 0 ? activeJob.total : 'checking...'} records
                  </Text>
                </Stack>
                <Progress
                  value={completionPercent}
                  size="xs"
                  color="indigo"
                  animated
                  style={{ width: '100%', maxWidth: '280px' }}
                />
                <Text size="xs" fw={700} c="indigo">
                  {completionPercent}% Completed
                </Text>
              </>
            )}

            {activeJob.status === 'completed' && (
              <>
                <Check size={36} color="var(--mantine-color-green-filled)" />
                <Stack gap={2} align="center">
                  <Text size="sm" fw={700}>
                    Extraction Completed Successfully!
                  </Text>
                  <Text size="xs" c="dimmed">
                    Processed all {activeJob.total} records cleanly.
                  </Text>
                </Stack>
                <Group gap="sm" mt="xs">
                  <Button size="xs" onClick={handleDownload} leftSection={<FileSpreadsheet size={14} />}>
                    Download Enriched Excel
                  </Button>
                  <Button size="xs" variant="default" onClick={handleReset}>
                    Upload Another
                  </Button>
                </Group>
              </>
            )}

            {activeJob.status === 'failed' && (
              <>
                <X size={36} color="var(--mantine-color-red-filled)" />
                <Stack gap={2} align="center">
                  <Text size="sm" fw={700}>
                    Compilation Failed
                  </Text>
                  <Text size="xs" c="red">
                    {activeJob.error || 'Server encountered an unexpected extraction failure.'}
                  </Text>
                </Stack>
                <Button size="xs" variant="default" onClick={handleReset} leftSection={<RefreshCw size={12} />} mt="xs">
                  Try Again
                </Button>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
