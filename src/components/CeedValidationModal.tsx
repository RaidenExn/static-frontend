import React, { useState, useEffect } from 'react'
import {
  Modal,
  Tabs,
  Button,
  Group,
  Text,
  Alert,
  Table,
  ScrollArea,
  Stack,
  Badge,
  Loader,
  Box,
  Card,
  Grid,
  Divider,
  ActionIcon,
  Tooltip,
  SegmentedControl,
  Accordion,
  Switch
} from '@mantine/core'
import {
  ShieldAlert,
  CheckCircle,
  Play,
  FileCode,
  Terminal,
  Activity,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  Cpu,
  ServerCrash,
  AlertOctagon,
  AlertCircle
} from 'lucide-react'
import { customFetch as fetch } from '../config/backend'

interface CeedValidationModalProps {
  isOpen: boolean
  onClose: () => void
  encounterId: string
}

/**
 * Resilient extraction helper to safely unpack data arrays from different JSON shapes returned
 * by either local database index routes, direct array structures, or remote Symfony `{ head, body: { Data: [...] } }` wrappers.
 */
const extractDataArray = (data: any): any[] => {
  if (!data) return []
  if (data.body && Array.isArray(data.body.Data)) return data.body.Data
  if (data.body && Array.isArray(data.body.data)) return data.body.data
  if (data.Success && Array.isArray(data.Data)) return data.Data
  if (data.success && Array.isArray(data.data)) return data.data
  if (Array.isArray(data.Data)) return data.Data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}

/**
 * Programmatic classification helper to correctly assign category badges based on the exception characteristics.
 */
const getErrorCategory = (editCode: string, description: string): 'Code Validation' | 'Medical Necessity' => {
  const code = String(editCode || '').toUpperCase()
  const desc = String(description || '').toUpperCase()
  if (code.startsWith('CPT') || desc.includes('ACTIVITY') || desc.includes('CROSS CODING')) {
    return 'Code Validation'
  }
  if (code.startsWith('ICD') || desc.includes('DIAGNOSIS') || desc.includes('EXCLUDE')) {
    return 'Medical Necessity'
  }
  return 'Code Validation'
}

export default function CeedValidationModal({ isOpen, onClose, encounterId }: CeedValidationModalProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [validationLoading, setValidationLoading] = useState<boolean>(false)
  const [logsLoading, setLogsLoading] = useState<boolean>(false)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState<boolean>(false)
  const [xmlLoading, setXmlLoading] = useState<boolean>(false)

  const [validationMode, setValidationMode] = useState<'1' | '2'>('1')
  const [validationResult, setValidationResult] = useState<any | null>(null)
  const [validationLogs, setValidationLogs] = useState<any[]>([])
  const [diagnosticsData, setDiagnosticsData] = useState<any[]>([])
  const [generatedXml, setGeneratedXml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  // Persist the Auto-run preference to localStorage
  const [autoRun, setAutoRun] = useState<boolean>(() => localStorage.getItem('ceed_auto_run') !== 'false')

  // Reset states and initialize popup content on mount or swap
  useEffect(() => {
    const initModal = async () => {
      if (isOpen) {
        setValidationResult(null)
        setValidationLogs([])
        setDiagnosticsData([])
        setGeneratedXml(null)
        setError(null)
        setActiveTab('dashboard')

        // Fetch background diagnostics summary
        fetchDiagnostics()

        // Fetch and wait for the validation logs history
        const logs = await fetchLogs()

        // Trigger active validations sequentially if Auto Run is active
        if (autoRun) {
          runValidation()
        }
      }
    }
    initModal()
  }, [isOpen, encounterId])

  // Update XML on validation mode toggle if modal is open
  useEffect(() => {
    if (isOpen && encounterId) {
      fetchXml()
    }
  }, [validationMode, isOpen, encounterId])

  const runValidation = async () => {
    if (!encounterId) return
    setValidationLoading(true)
    setError(null)
    try {
      // 1. Run Code Validation (reqType = 1)
      const res1 = await fetch('/api/submit/ceed/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encId: encounterId, reqType: 1 })
      })
      if (!res1.ok) throw new Error(`Code Validation failed (HTTP ${res1.status})`)
      const data1 = await res1.json()

      // 2. Run Medical Necessity (reqType = 2)
      const res2 = await fetch('/api/submit/ceed/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encId: encounterId, reqType: 2 })
      })
      if (!res2.ok) throw new Error(`Medical Necessity failed (HTTP ${res2.status})`)
      const data2 = await res2.json()

      // Set the validation result to the final check output
      setValidationResult(data2)

      // Chain loading logs, diagnostics, and xml for complete sync
      fetchLogs()
      fetchDiagnostics()
      fetchXml()
    } catch (err: any) {
      setError(`Failed to run CEED validation: ${err.message}`)
    } finally {
      setValidationLoading(false)
    }
  }

  const fetchLogs = async () => {
    if (!encounterId) return []
    setLogsLoading(true)
    try {
      const res = await fetch('/api/ceed/validation/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encId: encounterId })
      })
      if (res.ok) {
        const data = await res.json()
        const logs = extractDataArray(data)
        setValidationLogs(logs)
        return logs
      }
    } catch (err: any) {
      console.error('Failed to fetch CEED validation logs:', err)
    } finally {
      setLogsLoading(false)
    }
    return []
  }

  const fetchDiagnostics = async () => {
    if (!encounterId) return
    setDiagnosticsLoading(true)
    try {
      const res = await fetch('/api/claim/encounter/detailsget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterId })
      })
      if (res.ok) {
        const data = await res.json()
        const list = extractDataArray(data)
        let extractedDiags: any[] = []
        if (list.length > 0) {
          const firstItem = list[0]
          if (firstItem && Array.isArray(firstItem.diagRes)) {
            extractedDiags = firstItem.diagRes
          } else if (firstItem && Array.isArray(firstItem.diag_res)) {
            extractedDiags = firstItem.diag_res
          } else {
            extractedDiags = list
          }
        }
        setDiagnosticsData(extractedDiags)
      }
    } catch (err: any) {
      console.error('Failed to fetch diagnostics:', err)
    } finally {
      setDiagnosticsLoading(false)
    }
  }

  const fetchXml = async () => {
    if (!encounterId) return
    setXmlLoading(true)
    try {
      const res = await fetch('/api/ceed/generate/xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encId: encounterId, returnRaw: true, reqType: Number(validationMode) })
      })
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('xml')) {
        const rawXml = await res.text()
        setGeneratedXml(rawXml)
      } else {
        const data = await res.json()
        if (data.xmlPath) {
          setGeneratedXml(
            `<!-- XML path generated successfully on upstream EHR server -->\n<xmlPath>${data.xmlPath}</xmlPath>`
          )
        } else {
          setGeneratedXml(JSON.stringify(data, null, 2))
        }
      }
    } catch (err: any) {
      console.error('Failed to generate CEED XML:', err)
      setGeneratedXml(`<!-- Error generating XML: ${err.message} -->`)
    } finally {
      setXmlLoading(false)
    }
  }

  const handleCopyXml = () => {
    if (!generatedXml) return
    navigator.clipboard.writeText(generatedXml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Safely extract claim edits/exceptions from various potential JSON structures in log items
  const getClaimEdits = (logItem: any): any[] => {
    if (!logItem) return []
    if (Array.isArray(logItem.claimEdits)) return logItem.claimEdits
    if (Array.isArray(logItem.claimEdags)) return logItem.claimEdags

    let responseObj = logItem.ceed_validation_response
    if (typeof responseObj === 'string') {
      try {
        responseObj = JSON.parse(responseObj)
      } catch (e) {
        responseObj = null
      }
    }
    if (responseObj && Array.isArray(responseObj.claimEdits)) {
      return responseObj.claimEdits
    }

    let resObj = logItem.res_content
    if (typeof resObj === 'string') {
      try {
        resObj = JSON.parse(resObj)
      } catch (e) {
        resObj = null
      }
    }
    if (resObj && Array.isArray(resObj.claimEdits)) {
      return resObj.claimEdits
    }
    if (resObj?.Data && Array.isArray(resObj.Data[0]?.claimEdits)) {
      return resObj.Data[0].claimEdits
    }
    return []
  }

  // Aggregate, deduplicate, re-classify, and sort clinical exceptions (ICD errors first)
  const getMergedLatestExceptions = (): { edit: any; logType: string; logId: number }[] => {
    const allEdits: { edit: any; logId: number }[] = []
    validationLogs.forEach((log) => {
      const edits = getClaimEdits(log)
      edits.forEach((edit) => {
        allEdits.push({ edit, logId: log.log_id || log.logId })
      })
    })

    const seen = new Set<string>()
    const uniqueEdits: { edit: any; logType: string; logId: number }[] = []

    allEdits.forEach(({ edit, logId }) => {
      const key = `${edit.editCode || ''}_${edit.editComment || ''}`
      if (!seen.has(key)) {
        seen.add(key)
        
        const editCode = edit.editCode || ''
        const description = edit.editType?.description || edit.editComment || ''
        const category = getErrorCategory(editCode, description)

        uniqueEdits.push({
          edit,
          logType: category,
          logId
        })
      }
    })

    // Sort ICD related (Medical Necessity) exceptions to the top of the feed
    uniqueEdits.sort((a, b) => {
      const aIsIcd = String(a.edit.editCode || '').toUpperCase().startsWith('ICD')
      const bIsIcd = String(b.edit.editCode || '').toUpperCase().startsWith('ICD')
      
      if (aIsIcd && !bIsIcd) return -1
      if (!aIsIcd && bIsIcd) return 1
      return 0
    })

    return uniqueEdits
  }

  const latestLog = validationLogs[0]
  const activeResult = validationResult || latestLog
  const valDetails = activeResult ? (extractDataArray(activeResult)[0] || activeResult) : null
  const mergedExceptions = getMergedLatestExceptions()

  // Determine indicator flags with resilient fallback unpackings
  const isCeedSuccess =
    activeResult?.Success === true ||
    valDetails?.status_value === 1 ||
    valDetails?.success === true ||
    valDetails?.success === 'true' ||
    activeResult?.resp_status === 'Success'

  const isCeedDone =
    valDetails?.isCeedDone === 1 ||
    valDetails?.isCeedDone === 2 ||
    valDetails?.isCeedDone === '1' ||
    valDetails?.isCeedDone === '2' ||
    activeResult?.isCeedDone === 1 ||
    (latestLog && !validationResult)

  const validationMessage =
    valDetails?.message ||
    valDetails?.status_text ||
    valDetails?.statusText ||
    activeResult?.message ||
    activeResult?.resp_status

  const runTimestamp = validationResult 
    ? 'Just now (Active Run)' 
    : (latestLog?.date_submitted || latestLog?.dateSubmitted || null)

  const hasMergedExceptions = mergedExceptions.length > 0

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      radius="sm"
      padding="md"
      overlayProps={{
        backgroundOpacity: 0.55
      }}
      styles={{
        header: {
          backgroundColor: 'transparent',
          borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
          paddingBottom: '10px'
        },
        content: {
          backgroundColor: 'var(--bg-translucent, rgba(26, 26, 26, 0.75))',
          borderColor: 'var(--line, rgba(255, 255, 255, 0.05))',
          color: 'var(--ink, #ffffff)',
          overflow: 'hidden',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column'
        },
        body: {
          paddingTop: '15px',
          height: '75vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
      title={
        <Group gap="xs" align="center">
          <Cpu style={{ width: 18, height: 18, color: 'var(--badge-info-text, #00d2ff)' }} />
          <Stack gap={1}>
            <Text size="sm" fw={700}>
              CEED Rules Engine & Clinical Diagnostics
            </Text>
            <Text size="xs" c="dimmed">
              Encounter Suffix ID:{' '}
              <strong style={{ color: 'var(--badge-info-text)' }}>{encounterId || 'No loaded encounter'}</strong>
            </Text>
          </Stack>
        </Group>
      }
    >
      {!encounterId ? (
        <Alert
          icon={<ShieldAlert size={16} />}
          title="Encounter Context Required"
          color="red"
          radius="xs"
          variant="light"
        >
          No encounter is currently loaded. Please search for and select an active encounter in the portal before
          opening the CEED validator.
        </Alert>
      ) : (
        <Tabs
          value={activeTab}
          onChange={(val) => val && setActiveTab(val)}
          color="cyan"
          variant="outline"
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <Tabs.List style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))', marginBottom: '15px' }}>
            <Tabs.Tab value="dashboard" leftSection={<Activity size={14} />}>
              Dashboard & Reports
            </Tabs.Tab>
            <Tabs.Tab value="xml" leftSection={<FileCode size={14} />}>
              CEED XML Payload
            </Tabs.Tab>
          </Tabs.List>

          {/* TAB 1: DASHBOARD & REPORTS (CONSOLIDATED VIEW) */}
          <Tabs.Panel
            value="dashboard"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
          >
            <ScrollArea style={{ flex: 1 }} type="auto">
              <Stack gap="md" p="xs">
                {error && (
                  <Alert
                    icon={<ServerCrash size={16} />}
                    title="Upstream Connection Error"
                    color="red"
                    radius="xs"
                    variant="light"
                  >
                    {error}
                  </Alert>
                )}

                {/* Loading Banner */}
                {validationLoading && (
                  <Card
                    withBorder
                    radius="sm"
                    p="sm"
                    style={{
                      backgroundColor: 'rgba(0, 210, 255, 0.02)',
                      borderColor: 'var(--line, rgba(255, 255, 255, 0.05))',
                      textAlign: 'center'
                    }}
                  >
                    <Stack align="center" gap="xs">
                      <Loader color="cyan" size="sm" type="dots" />
                      <Text size="xs" c="cyan" fw={600}>
                        Running Clinically Essential Encounter Diagnostics validation over HTTP/2 persistent pool...
                      </Text>
                    </Stack>
                  </Card>
                )}

                {/* Compact State Header Banner */}
                {activeResult && !validationLoading && (
                  <Card
                    withBorder
                    radius="sm"
                    p="xs"
                    style={{
                      backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.01))',
                      borderColor: 'var(--line, rgba(255, 255, 255, 0.05))'
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        {isCeedSuccess && isCeedDone ? (
                          <CheckCircle size={16} style={{ color: 'var(--mantine-color-teal-6)' }} />
                        ) : (
                          <AlertTriangle size={16} style={{ color: 'var(--mantine-color-orange-6)' }} />
                        )}
                        <Stack gap={0}>
                          <Text
                            size="xs"
                            fw={700}
                            style={{
                              color:
                                isCeedSuccess && isCeedDone
                                  ? 'var(--mantine-color-teal-4)'
                                  : 'var(--mantine-color-orange-4)'
                            }}
                          >
                            {isCeedSuccess && isCeedDone ? 'CEED VALIDATION APPROVED' : 'CEED EXCEPTIONS FOUND'}
                          </Text>
                          <Text size="10px" c="dimmed">
                            {validationMessage || 'Encounter processed with diagnostic recommendations.'}
                          </Text>
                        </Stack>
                      </Group>
                      {runTimestamp && (
                        <Badge color="cyan" size="xs" radius="xs" variant="outline">
                          Validated: {runTimestamp}
                        </Badge>
                      )}
                    </Group>
                  </Card>
                )}

                <Grid {...({ gutter: 'sm' } as any)}>
                  {/* CEED Rules Breaches & Exceptions Block */}
                  {hasMergedExceptions ? (
                    <Grid.Col span={12}>
                      <Card
                        withBorder
                        radius="sm"
                        p="sm"
                        style={{
                          borderColor: 'var(--line, rgba(255, 255, 255, 0.05))',
                          backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.01))'
                        }}
                      >
                        <Group justify="space-between" align="center" style={{ marginBottom: '10px' }}>
                          <Text size="xs" fw={700} c="orange" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ACTIVE RULES EXCEPTIONS & RECOMMENDATIONS ({mergedExceptions.length})
                          </Text>
                          <Badge color="orange" size="xs" radius="xs" variant="filled">
                            Attention Required
                          </Badge>
                        </Group>
                        <Stack gap="xs">
                          {mergedExceptions.map(({ edit, logType, logId }, idx) => {
                            const editCode = edit.editCode || 'EXCEPTION'
                            const isCPT = editCode.toUpperCase().startsWith('CPT')
                            const serviceCode = edit.serviceCode || edit.editType?.serviceCode
                            
                            return (
                              <Card
                                key={idx}
                                withBorder
                                radius="xs"
                                p="xs"
                                style={{
                                  backgroundColor: isCPT ? 'rgba(253, 126, 20, 0.06)' : 'rgba(250, 82, 82, 0.06)',
                                  borderColor: isCPT ? 'rgba(253, 126, 20, 0.2)' : 'rgba(250, 82, 82, 0.2)'
                                }}
                              >
                                <Group justify="space-between" align="center" style={{ marginBottom: '4px' }}>
                                  <Group gap="xs">
                                    {isCPT ? (
                                      <AlertCircle size={13} style={{ color: 'var(--mantine-color-orange-6)' }} />
                                    ) : (
                                      <AlertOctagon size={13} style={{ color: 'var(--mantine-color-red-6)' }} />
                                    )}
                                    <Text
                                      size="xs"
                                      fw={700}
                                      style={{
                                        color: isCPT ? 'var(--mantine-color-orange-4)' : 'var(--mantine-color-red-4)'
                                      }}
                                    >
                                      {editCode}
                                    </Text>
                                    <Badge color={isCPT ? 'orange' : 'red'} size="xs" radius="xs" variant="outline" style={{ fontSize: '9px' }}>
                                      {logType}
                                    </Badge>
                                  </Group>
                                  <Group gap="xs">
                                    {serviceCode && (
                                      <Badge color="cyan" size="xs" radius="xs" variant="outline" style={{ fontSize: '9px' }}>
                                        Code: {serviceCode}
                                      </Badge>
                                    )}
                                    <Text size="10px" c="dimmed">
                                      Run ID: {logId}
                                    </Text>
                                  </Group>
                                </Group>
                                <Text size="xs" style={{ color: 'var(--ink)' }}>
                                  {edit.editComment || 'Rule breached or diagnostic mismatch found.'}
                                </Text>
                              </Card>
                            )
                          })}
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ) : (
                    validationLogs.length > 0 && !logsLoading && (
                      <Grid.Col span={12}>
                        <Card
                          withBorder
                          radius="sm"
                          p="sm"
                          style={{
                            borderColor: 'var(--mantine-color-teal-3)',
                            backgroundColor: 'rgba(9, 146, 104, 0.02)',
                            textAlign: 'center'
                          }}
                        >
                          <Group gap="xs" justify="center">
                            <CheckCircle size={18} style={{ color: 'var(--mantine-color-teal-6)' }} />
                            <Text size="xs" fw={700} c="teal">
                              ALL VALIDATION CHECKS PASSED. NO REMOTE EXCEPTIONS DETECTED.
                            </Text>
                          </Group>
                        </Card>
                      </Grid.Col>
                    )
                  )}

                  {/* Active Encounter Diagnoses */}
                  <Grid.Col span={12}>
                    <Card
                      withBorder
                      radius="sm"
                      p="sm"
                      style={{
                        backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.01))',
                        borderColor: 'var(--line, rgba(255, 255, 255, 0.05))'
                      }}
                    >
                      <Group justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                        <Text size="xs" fw={700} c="cyan">
                          ACTIVE ENCOUNTER DIAGNOSES SUMMARY ({diagnosticsData.length})
                        </Text>
                        <Badge color="cyan" size="xs" radius="xs">
                          ICD-10 Sync
                        </Badge>
                      </Group>

                      {diagnosticsLoading ? (
                        <Group gap="xs" align="center" py="xs">
                          <Loader size="xs" color="cyan" />
                          <Text size="xs" c="dimmed">
                            Retrieving active diagnoses...
                          </Text>
                        </Group>
                      ) : diagnosticsData.length > 0 ? (
                        <Table
                          verticalSpacing="xs"
                          horizontalSpacing="sm"
                          style={{
                            fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)',
                            borderColor: 'var(--line, rgba(255, 255, 255, 0.05))'
                          }}
                        >
                          <Table.Thead style={{ backgroundColor: 'var(--panel-soft, rgba(0,0,0,0.1))' }}>
                            <Table.Tr style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}>
                              <Table.Th style={{ color: 'var(--ink)' }}>CODE</Table.Th>
                              <Table.Th style={{ color: 'var(--ink)' }}>DESCRIPTION</Table.Th>
                              <Table.Th style={{ color: 'var(--ink)' }}>TYPE</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {diagnosticsData.map((diag, idx) => (
                              <Table.Tr key={idx} style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}>
                                <Table.Td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--badge-info-text)' }}>
                                  {diag.code || diag.icdCode || 'ICD-10'}
                                </Table.Td>
                                <Table.Td style={{ color: 'var(--ink)' }}>
                                  {diag.description || diag.desc || diag.order_name || 'Encounter Diagnosis'}
                                </Table.Td>
                                <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                  <Badge color="cyan" size="xs" radius="xs" variant="outline">
                                    {diag.type || 'Primary'}
                                  </Badge>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      ) : (
                        <Text size="xs" c="dimmed" style={{ textAlign: 'center', padding: '10px 0' }}>
                          No active clinical diagnostics records detected for this encounter. Run validation to synchronize.
                        </Text>
                      )}
                    </Card>
                  </Grid.Col>

                  {/* Raw Developer logs history Accordion */}
                  {validationLogs.length > 0 && (
                    <Grid.Col span={12}>
                      <Accordion variant="unstyled" style={{ width: '100%' }}>
                        <Accordion.Item value="developer-logs" style={{ border: 'none' }}>
                          <Accordion.Control style={{ padding: 0 }}>
                            <Group gap="xs">
                              <Terminal size={14} style={{ color: 'var(--badge-info-text)' }} />
                              <Text size="xs" fw={700} c="dimmed" style={{ textTransform: 'uppercase' }}>
                                Raw Developer Log History ({validationLogs.length} runs)
                              </Text>
                            </Group>
                          </Accordion.Control>
                          <Accordion.Panel style={{ paddingTop: '8px' }}>
                            <Stack gap="xs">
                              {validationLogs.map((log, idx) => {
                                const reqTypeLabel =
                                  log.req_type === 2 || log.reqType === 2 ? 'Medical Necessity' : 'Code Validation'
                                const dateText = log.date_submitted || log.dateSubmitted || 'Just now'
                                const edits = getClaimEdits(log)
                                const hasExceptions = edits.length > 0

                                return (
                                  <Card
                                    key={idx}
                                    withBorder
                                    radius="xs"
                                    p="xs"
                                    style={{
                                      backgroundColor: 'rgba(0,0,0,0.15)',
                                      borderColor: 'var(--line, rgba(255,255,255,0.05))'
                                    }}
                                  >
                                    <Group justify="space-between" align="center" style={{ marginBottom: '6px' }}>
                                      <Group gap="xs">
                                        <Badge color="cyan" size="xs" radius="xs" variant="light">
                                          ID: {log.log_id || `LOG-${idx}`}
                                        </Badge>
                                        <Badge color="blue" size="xs" radius="xs" variant="outline">
                                          {reqTypeLabel}
                                        </Badge>
                                        <Text size="xs" c="dimmed" fw={500}>
                                          {dateText}
                                        </Text>
                                      </Group>
                                      <Badge color={hasExceptions ? 'orange' : 'teal'} size="xs" radius="xs" variant="filled">
                                        {hasExceptions ? `${edits.length} Exceptions` : 'Approved'}
                                      </Badge>
                                    </Group>

                                    <Accordion variant="unstyled" chevronPosition="right" style={{ marginTop: '4px' }}>
                                      <Accordion.Item value="raw-payloads" style={{ border: 'none' }}>
                                        <Accordion.Control style={{ padding: 0, height: 'auto', minHeight: 0 }}>
                                          <Text size="10px" c="dimmed" fw={600}>
                                            Toggle Raw Developer Payloads
                                          </Text>
                                        </Accordion.Control>
                                        <Accordion.Panel style={{ paddingTop: '8px' }}>
                                          <Stack gap="xs">
                                            {log.req_content && (
                                              <Box>
                                                <Text size="xs" fw={600} c="dimmed">
                                                  Request Payload:
                                                </Text>
                                                <pre
                                                  style={{
                                                    margin: '4px 0 0 0',
                                                    padding: '6px',
                                                    fontSize: '10px',
                                                    backgroundColor: 'var(--panel, #121212)',
                                                    borderRadius: '4px',
                                                    overflowX: 'auto',
                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                    color: '#a0a0a0',
                                                    fontFamily: 'monospace'
                                                  }}
                                                >
                                                  {log.req_content}
                                                </pre>
                                              </Box>
                                            )}
                                            {log.res_content && (
                                              <Box>
                                                <Text size="xs" fw={600} c="dimmed">
                                                  Response Payload:
                                                </Text>
                                                <pre
                                                  style={{
                                                    margin: '4px 0 0 0',
                                                    padding: '6px',
                                                    fontSize: '10px',
                                                    backgroundColor: 'var(--panel, #121212)',
                                                    borderRadius: '4px',
                                                    overflowX: 'auto',
                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                    color: '#00d2ff',
                                                    fontFamily: 'monospace'
                                                  }}
                                                >
                                                  {log.res_content}
                                                </pre>
                                              </Box>
                                            )}
                                          </Stack>
                                        </Accordion.Panel>
                                      </Accordion.Item>
                                    </Accordion>
                                  </Card>
                                )
                              })}
                            </Stack>
                          </Accordion.Panel>
                        </Accordion.Item>
                      </Accordion>
                    </Grid.Col>
                  )}
                </Grid>
              </Stack>
            </ScrollArea>
          </Tabs.Panel>

          {/* TAB 2: GENERATED XML */}
          <Tabs.Panel
            value="xml"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
          >
            <Stack gap="xs" style={{ flex: 1, height: '100%' }} p="xs">
              <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed">
                  This XML matches the Clinically Essential Encounter Diagnostics payload prepared for submission.
                </Text>
                {generatedXml && (
                  <Button
                    size="xs"
                    variant="light"
                    color={copied ? 'teal' : 'cyan'}
                    leftSection={copied ? <Check size={12} /> : <Copy size={12} />}
                    onClick={handleCopyXml}
                  >
                    {copied ? 'Copied XML' : 'Copy XML'}
                  </Button>
                )}
              </Group>

              <ScrollArea
                style={{
                  flex: 1,
                  border: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
                  borderRadius: '4px',
                  backgroundColor: '#121212'
                }}
                type="auto"
              >
                {xmlLoading ? (
                  <Stack align="center" py="xl">
                    <Loader color="cyan" size="xs" />
                    <Text size="xs" c="dimmed">
                      Generating CEED XML content...
                    </Text>
                  </Stack>
                ) : generatedXml ? (
                  <pre
                    style={{
                      margin: 0,
                      padding: '12px',
                      fontSize: '11px',
                      color: '#00d2ff',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    {generatedXml}
                  </pre>
                ) : (
                  <Text size="xs" c="dimmed" style={{ textAlign: 'center', paddingTop: '40px' }}>
                    No CEED XML generated yet. Validate the encounter to render.
                  </Text>
                )}
              </ScrollArea>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      )}

      <Divider style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))', margin: '15px 0' }} />

      <Group justify="space-between" align="center">
        <Switch
          label="Auto-run on open"
          checked={autoRun}
          onChange={(event) => {
            const val = event.currentTarget.checked
            setAutoRun(val)
            localStorage.setItem('ceed_auto_run', String(val))
          }}
          color="cyan"
          size="xs"
          styles={{ label: { fontSize: '11px', fontWeight: 600, color: 'var(--ink, #ffffff)' } }}
        />

        <Group gap="xs">
          <Button
            size="xs"
            color="cyan"
            loading={validationLoading}
            onClick={runValidation}
            leftSection={activeResult ? <RefreshCw size={12} /> : <Play size={12} />}
          >
            {activeResult ? 'Re-run CEED Validator' : 'Run CEED Validator'}
          </Button>
          <Button size="xs" variant="outline" color="cyan" onClick={onClose}>
            Close Validator
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
