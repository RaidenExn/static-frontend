import React, { useMemo } from 'react'
import { Card, Group, Grid, Button, Stack, Box, Title, Text, ScrollArea, Paper } from '@mantine/core'
import { Download, Eye, Archive, RefreshCw, User, Calendar, Stethoscope, AlertCircle, Activity, ClipboardList, HeartPulse, FileCheck } from 'lucide-react'
import { useIcdState } from '../hooks/useIcdState'
import { IcdResultsTable } from './icd/IcdResultsTable'
import { IcdConfigCard } from './icd/IcdConfigCard'
import { IcdSearchForm } from './icd/IcdSearchForm'

interface SummaryPanelProps {
  active: boolean
  summaryHtml: string
  onExportHtml: () => void
  onExportPdf: () => void
  onExportZip: () => void
  showToast: (text: string, tone: 'ok' | 'error' | 'loading' | 'info' | 'warning', durationMs?: number) => void
  encounter: string
  theme: string
}

export interface ClinicalSummaryData {
  patientName: string
  gender: string
  dob: string
  date: string
  doctor: string
  mpi: string
  printedOn: string
  allergy: string
  complaints: string
  hpi: string
  familyHistory: string
  vitals: string
  diagnoses: string
  planNotes: string
  procedureOrders: string
  procedureNotes: string
}

export function parseSummaryToNativeData(htmlString: string): ClinicalSummaryData {
  const result: ClinicalSummaryData = {
    patientName: '',
    gender: '',
    dob: '',
    date: '',
    doctor: '',
    mpi: '',
    printedOn: '',
    allergy: '',
    complaints: '',
    hpi: '',
    familyHistory: '',
    vitals: '',
    diagnoses: '',
    planNotes: '',
    procedureOrders: '',
    procedureNotes: ''
  }

  if (!htmlString) return result

  const cleanText = htmlString
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<hr[^>]*>/gi, '\n---\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')

  const getMatch = (pattern: RegExp): string => {
    const match = cleanText.match(pattern)
    return match ? match[1].trim() : ''
  }

  result.patientName = getMatch(/Patient\s+Name\s*:\s*([^:\n]+?)(?=\s*Gender|\s*Date|\s*Doctor|$)/i)
  result.gender = getMatch(/Gender\s*:\s*([^:\n]+?)(?=\s*Date|\s*Doctor|\s*Printed|$)/i)
  result.dob = getMatch(/Date\s+of\s+Birth\s*:\s*([^:\n]+?)(?=\s*Date|\s*Doctor|\s*Printed|$)/i)
  result.date = getMatch(/Date\s*:\s*(\d{2}-\d{2}-\d{4}[^\n]*?)(?=\s*Doctor|\s*Printed|$)/i)
  result.doctor = getMatch(/Doctor\/Dept\s*:\s*([^:\n]+?)(?=\s*Printed|\s*MPI|$)/i)
  result.printedOn = getMatch(/Printed\s+On\s*:\s*([^:\n]+?)(?=\s*MPI|$)/i)
  result.mpi = getMatch(/MPI\s*:\s*(\d+)/i)

  result.allergy = getMatch(/Known\s+Allergy\s*:\s*([\s\S]*?)(?=Patient\s+Complaints|History\s+of|Family\s+History|Objective|Vitals|Assessment|Diagnosed|Plan|$)/i)
  result.complaints = getMatch(/Patient\s+Complaints\s*:\s*([\s\S]*?)(?=History\s+of|Family\s+History|Objective|Vitals|Assessment|Diagnosed|Plan|$)/i)
  result.hpi = getMatch(/History\s+of\s+Present\s+illness\s*\(HPI\)\s*:\s*([\s\S]*?)(?=Family\s+History|Objective|Vitals|Assessment|Diagnosed|Plan|$)/i)
  result.familyHistory = getMatch(/Family\s+History\s*:\s*([\s\S]*?)(?=Objective|Vitals|Assessment|Diagnosed|Plan|$)/i)
  result.vitals = getMatch(/Vitals\s*:\s*([\s\S]*?)(?=Assessment|Diagnosed|Plan|$)/i)
  result.diagnoses = getMatch(/Diagnosed\s+Problems\s*:\s*([\s\S]*?)(?=Plan\s+Notes|Procedure|$)/i)
  result.planNotes = getMatch(/Plan\s+Notes\s*:\s*([\s\S]*?)(?=Procedure\s+Orders|Procedure\s+Notes|$)/i)
  result.procedureOrders = getMatch(/Procedure\s+Orders\s*:\s*([\s\S]*?)(?=Procedure\s+Notes|$)/i)
  result.procedureNotes = getMatch(/Procedure\s+Notes\s*:\s*([\s\S]*?)(?=Dr\.|\b\d{2}:\d{2}\b|$)/i)

  return result
}

export default function SummaryPanel({
  active,
  summaryHtml,
  onExportHtml,
  onExportPdf,
  onExportZip,
  showToast,
  encounter
}: SummaryPanelProps) {
  const icdState = useIcdState({ encounter, active, showToast })

  const nativeData = useMemo(() => {
    return parseSummaryToNativeData(summaryHtml)
  }, [summaryHtml])

  if (!active) return null

  return (
    <Grid style={{ marginTop: '12px', marginLeft: 0, marginRight: 0 }}>
      {/* LEFT SIDE: Native React Clinical Summary View */}
      <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Consolidated Action Dock */}
        <Card withBorder radius="sm" p="xs" bg="var(--mantine-color-body)">
          <Group justify="space-between" align="center">
            <Title
              order={3}
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: 0
              }}
            >
              Summary Document Desk
            </Title>
            <Group gap="xs">
              <Button
                size="xs"
                variant="outline"
                leftSection={<Download style={{ width: 12, height: 12 }} />}
                onClick={onExportHtml}
              >
                Export HTML
              </Button>
              <Button
                size="xs"
                variant="outline"
                leftSection={<Eye style={{ width: 12, height: 12 }} />}
                onClick={onExportPdf}
              >
                View PDF Summary
              </Button>
              <Button size="xs" leftSection={<Archive style={{ width: 12, height: 12 }} />} onClick={onExportZip}>
                Export ZIP Portfolio
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Dynamic Native React Clinical Summary Card */}
        <Card
          withBorder
          padding={0}
          radius="sm"
          bg="var(--mantine-color-body)"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px', overflow: 'hidden' }}
        >
          {!summaryHtml ? (
            <Stack align="center" justify="center" p="xl" style={{ flex: 1, minHeight: '320px' }}>
              <div
                className="toast-spinner"
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid var(--mantine-color-text)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <Text size="xs" c="dimmed" fw={600} ta="center">
                Waiting for EMR Summary Document...
              </Text>
              <Text size="xs" c="dimmed" ta="center" style={{ maxWidth: '300px' }}>
                Please select or fetch an encounter above to view the clinical summary.
              </Text>
            </Stack>
          ) : (
            <Box style={{ flex: 1, overflow: 'hidden', height: '100%', minHeight: '600px' }}>
              <ScrollArea h="100%" p="md">
                <Stack gap="xs">
                  {/* Patient Metadata Card */}
                  <Paper withBorder p="xs" radius="sm">
                    <Grid bg="transparent" {...({ gutter: 'xs' } as any)}>
                      <Grid.Col span={4}>
                        <Group gap={4} wrap="nowrap">
                          <User size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                          <Text size="10px" c="dimmed" fw={700} tt="uppercase">Patient Name</Text>
                        </Group>
                        <Text size="xs" fw={800} truncate>{nativeData.patientName || 'N/A'}</Text>
                      </Grid.Col>

                      <Grid.Col span={2}>
                        <Text size="10px" c="dimmed" fw={700} tt="uppercase">Gender</Text>
                        <Text size="xs" fw={700}>{nativeData.gender || 'N/A'}</Text>
                      </Grid.Col>

                      <Grid.Col span={3}>
                        <Text size="10px" c="dimmed" fw={700} tt="uppercase">DOB / Age</Text>
                        <Text size="xs" fw={700}>{nativeData.dob || 'N/A'}</Text>
                      </Grid.Col>

                      <Grid.Col span={3}>
                        <Text size="10px" c="dimmed" fw={700} tt="uppercase">MPI</Text>
                        <Text size="xs" fw={700}>{nativeData.mpi || 'N/A'}</Text>
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <Group gap={4} wrap="nowrap">
                          <Stethoscope size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                          <Text size="10px" c="dimmed" fw={700} tt="uppercase">Doctor / Dept</Text>
                        </Group>
                        <Text size="xs" fw={700} truncate>{nativeData.doctor || 'N/A'}</Text>
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <Group gap={4} wrap="nowrap">
                          <Calendar size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                          <Text size="10px" c="dimmed" fw={700} tt="uppercase">Encounter Date</Text>
                        </Group>
                        <Text size="xs" fw={700}>{nativeData.date || 'N/A'}</Text>
                      </Grid.Col>
                    </Grid>
                  </Paper>

                  {/* Known Allergy */}
                  {nativeData.allergy && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-orange-5)' }}>
                      <Group gap={6} mb={2}>
                        <AlertCircle size={13} color="var(--mantine-color-orange-6)" />
                        <Text size="11px" fw={800} c="orange.7" tt="uppercase">Known Allergy</Text>
                      </Group>
                      <Text size="xs">{nativeData.allergy}</Text>
                    </Paper>
                  )}

                  {/* Chief Complaints */}
                  {nativeData.complaints && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-orange-5)' }}>
                      <Group gap={6} mb={2}>
                        <Activity size={13} color="var(--mantine-color-orange-6)" />
                        <Text size="11px" fw={800} c="orange.7" tt="uppercase">Chief Complaints</Text>
                      </Group>
                      <Text size="xs">{nativeData.complaints}</Text>
                    </Paper>
                  )}

                  {/* HPI */}
                  {nativeData.hpi && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-orange-5)' }}>
                      <Group gap={6} mb={2}>
                        <ClipboardList size={13} color="var(--mantine-color-orange-6)" />
                        <Text size="11px" fw={800} c="orange.7" tt="uppercase">History of Present Illness (HPI)</Text>
                      </Group>
                      <Text size="xs" style={{ whiteSpace: 'pre-line' }}>{nativeData.hpi}</Text>
                    </Paper>
                  )}

                  {/* Family History */}
                  {nativeData.familyHistory && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-orange-5)' }}>
                      <Text size="11px" fw={800} c="orange.7" tt="uppercase" mb={2}>Family History</Text>
                      <Text size="xs">{nativeData.familyHistory}</Text>
                    </Paper>
                  )}

                  {/* Vital Signs */}
                  {nativeData.vitals && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-blue-5)' }}>
                      <Group gap={6} mb={2}>
                        <HeartPulse size={13} color="var(--mantine-color-blue-6)" />
                        <Text size="11px" fw={800} c="blue.7" tt="uppercase">Vital Signs</Text>
                      </Group>
                      <Text size="xs">{nativeData.vitals}</Text>
                    </Paper>
                  )}

                  {/* Diagnosed Problems */}
                  {nativeData.diagnoses && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-red-5)' }}>
                      <Group gap={6} mb={2}>
                        <FileCheck size={13} color="var(--mantine-color-red-6)" />
                        <Text size="11px" fw={800} c="red.7" tt="uppercase">Diagnosed Problems</Text>
                      </Group>
                      <Text size="xs" fw={700}>{nativeData.diagnoses}</Text>
                    </Paper>
                  )}

                  {/* Plan Notes */}
                  {nativeData.planNotes && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-teal-5)' }}>
                      <Text size="11px" fw={800} c="teal.7" tt="uppercase" mb={2}>Plan Notes</Text>
                      <Text size="xs" style={{ whiteSpace: 'pre-line' }}>{nativeData.planNotes}</Text>
                    </Paper>
                  )}

                  {/* Procedure Orders */}
                  {nativeData.procedureOrders && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-teal-5)' }}>
                      <Text size="11px" fw={800} c="teal.7" tt="uppercase" mb={2}>Procedure Orders</Text>
                      <Text size="xs" style={{ whiteSpace: 'pre-line' }}>{nativeData.procedureOrders}</Text>
                    </Paper>
                  )}

                  {/* Procedure Notes */}
                  {nativeData.procedureNotes && (
                    <Paper withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-teal-5)' }}>
                      <Text size="11px" fw={800} c="teal.7" tt="uppercase" mb={2}>Procedure Notes</Text>
                      <Text size="xs" style={{ whiteSpace: 'pre-line' }}>{nativeData.procedureNotes}</Text>
                    </Paper>
                  )}
                </Stack>
              </ScrollArea>
            </Box>
          )}
        </Card>
      </Grid.Col>

      {/* RIGHT SIDE: ICD-10 Diagnoses, Configuration & Form Cards */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="sm" style={{ paddingBottom: '20px' }}>
          <Card withBorder radius="sm" padding="xs" bg="var(--mantine-color-body)">
            <Group justify="space-between" align="center" style={{ marginBottom: '8px' }}>
              <Title
                order={4}
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--mantine-color-text)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  margin: 0
                }}
              >
                Active ICD-10 Diagnoses
              </Title>
              <Button
                size="xs"
                variant="subtle"
                leftSection={<RefreshCw style={{ width: 11, height: 11 }} />}
                onClick={icdState.fetchDiagnoses}
                loading={icdState.loading}
                style={{ height: '20px', padding: '0 6px', fontSize: '10px' }}
              >
                Refresh List
              </Button>
            </Group>

            <Box style={{ overflowX: 'auto' }}>
              <IcdResultsTable
                diagnoses={icdState.diagnoses}
                compact={true}
                handleTogglePrimary={icdState.handleTogglePrimary}
                handleDeleteDiagnosis={icdState.handleDeleteDiagnosis}
              />
            </Box>
          </Card>

          <IcdConfigCard compact={true} {...icdState} />

          <IcdSearchForm
            compact={true}
            handleAddDiagnosis={icdState.handleAddDiagnosis}
            commentInput={icdState.commentInput}
            setCommentInput={icdState.setCommentInput}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
