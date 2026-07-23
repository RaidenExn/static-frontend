import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Group,
  Stack,
  Text,
  Button,
  Progress,
  Box,
  SimpleGrid,
  Badge,
  List,
  ThemeIcon,
  ScrollArea,
  Divider,
  FileInput,
  Switch
} from '@mantine/core'
import {
  FileSpreadsheet,
  Upload,
  X,
  Play,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  StopCircle,
  Clock,
  Terminal,
  FileCheck
} from 'lucide-react'
import { customFetch as fetch } from '../config/backend'

interface ExcelWorkshopPanelProps {
  active: boolean
  showToast: (msg: any, type?: any) => void
}

interface FileItem {
  id: string
  file: File
  name: string
  size: number
}

interface WorkshopJob {
  id: string
  status: 'idle' | 'analyzing' | 'fetching_history' | 'coloring' | 'completed' | 'failed' | 'cancelled'
  progress: number
  files: { originalName: string; size: number; tempPath: string }[]
  logs: string[]
  summary?: {
    filesProcessed: number
    rejectedEncountersFound: number
    encountersUpdated: number
    filesWithNoRejections: number
    skips: string[]
    totalEncounters: number
  }
  error?: string
  outputZipPath?: string
  outputFiles?: { originalName: string; processedPath: string }[]
}

export default function ExcelWorkshopPanel({ active, showToast }: ExcelWorkshopPanelProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobState, setJobState] = useState<WorkshopJob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [pullFromCache, setPullFromCache] = useState(true)
  const [showResubmissionComments, setShowResubmissionComments] = useState(true)
  const [hideColumns, setHideColumns] = useState(true)

  const pollingRef = useRef<any>(null)
  const logViewportRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of logs on new logs addition
  useEffect(() => {
    if (logViewportRef.current) {
      logViewportRef.current.scrollTop = logViewportRef.current.scrollHeight
    }
  }, [jobState?.logs])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  if (!active) return null

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileChange = (newFiles: File[] | null) => {
    if (!newFiles) return
    const formatted = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size
    }))
    setFiles((prev) => [...prev, ...formatted])
    setJobId(null)
    setJobState(null)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setJobId(null)
    setJobState(null)
  }

  const clearQueue = () => {
    setFiles([])
    setJobId(null)
    setJobState(null)
  }

  const startJob = async () => {
    if (files.length === 0) {
      showToast('Please upload or select at least one Excel workbook first.', 'warning')
      return
    }

    setUploading(true)
    setProcessing(true)
    setJobId(null)
    setJobState(null)
    showToast('Uploading workbooks to the secure processing pipeline...', 'loading')

    try {
      const formData = new FormData()
      files.forEach((f) => {
        formData.append('files', f.file)
      })

      // Step A: Upload Files
      const uploadRes = await fetch('/api/excel-workshop/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed: ${uploadRes.status}`)
      }

      const createdJob: WorkshopJob = await uploadRes.json()
      const registeredJobId = createdJob.id
      setJobId(registeredJobId)
      setJobState(createdJob)

      // Step B: Trigger background pipeline execution
      const startRes = await fetch(
        `/api/excel-workshop/process?jobId=${registeredJobId}&mode=${pullFromCache ? 'cache-first' : 'force'}&showResubmissionComments=${showResubmissionComments}&hideColumns=${hideColumns}`,
        {
          method: 'POST'
        }
      )

      if (!startRes.ok) {
        const startError = await startRes.json().catch(() => ({}))
        throw new Error(startError.message || `Process trigger failed: ${startRes.status}`)
      }

      showToast({
        id: 'global-loading-toast',
        message: 'Spreadsheet extraction started. Monitoring progress...',
        tone: 'info'
      })
      setUploading(false)

      // Step C: Start Polling the progress status
      pollingRef.current = setInterval(() => {
        pollJobStatus(registeredJobId)
      }, 800)
    } catch (err: any) {
      setUploading(false)
      setProcessing(false)
      showToast({
        id: 'global-loading-toast',
        message: err.message || 'Excel processing failed to initiate.',
        tone: 'error'
      })
    }
  }

  const pollJobStatus = async (targetJobId: string) => {
    try {
      const res = await fetch(`/api/excel-workshop/status?jobId=${targetJobId}`)
      if (!res.ok) throw new Error(`Status check failed: ${res.status}`)

      const job: WorkshopJob = await res.json()
      setJobState(job)

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setProcessing(false)

        if (job.status === 'completed') {
          showToast('Spreadsheets processed and highlighted successfully!', 'ok')
        } else if (job.status === 'failed') {
          showToast(job.error || 'Excel processing job failed.', 'error')
        } else if (job.status === 'cancelled') {
          showToast('Job execution cancelled.', 'warning')
        }
      }
    } catch (err: any) {
      console.error('[Workshop UI] Error polling status:', err)
    }
  }

  const cancelJob = async () => {
    if (!jobId) return

    showToast('Stopping pipeline and cleaning files...', 'loading')
    try {
      const res = await fetch(`/api/excel-workshop/cancel?jobId=${jobId}`, {
        method: 'POST'
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Cancellation request rejected.')
      }

      showToast('Excel processing job cancelled.', 'warning')
    } catch (err: any) {
      showToast(err.message || 'Cancellation failed.', 'error')
    }
  }

  // Get active color badge for job phase
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'idle':
        return <Badge color="gray">Idle</Badge>
      case 'analyzing':
        return (
          <Badge color="blue" variant="filled">
            Analyzing Columns
          </Badge>
        )
      case 'fetching_history':
        return (
          <Badge color="indigo" variant="filled">
            EHR Claim Histories
          </Badge>
        )
      case 'coloring':
        return (
          <Badge color="violet" variant="filled">
            Applying Highlights
          </Badge>
        )
      case 'completed':
        return (
          <Badge color="teal" variant="filled">
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge color="red" variant="filled">
            Failed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge color="orange" variant="filled">
            Cancelled
          </Badge>
        )
      default:
        return <Badge color="gray">{status}</Badge>
    }
  }

  return (
    <Box>
      {/* Upper Glassmorphic Description Card */}
      <Card
        withBorder
        mb="md"
        padding="md"
        style={{
          background: 'var(--bg-translucent, rgba(255, 255, 255, 0.45))',
          border: '1px solid var(--line)'
        }}
      >
        <Group justify="space-between" align="center">
          <Box>
            <Group gap="xs" align="center" mb={4}>
              <FileSpreadsheet size={20} color="var(--mantine-color-blue-filled)" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Clinical Excel Workshop Suite</h2>
            </Group>
            <Text size="xs" c="dimmed">
              Upload spreadsheets, clean formula caches, extract rejected encounter IDs, retrieve real-time RA counts
              from EHR, and apply coloring.
            </Text>
          </Box>
          {jobState && (
            <Group gap="xs">
              <Badge size="xs" variant="outline" color="blue" leftSection={<Clock size={10} />}>
                JOB: {jobState.id.substring(0, 8)}
              </Badge>
              {getStatusBadge(jobState.status)}
            </Group>
          )}
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" style={{ alignItems: 'stretch' }}>
        {/* LEFT COLUMN: Queue & Settings */}
        <Stack gap="md" style={{ height: '100%' }}>
          <Card withBorder style={{ flex: 1 }}>
            <Stack gap="sm" style={{ height: '100%' }}>
              <Text fw={700} size="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Files Upload & Queue
              </Text>

              <FileInput
                leftSection={<Upload size={16} />}
                placeholder="Choose Excel spread sheets (.xlsx)"
                accept=".xlsx"
                multiple
                value={[] as any}
                onChange={handleFileChange}
                disabled={processing || uploading}
              />

              {files.length > 0 && (
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group justify="space-between">
                    <Text size="xs" fw={600} c="dimmed">
                      QUEUE ({files.length} file(s)):
                    </Text>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={clearQueue}
                      disabled={processing || uploading}
                      leftSection={<Trash2 size={12} />}
                      style={{ height: '24px', padding: '0 8px' }}
                    >
                      Clear Queue
                    </Button>
                  </Group>

                  <ScrollArea style={{ height: '220px' }} type="auto">
                    <List spacing="xs" size="xs">
                      {files.map((f) => (
                        <List.Item
                          key={f.id}
                          icon={
                            <ThemeIcon color="teal" size={18} radius="xl">
                              <FileSpreadsheet size={12} />
                            </ThemeIcon>
                          }
                          style={{
                            padding: '6px 8px',
                            backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
                            borderRadius: 'var(--mantine-radius-sm)',
                            border: '1px solid var(--line)'
                          }}
                        >
                          <Group justify="space-between" align="center" style={{ width: '100%' }}>
                            <Box style={{ maxWidth: '70%' }}>
                              <Text fw={600} size="xs" truncate>
                                {f.name}
                              </Text>
                              <Text size="10px" c="dimmed">
                                {formatBytes(f.size)}
                              </Text>
                            </Box>
                            {!processing && !uploading && (
                              <Button
                                variant="subtle"
                                color="red"
                                size="xs"
                                style={{ width: '24px', height: '24px', padding: 0 }}
                                onClick={() => removeFile(f.id)}
                              >
                                <X size={14} />
                              </Button>
                            )}
                          </Group>
                        </List.Item>
                      ))}
                    </List>
                  </ScrollArea>
                </Stack>
              )}

              {files.length === 0 && (
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.01))',
                    border: '1px dashed var(--line)',
                    borderRadius: 'var(--mantine-radius-sm)',
                    flex: 1
                  }}
                >
                  <Upload size={32} style={{ color: 'var(--muted)', marginBottom: '10px' }} />
                  <Text size="xs" c="dimmed" ta="center">
                    No spreadsheets uploaded. Click or drag-and-drop `.xlsx` workbooks to begin.
                  </Text>
                </Box>
              )}

              <Divider my="xs" style={{ borderColor: 'var(--line)' }} />

              <Group justify="space-between" align="center" style={{ width: '100%' }}>
                <Group gap="md">
                  <Switch
                    label="Load from storage"
                    checked={pullFromCache}
                    onChange={(event) => setPullFromCache(event.currentTarget.checked)}
                    size="xs"
                    disabled={processing || uploading}
                    styles={{
                      label: { cursor: 'pointer', fontSize: '11px', fontWeight: 600 }
                    }}
                  />
                  <Switch
                    label="Show comments"
                    checked={showResubmissionComments}
                    onChange={(event) => setShowResubmissionComments(event.currentTarget.checked)}
                    size="xs"
                    disabled={processing || uploading}
                    styles={{
                      label: { cursor: 'pointer', fontSize: '11px', fontWeight: 600 }
                    }}
                  />
                  <Switch
                    label="Hide columns"
                    checked={hideColumns}
                    onChange={(event) => setHideColumns(event.currentTarget.checked)}
                    size="xs"
                    disabled={processing || uploading}
                    styles={{
                      label: { cursor: 'pointer', fontSize: '11px', fontWeight: 600 }
                    }}
                  />
                </Group>

                <Group gap="xs">
                  {processing && (
                    <Button
                      color="orange"
                      variant="outline"
                      onClick={cancelJob}
                      leftSection={<StopCircle size={14} />}
                      style={{ width: '140px' }}
                    >
                      Cancel Processing
                    </Button>
                  )}

                  <Button
                    color="blue"
                    onClick={startJob}
                    loading={processing || uploading}
                    disabled={files.length === 0}
                    leftSection={<Play size={14} />}
                    style={{ width: '160px' }}
                  >
                    Process Spreadsheets
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Card>
        </Stack>

        {/* RIGHT COLUMN: Terminal Logs & Statistics */}
        <Stack gap="md" style={{ height: '100%' }}>
          <Card withBorder style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Stack gap="sm" style={{ flex: 1, height: '100%' }}>
              <Text fw={700} size="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pipeline Telemetry & Logs
              </Text>

              {/* Consolidated Telemetry Row */}
              {jobState && (
                <Box
                  style={{
                    backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
                    borderRadius: 'var(--mantine-radius-sm)',
                    padding: '8px 12px',
                    border: '1px solid var(--line)'
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="xs" align="center">
                      <Terminal size={14} style={{ color: 'var(--mantine-color-blue-filled)' }} />
                      <Text size="xs" fw={700}>
                        PROGRESS:
                      </Text>
                    </Group>
                    <Text size="xs" fw={800} color="blue">
                      {jobState.progress}%
                    </Text>
                  </Group>
                  <Progress value={jobState.progress} size="xs" color="blue" mt={6} animated={processing} />
                </Box>
              )}

              {/* Logs Viewer Console Box */}
              <Box
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--mantine-radius-sm)',
                  padding: '8px',
                  fontFamily: 'var(--mantine-font-family-monospace)',
                  fontSize: '11px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '220px'
                }}
              >
                <div style={{ flex: 1, position: 'relative' }}>
                  <ScrollArea style={{ height: '220px' }} viewportRef={logViewportRef}>
                    <Stack gap="2px" style={{ paddingRight: '8px' }}>
                      {jobState && jobState.logs && jobState.logs.length > 0 ? (
                        jobState.logs.map((log, lIdx) => (
                          <Text
                            key={lIdx}
                            style={{
                              fontFamily: 'inherit',
                              fontSize: 'inherit',
                              lineHeight: 1.4,
                              color: log.startsWith('[Analyzer]')
                                ? '#3bc9db' // Cyan for python extraction
                                : log.startsWith('[EHR Fetcher]')
                                  ? '#ffd43b' // Yellow for network Post
                                  : log.startsWith('[Colorizer]')
                                    ? '#e03131' // Pink/Red for openpyxl style update
                                    : log.startsWith('[Workshop] Fatal')
                                      ? '#f03e3e' // Red for fatal failure logs
                                      : '#a6a7ab' // Standard muted color
                            }}
                          >
                            {log}
                          </Text>
                        ))
                      ) : (
                        <Text size="xs" c="dimmed" style={{ fontStyle: 'italic', fontFamily: 'inherit' }}>
                          Terminal offline. Logs will print once spreadsheets processing begins.
                        </Text>
                      )}
                    </Stack>
                  </ScrollArea>
                </div>
              </Box>
            </Stack>
          </Card>
        </Stack>
      </SimpleGrid>

      {/* LOWER SECTION: Summary Results Cards */}
      {jobState && jobState.status === 'completed' && jobState.summary && (
        <Stack gap="md" mt="md">
          {/* Segmented Grid Metadata Blocks */}
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
            <Card withBorder padding="md">
              <Stack gap="2px">
                <Text size="10px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Files Processed
                </Text>
                <Text size="xl" fw={800} c="teal">
                  {jobState.summary.filesProcessed}
                </Text>
              </Stack>
            </Card>

            <Card withBorder padding="md">
              <Stack gap="2px">
                <Text size="10px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rejected Encounters Found
                </Text>
                <Text size="xl" fw={800} c="blue">
                  {jobState.summary.rejectedEncountersFound}
                </Text>
              </Stack>
            </Card>

            <Card withBorder padding="md">
              <Stack gap="2px">
                <Text size="10px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Encounters Colored / Updated
                </Text>
                <Text size="xl" fw={800} c="violet">
                  {jobState.summary.encountersUpdated}
                </Text>
              </Stack>
            </Card>

            <Card withBorder padding="md">
              <Stack gap="2px">
                <Text size="10px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Skips (No Rejections)
                </Text>
                <Text size="xl" fw={800} c="orange">
                  {jobState.summary.filesWithNoRejections}
                </Text>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Downloads Panel */}
          <Card withBorder p="md">
            <Stack gap="sm">
              <Text fw={700} size="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Download Outputs Packages
              </Text>

              <Group justify="space-between" align="center" wrap="nowrap">
                <Box style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <FileCheck size={20} color="var(--mantine-color-teal-filled)" />
                  <Box>
                    <Text fw={600} size="xs">
                      All Spreadsheets Processed Completely
                    </Text>
                    <Text size="10px" c="dimmed">
                      Downloads are packed into a single zip file, or download individually below.
                    </Text>
                  </Box>
                </Box>
                {jobState.outputZipPath && (
                  <Button
                    component="a"
                    href={`/api/excel-workshop/download?jobId=${jobState.id}`}
                    color="teal"
                    leftSection={<Download size={14} />}
                    style={{ width: '180px' }}
                  >
                    Download ZIP Pack
                  </Button>
                )}
              </Group>

              {jobState.outputFiles && jobState.outputFiles.length > 0 && (
                <Box mt="xs">
                  <Divider
                    mb="xs"
                    label="Individual Files"
                    labelPosition="left"
                    style={{ borderColor: 'var(--line)' }}
                  />
                  <Stack gap="xs">
                    {jobState.outputFiles.map((item, fIdx) => (
                      <Group
                        key={fIdx}
                        justify="space-between"
                        align="center"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.01))',
                          borderRadius: 'var(--mantine-radius-sm)',
                          border: '1px solid var(--line)'
                        }}
                      >
                        <Group gap="xs" align="center">
                          <CheckCircle size={14} style={{ color: 'var(--mantine-color-teal-filled)' }} />
                          <Text size="xs" fw={600} style={{ maxWidth: '280px' }} truncate>
                            {item.originalName}
                          </Text>
                        </Group>
                        <Button
                          component="a"
                          href={`/api/excel-workshop/download?jobId=${jobState.id}&fileIndex=${fIdx}`}
                          variant="outline"
                          color="teal"
                          size="xs"
                          leftSection={<Download size={12} />}
                          style={{ height: '24px', padding: '0 8px' }}
                        >
                          Download XLSX
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Card>
        </Stack>
      )}

      {/* Error Card */}
      {jobState && jobState.status === 'failed' && (
        <Card withBorder color="red" p="md" mt="md" style={{ borderColor: 'var(--mantine-color-red-filled)' }}>
          <Group gap="sm" align="center">
            <AlertCircle size={18} color="var(--mantine-color-red-filled)" />
            <Box>
              <Text fw={700} size="xs" color="red" style={{ textTransform: 'uppercase' }}>
                Pipeline Execution Failed
              </Text>
              <Text size="xs" mt="2px">
                {jobState.error || 'An error occurred during Python Excel evaluation or EHR data resolution.'}
              </Text>
            </Box>
          </Group>
        </Card>
      )}
    </Box>
  )
}
