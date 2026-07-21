import React, { useState } from 'react'
import { Card, Table, Badge, Title, Group, Stack, Text, Button, Modal, Loader, Box, Skeleton } from '@mantine/core'
import { Eye, Clock, Archive, BookOpen, Download } from 'lucide-react'
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
  const [activities, setActivities] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleViewActivities = async (encNo: string) => {
    setSelectedEncounter(encNo)
    setModalLoading(true)
    setError(null)
    setActivities([])
    try {
      const res = await fetch('/api/encounter/rcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounter: encNo })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setActivities(data?.rcm?.flattened?.activity || [])
    } catch (err: any) {
      console.error('[VisitPanel] Error loading activities:', err)
      setError(err.message || 'Failed to fetch activity details')
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedEncounter(null)
    setActivities([])
    setError(null)
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

                  // Prioritize highlighting Self Pay rows, fall back to active encounter color mapping
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
                        variant="subtle"
                        leftSection={<Download style={{ width: 11, height: 11 }} />}
                        component="a"
                        href={row.downloadUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        download={row.name || ''}
                        onClick={(e) => {
                          if (row.downloadUrl) {
                            e.preventDefault()
                            onOpenPdf(row.downloadUrl, row.name || '')
                          }
                        }}
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

      {/* Activity Details Popup Modal */}
      <Modal
        opened={!!selectedEncounter}
        onClose={handleCloseModal}
        title={
          <Group gap="xs">
            <BookOpen style={{ width: 14, height: 14, color: 'var(--mantine-color-text)' }} />
            <Text style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Encounter Activity Details
            </Text>
          </Group>
        }
        size="xl"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
        styles={{
          header: {
            backgroundColor: 'var(--mantine-color-body)',
            borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.08))'
          },
          content: {
            backgroundColor: 'var(--mantine-color-body)',
            border: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
            borderRadius: 'var(--mantine-radius-sm)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)'
          },
          body: { padding: '20px' }
        }}
      >
        <Stack gap="md">
          <Group
            justify="space-between"
            align="center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              padding: '8px 12px',
              borderRadius: 'var(--mantine-radius-sm)',
              border: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
            }}
          >
            <Text size="xs" color="dimmed" style={{ fontWeight: 600 }}>
              Encounter Number:
            </Text>
            <Badge size="sm" variant="filled">
              {selectedEncounter}
            </Badge>
          </Group>

          {modalLoading ? (
            <Group justify="center" align="center" style={{ minHeight: '150px' }}>
              <Stack align="center" gap="xs">
                <Loader size="sm" />
                <Text size="xs" color="dimmed">
                  Fetching activity records from database...
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
                Failed to load details
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
            <Box style={{ overflowX: 'auto' }}>
              <Table verticalSpacing={2} style={{ fontSize: '11px' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.08))' }}>
                    {['Code', 'Order', 'RA Status', 'Qty', 'Claim Gross', 'RA Gross', 'Denial'].map((h) => (
                      <Table.Th
                        key={h}
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '9.5px',
                          color: 'var(--muted)',
                          paddingTop: '4px',
                          paddingBottom: '4px'
                        }}
                      >
                        {h}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {activities.map((act, i) => (
                    <Table.Tr key={i}>
                      <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>{act.code || '-'}</Table.Td>
                      <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>{act.order_name || '-'}</Table.Td>
                      <Table.Td style={tdStyle}>
                        <Badge
                          size="xs"
                          variant="light"
                          color={
                            Number(act.activity_status_id) === 9
                              ? 'red'
                              : Number(act.activity_status_id) === 3
                                ? 'green'
                                : 'gray'
                          }
                          style={{ height: '14px', fontSize: '8px' }}
                        >
                          {act.activity_status || 'Open'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={tdStyle}>{act.qty || '1'}</Table.Td>
                      <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>
                        {rcmStrVal(act.claim_gross_amount) || '-'}
                      </Table.Td>
                      <Table.Td style={{ ...tdStyle, fontWeight: 600 }}>
                        {rcmStrVal(act.ra_gross_amount) || '-'}
                      </Table.Td>
                      <Table.Td style={{ ...tdStyle, color: 'var(--bad, #e03131)', fontWeight: 500 }}>
                        {act.claim_denial_code ? `[${act.claim_denial_code}] ` : ''}
                        {act.claim_denial_remark || '-'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )}

          <Group justify="flex-end" style={{ marginTop: '8px' }}>
            <Button size="xs" variant="outline" onClick={handleCloseModal}>
              Close Window
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
