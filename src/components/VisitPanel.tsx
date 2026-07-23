import React, { useState, useRef } from 'react'
import { Card, Table, Badge, Title, Group, Stack, Text, Button, Modal, Loader, Box, Skeleton, Tooltip, ActionIcon } from '@mantine/core'
import { Eye, Clock, Archive, BookOpen, Download, Copy, Check, FileSpreadsheet, ShieldCheck, AlertCircle } from 'lucide-react'
import { RcmVisit, PatientHistoricFile } from '../types'
import { rcmStrVal } from '../utils'
import { customFetch as fetch } from '../config/backend'

interface VisitPanelProps {
  active: boolean
  visitCount: number
  visitRows: RcmVisit[]
  currentEncounter?: string
  historicCount: number
  historicFiles: PatientHistoricFile[]
  onOpenPdf: (downloadUrl: string, fileName: string) => void
  historicLoading?: boolean
}

export default function VisitPanel({
  active,
  visitCount,
  visitRows,
  currentEncounter,
  historicCount,
  historicFiles,
  onOpenPdf,
  historicLoading
}: VisitPanelProps) {
  const [selectedEncounter, setSelectedEncounter] = useState<string | null>(null)
  const [modalLoading, setModalLoading] = useState<boolean>(false)
  const [encounterData, setEncounterData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  // In-memory cache for ultra-fast instant 0ms prewarming & modal popups
  const visitActivityCache = useRef<Map<string, any>>(new Map())

  const handlePrewarmActivities = async (encNo: string) => {
    if (!encNo) return
    const clean = encNo.trim().toUpperCase()
    if (visitActivityCache.current.has(clean)) return

    try {
      const res = await fetch(`/api/encounter/visit-activities?encounter=${encodeURIComponent(clean)}`)
      if (res.ok) {
        const data = await res.json()
        visitActivityCache.current.set(clean, data)
      }
    } catch (_) {
      // Background prewarm fail is silent
    }
  }

  const handleViewActivities = async (encNo: string) => {
    const clean = encNo.trim().toUpperCase()
    setSelectedEncounter(clean)
    setError(null)
    setCopied(false)

    // Check prewarmed / cached data first for instant 0ms load
    if (visitActivityCache.current.has(clean)) {
      setEncounterData(visitActivityCache.current.get(clean))
      setModalLoading(false)
      return
    }

    setModalLoading(true)
    setEncounterData(null)

    try {
      const res = await fetch(`/api/encounter/visit-activities?encounter=${encodeURIComponent(clean)}`)
      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`
        try {
          const errJson = await res.json()
          if (errJson?.message) errorMsg = errJson.message
        } catch (_) {}
        throw new Error(errorMsg)
      }

      const data = await res.json()
      visitActivityCache.current.set(clean, data)
      setEncounterData(data)
    } catch (err: any) {
      console.error('[VisitPanel] Error loading visit activities:', err)
      setError(err.message || 'Failed to fetch activity details')
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedEncounter(null)
    setEncounterData(null)
    setError(null)
    setCopied(false)
  }

  const handleCopySummary = () => {
    if (!encounterData) return
    const acts = encounterData.activities || []
    const summaryLines = [
      `Encounter: ${encounterData.encounter}`,
      `Patient: ${encounterData.patientName} (${encounterData.patientId})`,
      `Doctor: ${encounterData.doctorName}`,
      `Date: ${encounterData.encounterDate}`,
      `Payer: ${encounterData.payerType}`,
      `Total Claim: ${encounterData.totalClaimPayer} | Total RA: ${encounterData.totalRaPayable} | Rejection: ${encounterData.totalRejection}`,
      '--------------------------------------------------',
      ...acts.map(
        (a: any, i: number) =>
          `${i + 1}. [${a.code}] ${a.order_name} | Qty: ${a.qty} | Auth: ${a.prior_auth_number} (${a.prior_auth_status}) | Claim: ${a.claim_payer_pay} | RA: ${a.ra_net_payable} | Rej: ${a.total_rej_amount}${
            a.claim_denial_code ? ` | Denial: [${a.claim_denial_code}] ${a.claim_denial_desc}` : ''
          }`
      )
    ].join('\n')

    navigator.clipboard.writeText(summaryLines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportCsv = () => {
    if (!encounterData) return
    const acts = encounterData.activities || []
    const headers = [
      'Code',
      'Order Name',
      'RA Status',
      'Approval Code',
      'Auth Status',
      'Qty',
      'Service Date',
      'Claim Payer',
      'Patient Pay',
      'RA Payer Net',
      'Rejection Amount',
      'Payment Ref / RA ID',
      'Denial Code',
      'Denial Remark'
    ]

    const csvRows = [
      headers.join(','),
      ...acts.map((a: any) =>
        [
          `"${a.code}"`,
          `"${a.order_name.replace(/"/g, '""')}"`,
          `"${a.status}"`,
          `"${a.prior_auth_number}"`,
          `"${a.prior_auth_status}"`,
          `"${a.qty}"`,
          `"${a.activity_start_date_time}"`,
          `"${a.claim_payer_pay}"`,
          `"${a.claim_patient_pay}"`,
          `"${a.ra_net_payable}"`,
          `"${a.total_rej_amount}"`,
          `"${a.ra_id_payer}"`,
          `"${a.claim_denial_code}"`,
          `"${a.claim_denial_desc.replace(/"/g, '""')}"`
        ].join(',')
      )
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `visit_activities_${encounterData.encounter}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!active) return null

  const cleanCurrentEnc = (currentEncounter || '').trim().toUpperCase()

  const cardStyle = {
    backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
    backdropFilter: 'var(--backdrop-filter, blur(16px))',
    WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
    border: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
  }

  const thStyle: React.CSSProperties = {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--muted)',
    paddingTop: '4px',
    paddingBottom: '4px'
  }

  const tdStyle: React.CSSProperties = {
    paddingTop: '3px',
    paddingBottom: '3px',
    lineHeight: '1.2'
  }

  const activities = encounterData?.activities || []

  return (
    <Stack gap="md" style={{ margin: '8px 10px' }}>
      {/* CARD 1: Visit History */}
      <Card withBorder radius="sm" padding="xs" style={cardStyle}>
        <Group justify="space-between" align="center" style={{ marginBottom: '12px' }}>
          <Group gap="xs" align="center">
            <Clock style={{ width: 14, height: 14, color: 'var(--mantine-color-text)' }} />
            <Title
              order={4}
              style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Visit History
            </Title>
            <Badge size="xs" variant="light" color="gray">
              {visitCount} Visits
            </Badge>
          </Group>
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Table
            highlightOnHover
            verticalSpacing={2}
            style={{ fontSize: '11.5px', borderCollapse: 'collapse', width: '100%' }}
          >
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.08))' }}>
                {[
                  'Visit',
                  'Status',
                  'Encounter Date',
                  'Invoice Date',
                  'Doctor',
                  'Payer Type',
                  'Payer Pay',
                  'Patient Pay',
                  'Receipt',
                  'Refund',
                  'Balance'
                ].map((h) => (
                  <Table.Th key={h} style={thStyle}>
                    {h}
                  </Table.Th>
                ))}
                <Table.Th style={{ ...thStyle, textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visitRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={12} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                    No visit history rows found.
                  </Table.Td>
                </Table.Tr>
              ) : (
                visitRows.map((row, idx) => {
                  const isCurrent =
                    row.display_encounter && row.display_encounter.trim().toUpperCase() === cleanCurrentEnc
                  const isSelfPay = (row.payer_type || '').trim().toLowerCase() === 'self pay'

                  const rowBgColor = isSelfPay
                    ? 'var(--mantine-color-red-light)'
                    : isCurrent
                      ? 'var(--mantine-color-default-hover)'
                      : 'transparent'

                  return (
                    <Table.Tr
                      key={idx}
                      style={{
                        backgroundColor: rowBgColor,
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <Table.Td
                        style={{
                          ...tdStyle,
                          fontWeight: isCurrent ? 800 : 500,
                          color: isCurrent ? 'var(--mantine-color-text)' : 'inherit'
                        }}
                      >
                        <Group gap="xs" wrap="nowrap">
                          {isCurrent && (
                            <Badge size="xs" variant="filled" style={{ height: '14px', fontSize: '8px' }}>
                              Active
                            </Badge>
                          )}
                          {row.display_encounter || ''}
                        </Group>
                      </Table.Td>
                      <Table.Td style={tdStyle}>{row.appointment_status || ''}</Table.Td>
                      <Table.Td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {row.actual_encounter_start_date || row.start_date || ''}
                      </Table.Td>
                      <Table.Td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{row.start_date || ''}</Table.Td>
                      <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>{row.phy_name || ''}</Table.Td>
                      <Table.Td style={{ ...tdStyle, fontWeight: isSelfPay ? 700 : 400 }}>
                        {row.payer_type || ''}
                      </Table.Td>
                      <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>{rcmStrVal(row.payer_pay) || ''}</Table.Td>
                      <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>
                        {rcmStrVal(row.patient_payable) || ''}
                      </Table.Td>
                      <Table.Td style={{ ...tdStyle, color: 'var(--good, #2b8a3e)', fontWeight: 600 }}>
                        {rcmStrVal(row.receipt_total) || ''}
                      </Table.Td>
                      <Table.Td style={{ ...tdStyle, color: 'var(--bad, #e03131)', fontWeight: 600 }}>
                        {rcmStrVal(row.totol_refund) || ''}
                      </Table.Td>
                      <Table.Td style={{ ...tdStyle, fontWeight: 700 }}>{rcmStrVal(row.balance_due) || ''}</Table.Td>
                      <Table.Td style={{ ...tdStyle, textAlign: 'center' }}>
                        <Button
                          size="xs"
                          variant="subtle"
                          leftSection={<Eye style={{ width: 11, height: 11 }} />}
                          onMouseEnter={() => handlePrewarmActivities(row.display_encounter || '')}
                          onClick={() => handleViewActivities(row.display_encounter || '')}
                          style={{ height: '18px', padding: '0 6px', fontSize: '10px' }}
                        >
                          View
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  )
                })
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Card>

      {/* CARD 2: Historic Files */}
      <Card withBorder radius="sm" padding="xs" style={cardStyle}>
        <Group justify="space-between" align="center" style={{ marginBottom: '12px' }}>
          <Group gap="xs" align="center">
            <Archive style={{ width: 14, height: 14, color: 'var(--mantine-color-text)' }} />
            <Title
              order={4}
              style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Historic Patient Files
            </Title>
            <Badge size="xs" variant="light" color="gray">
              {historicCount} Files
            </Badge>
          </Group>
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Table
            highlightOnHover
            verticalSpacing={2}
            style={{ fontSize: '11.5px', borderCollapse: 'collapse', width: '100%' }}
          >
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.08))' }}>
                <Table.Th style={{ ...thStyle, width: '40px' }}>#</Table.Th>
                {['File Name', 'Type', 'Patient ID', 'Site', 'Server Path'].map((h) => (
                  <Table.Th key={h} style={thStyle}>
                    {h}
                  </Table.Th>
                ))}
                <Table.Th style={{ ...thStyle, textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {historicLoading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <Table.Tr key={`shimmer-historic-${idx}`}>
                    <Table.Td style={tdStyle}>
                      <Skeleton height={12} radius="sm" />
                    </Table.Td>
                    <Table.Td style={tdStyle}>
                      <Skeleton height={12} width="80%" radius="sm" />
                    </Table.Td>
                    <Table.Td style={tdStyle}>
                      <Skeleton height={12} width={50} radius="sm" />
                    </Table.Td>
                    <Table.Td style={tdStyle}>
                      <Skeleton height={12} width={60} radius="sm" />
                    </Table.Td>
                    <Table.Td style={tdStyle}>
                      <Skeleton height={12} width={40} radius="sm" />
                    </Table.Td>
                    <Table.Td style={tdStyle}>
                      <Skeleton height={12} width="90%" radius="sm" />
                    </Table.Td>
                    <Table.Td style={tdStyle}>
                      <Skeleton height={18} width={60} radius="sm" style={{ margin: 'auto' }} />
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : historicFiles.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                    No historic files found.
                  </Table.Td>
                </Table.Tr>
              ) : (
                historicFiles.map((row, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td style={{ ...tdStyle, color: 'var(--muted)', fontWeight: 600 }}>{idx + 1}</Table.Td>
                    <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>{row.name || ''}</Table.Td>
                    <Table.Td style={tdStyle}>{row.fileType || ''}</Table.Td>
                    <Table.Td style={tdStyle}>{rcmStrVal(row.patientId) || ''}</Table.Td>
                    <Table.Td style={tdStyle}>{rcmStrVal(row.siteId) || ''}</Table.Td>
                    <Table.Td style={{ ...tdStyle, color: 'var(--muted)', fontFamily: 'monospace', fontSize: '10px' }}>
                      {row.serverPath || ''}
                    </Table.Td>
                    <Table.Td style={{ ...tdStyle, textAlign: 'center' }}>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<Download style={{ width: 11, height: 11 }} />}
                        onClick={() => onOpenPdf(row.downloadUrl || '', row.name || '')}
                        style={{ height: '18px', padding: '0 6px', fontSize: '10px' }}
                      >
                        Open PDF
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Card>

      {/* Upgraded Visit Activity Details Popup Modal */}
      <Modal
        opened={!!selectedEncounter}
        onClose={handleCloseModal}
        title={
          <Group gap="xs">
            <BookOpen style={{ width: 14, height: 14, color: 'var(--mantine-color-text)' }} />
            <Text style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Detailed Visit Activity Breakdown
            </Text>
          </Group>
        }
        size="90%"
        centered
        overlayProps={{ backgroundOpacity: 0.65, blur: 6 }}
        styles={{
          header: {
            backgroundColor: 'var(--mantine-color-body)',
            borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.08))'
          },
          content: {
            backgroundColor: 'var(--mantine-color-body)',
            border: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
            borderRadius: 'var(--mantine-radius-sm)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.45)'
          },
          body: { padding: '16px' }
        }}
      >
        <Stack gap="sm">
          {/* Telemetry Summary Bar */}
          {encounterData && (
            <Box
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                padding: '10px 14px',
                borderRadius: 'var(--mantine-radius-sm)',
                border: '1px solid var(--line, rgba(255, 255, 255, 0.08))'
              }}
            >
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Group gap="md">
                  <Box>
                    <Text size="10px" color="dimmed" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      Encounter
                    </Text>
                    <Text size="xs" style={{ fontWeight: 800 }}>
                      {encounterData.encounter}
                    </Text>
                  </Box>
                  <Box style={{ borderLeft: '1px solid var(--line)', paddingLeft: '12px' }}>
                    <Text size="10px" color="dimmed" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      Patient
                    </Text>
                    <Text size="xs" style={{ fontWeight: 700 }}>
                      {encounterData.patientName} ({encounterData.patientId})
                    </Text>
                  </Box>
                  <Box style={{ borderLeft: '1px solid var(--line)', paddingLeft: '12px' }}>
                    <Text size="10px" color="dimmed" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      Doctor
                    </Text>
                    <Text size="xs" style={{ fontWeight: 700 }}>
                      {encounterData.doctorName}
                    </Text>
                  </Box>
                  <Box style={{ borderLeft: '1px solid var(--line)', paddingLeft: '12px' }}>
                    <Text size="10px" color="dimmed" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      Visit Date
                    </Text>
                    <Text size="xs" style={{ fontWeight: 600 }}>
                      {encounterData.encounterDate}
                    </Text>
                  </Box>
                </Group>

                <Group gap="sm">
                  <Badge variant="light" color="blue" size="sm">
                    Claim: AED {encounterData.totalClaimPayer}
                  </Badge>
                  <Badge variant="light" color="green" size="sm">
                    RA: AED {encounterData.totalRaPayable}
                  </Badge>
                  <Badge
                    variant="light"
                    color={Number(encounterData.totalRejection) > 0 ? 'red' : 'gray'}
                    size="sm"
                  >
                    Rej: AED {encounterData.totalRejection}
                  </Badge>
                </Group>
              </Group>
            </Box>
          )}

          {modalLoading ? (
            <Group justify="center" align="center" style={{ minHeight: '180px' }}>
              <Stack align="center" gap="xs">
                <Loader size="sm" />
                <Text size="xs" color="dimmed">
                  Fetching rich activity details from SQLite database...
                </Text>
              </Stack>
            </Group>
          ) : error ? (
            <Card
              withBorder
              padding="sm"
              style={{ borderColor: 'var(--bad, #e03131)', backgroundColor: 'rgba(224, 49, 49, 0.05)' }}
            >
              <Text size="xs" style={{ fontWeight: 700, color: 'var(--bad, #e03131)' }}>
                Failed to load activity details
              </Text>
              <Text size="xs" color="dimmed">
                {error}
              </Text>
            </Card>
          ) : activities.length === 0 ? (
            <Text size="xs" color="dimmed" style={{ textAlign: 'center', padding: '24px' }}>
              No activity rows recorded for this visit.
            </Text>
          ) : (
            <Box style={{ overflowX: 'auto', maxHeight: '420px' }}>
              <Table verticalSpacing={3} style={{ fontSize: '11px', minWidth: '950px' }} highlightOnHover>
                <Table.Thead style={{ stickyHeader: true, top: 0, zIndex: 1, backgroundColor: 'var(--mantine-color-body)' }}>
                  <Table.Tr style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.08))' }}>
                    {[
                      'Code',
                      'Order Description',
                      'RA Status',
                      'Approval Code',
                      'Auth Status',
                      'Qty',
                      'Claim Payer',
                      'Patient Pay',
                      'RA Payer Net',
                      'Rejection',
                      'Payment Ref / RA ID',
                      'Denial Reason & Code'
                    ].map((h) => (
                      <Table.Th
                        key={h}
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '9.5px',
                          color: 'var(--muted)',
                          paddingTop: '6px',
                          paddingBottom: '6px'
                        }}
                      >
                        {h}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {activities.map((act: any, i: number) => {
                    const hasAuth = act.prior_auth_number && act.prior_auth_number !== '-'
                    const hasRejection = Number(act.total_rej_amount) > 0

                    return (
                      <Table.Tr key={i}>
                        <Table.Td style={{ ...tdStyle, fontWeight: 700, fontFamily: 'monospace' }}>{act.code}</Table.Td>
                        <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>{act.order_name}</Table.Td>
                        <Table.Td style={tdStyle}>
                          <Badge
                            size="xs"
                            variant="light"
                            color={
                              act.status === 'Full Remittance' || act.status === 'Full RA'
                                ? 'green'
                                : act.status === 'Partial Remittance' || act.status === 'Partial RA'
                                  ? 'orange'
                                  : act.status === 'Denied'
                                    ? 'red'
                                    : act.status === 'Submitted'
                                      ? 'cyan'
                                      : act.status === 'Recovery'
                                        ? 'violet'
                                        : act.status === 'RA Error'
                                          ? 'pink'
                                          : 'gray'
                            }
                            style={{ height: '16px', fontSize: '8.5px' }}
                          >
                            {act.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ ...tdStyle, fontWeight: 700, fontFamily: 'monospace' }}>
                          <Group gap="4px" wrap="nowrap">
                            {hasAuth && <ShieldCheck style={{ width: 11, height: 11, color: 'var(--mantine-color-teal-4)' }} />}
                            <Text size="xs" style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                              {act.prior_auth_number}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td style={tdStyle}>
                          <Badge
                            size="xs"
                            variant="dot"
                            color={hasAuth ? 'teal' : 'gray'}
                            style={{ height: '16px', fontSize: '8.5px' }}
                          >
                            {act.prior_auth_status}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ ...tdStyle, textAlign: 'center' }}>{act.qty}</Table.Td>
                        <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>{act.claim_payer_pay}</Table.Td>
                        <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>{act.claim_patient_pay}</Table.Td>
                        <Table.Td style={{ ...tdStyle, fontWeight: 700, color: 'var(--good, #2b8a3e)' }}>
                          {act.ra_net_payable}
                        </Table.Td>
                        <Table.Td style={{ ...tdStyle, fontWeight: 700, color: hasRejection ? 'var(--bad, #e03131)' : 'var(--muted)' }}>
                          {act.total_rej_amount}
                        </Table.Td>
                        <Table.Td style={{ ...tdStyle, fontSize: '10px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                          {act.ra_id_payer}
                        </Table.Td>
                        <Table.Td style={{ ...tdStyle, color: hasRejection ? 'var(--bad, #e03131)' : 'inherit', fontSize: '10.5px' }}>
                          {act.claim_denial_code ? `[${act.claim_denial_code}] ` : ''}
                          {act.claim_denial_desc || '-'}
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Box>
          )}

          {/* Modal Action Bar */}
          <Group justify="space-between" align="center" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))' }}>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                leftSection={copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                onClick={handleCopySummary}
                disabled={!encounterData || activities.length === 0}
              >
                {copied ? 'Copied Summary' : 'Copy Summary'}
              </Button>
              <Button
                size="xs"
                variant="light"
                color="green"
                leftSection={<FileSpreadsheet style={{ width: 12, height: 12 }} />}
                onClick={handleExportCsv}
                disabled={!encounterData || activities.length === 0}
              >
                Export CSV
              </Button>
            </Group>

            <Button size="xs" variant="outline" onClick={handleCloseModal}>
              Close Window
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
