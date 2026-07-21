import React, { useState } from 'react'
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  TextInput,
  Button,
  SimpleGrid,
  Table,
  Select,
  Box
} from '@mantine/core'
import { Search, Clipboard, Save } from 'lucide-react'
import { customFetch as fetch } from '../config/backend'

interface Activity {
  authOrderId: number
  cptCode: string
  description: string
  currentStatus: string
  currentStatusId: number
  rejectionAmount: number
  writeOffStatus: number
  pendingForWriteOff: number
}

interface PatientInfo {
  encounterNumber: string
  resolvedEncounter: string
  patientName: string
  patientAge: string
  doctorName: string
  encounterDate: string
}

interface BypassPanelProps {
  active: boolean
  showToast: (msg: string, type: 'ok' | 'error' | 'warning' | 'info' | 'loading') => void
}

export default function BypassPanel({ active, showToast }: BypassPanelProps) {
  const [encounterInput, setEncounterInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])

  // Track selected target status action per authOrderId
  // "Unchanged" | "Resubmit" | "Write-off" | "Close"
  const [targetActions, setTargetActions] = useState<Record<number, string>>({})

  const normalizeEncounter = (val: string) => {
    let text = val.trim().toUpperCase()
    // Normalize separator format if user pasted with hyphens instead of slashes
    if (text.includes('-ENC-')) {
      text = text.replace(/-/g, '/')
    }
    return text
  }

  const handleLoadClaim = async (overrideEncounter?: string) => {
    const enc = normalizeEncounter(overrideEncounter || encounterInput)
    if (!enc) {
      showToast('Please enter an Encounter Number.', 'warning')
      return
    }

    setLoading(true)
    setPatientInfo(null)
    setActivities([])
    setTargetActions({})
    showToast(`Loading clinical activities for ${enc}...`, 'loading')

    try {
      const res = await fetch(`/api/bypass/load?encounter=${encodeURIComponent(enc)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP error ${res.status}`)
      }

      const data = await res.json()
      setPatientInfo(data.patientInfo)
      setActivities(data.activities)
      showToast(`Loaded ${data.activities.length} clinical activities successfully.`, 'ok')
    } catch (err: any) {
      showToast(`Load failed: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePasteAndLoad = async () => {
    try {
      let text = ''
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText()
      } else {
        text =
          window.prompt(
            'Your browser restricts clipboard access on insecure (HTTP) connections. Please paste the encounter number here:'
          ) || ''
      }
      if (!text) {
        showToast('Clipboard is empty.', 'warning')
        return
      }

      const clean = text.trim()
      setEncounterInput(clean)
      handleLoadClaim(clean)
    } catch (err) {
      showToast('Failed to read clipboard contents.', 'error')
    }
  }

  const handleActionChange = (authOrderId: number, action: string) => {
    setTargetActions((prev) => ({
      ...prev,
      [authOrderId]: action
    }))
  }

  const handleSaveBypassChanges = async () => {
    if (!patientInfo) return

    // Compile active changes (filter out "Unchanged" or non-explicit)
    const changes = Object.entries(targetActions)
      .filter(([_, action]) => action !== 'Unchanged')
      .map(([authOrderId, action]) => ({
        authOrderId: Number(authOrderId),
        action // "Resubmit" | "Write-off" | "Close"
      }))

    if (changes.length === 0) {
      showToast('No status changes have been selected.', 'warning')
      return
    }

    setSaving(true)
    showToast('Saving forced transitions with absolutely zero remarks...', 'loading')

    try {
      const res = await fetch('/api/bypass/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterNumber: patientInfo.encounterNumber,
          changes
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP error ${res.status}`)
      }

      const data = await res.json()
      showToast(data.message || 'Changes saved successfully.', 'ok')

      // Reload claim to verify status changes and refresh local UI
      handleLoadClaim(patientInfo.encounterNumber)
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!active) return null

  return (
    <Card
      withBorder
      radius="sm"
      padding="sm"
      bg="var(--mantine-color-body)"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--mantine-spacing-md)'
      }}
    >
      {/* Header Block */}
      <Group justify="space-between" align="center" bd="0 0 1px solid var(--line, rgba(255, 255, 255, 0.05))" pb="xs">
        <Title
          order={3}
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: 'var(--mantine-color-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          ⚡ Force Bypass (Zero Remarks)
        </Title>
        {activities.length > 0 && (
          <Badge color="gray" variant="light" size="xs">
            {activities.length} Activities
          </Badge>
        )}
      </Group>

      {/* Description */}
      <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
        Load any claim encounter to forcefully change the state of individual clinical activities (Resubmit, Write-off,
        or Close) with <strong>absolutely zero comments, remarks, or trigger logs</strong> generated in the database.
      </Text>

      {/* Search Load Input Block */}
      <Card
        withBorder
        radius="sm"
        padding="xs"
        bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
        style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
      >
        <Group align="end" gap="xs">
          <TextInput
            label="Encounter Number"
            placeholder="e.g. MK/2026/ENC-12345"
            size="xs"
            value={encounterInput}
            onChange={(e) => setEncounterInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLoadClaim()
            }}
            style={{ flex: 1, minWidth: '240px' }}
          />

          <Group gap="xs">
            <Button
              onClick={() => handleLoadClaim()}
              disabled={loading}
              variant="filled"
              size="xs"
              leftSection={<Search size={14} />}
            >
              {loading ? 'Loading...' : 'Load Claim'}
            </Button>
            <Button
              onClick={handlePasteAndLoad}
              disabled={loading}
              variant="outline"
              color="gray"
              size="xs"
              leftSection={<Clipboard size={14} />}
            >
              Paste &amp; Load
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Patient Information Grid */}
      {patientInfo && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xs">
          <Card
            withBorder
            padding="xs"
            radius="sm"
            bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
            style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
          >
            <Text size="8px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Patient
            </Text>
            <Text size="xs" fw={700} style={{ marginTop: '2px' }}>
              {patientInfo.patientName} ({patientInfo.patientAge})
            </Text>
          </Card>
          <Card
            withBorder
            padding="xs"
            radius="sm"
            bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
            style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
          >
            <Text size="8px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Encounter Date
            </Text>
            <Text size="xs" fw={700} style={{ marginTop: '2px' }}>
              {patientInfo.encounterDate}
            </Text>
          </Card>
          <Card
            withBorder
            padding="xs"
            radius="sm"
            bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
            style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
          >
            <Text size="8px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Consulting Doctor
            </Text>
            <Text size="xs" fw={700} style={{ marginTop: '2px' }}>
              {patientInfo.doctorName}
            </Text>
          </Card>
          <Card
            withBorder
            padding="xs"
            radius="sm"
            bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
            style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
          >
            <Text size="8px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Encounter Number
            </Text>
            <Text size="xs" fw={700} style={{ marginTop: '2px', color: 'var(--mantine-color-text)' }}>
              {patientInfo.resolvedEncounter}
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Clinical Activities Table */}
      {activities.length > 0 && (
        <Card
          withBorder
          radius="sm"
          padding={0}
          bg="var(--mantine-color-body)"
          style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))', overflow: 'hidden' }}
        >
          <div style={{ overflowX: 'auto' }}>
            <Table highlightOnHover verticalSpacing={6} horizontalSpacing="xs" style={{ fontSize: '10.5px' }}>
              <Table.Thead bg="var(--panel-soft, rgba(255, 255, 255, 0.02))">
                <Table.Tr style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))' }}>
                  <Table.Th
                    style={{
                      width: '40px',
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--muted)'
                    }}
                  >
                    #
                  </Table.Th>
                  <Table.Th
                    style={{
                      width: '100px',
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--muted)'
                    }}
                  >
                    CPT Code
                  </Table.Th>
                  <Table.Th
                    style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}
                  >
                    Description
                  </Table.Th>
                  <Table.Th
                    style={{
                      width: '120px',
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      textAlign: 'right'
                    }}
                  >
                    Rejection Amount
                  </Table.Th>
                  <Table.Th
                    style={{
                      width: '140px',
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      textAlign: 'center'
                    }}
                  >
                    Current Status
                  </Table.Th>
                  <Table.Th
                    style={{
                      width: '180px',
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--muted)'
                    }}
                  >
                    Target Status
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {activities.map((act, idx) => {
                  const selectedAction = targetActions[act.authOrderId] || 'Unchanged'
                  const isModified = selectedAction !== 'Unchanged'

                  return (
                    <Table.Tr
                      key={act.authOrderId}
                      style={{
                        borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
                        background: isModified ? 'var(--panel-soft, rgba(255, 255, 255, 0.02))' : 'transparent'
                      }}
                    >
                      <Table.Td style={{ color: 'var(--muted)' }}>{idx + 1}</Table.Td>
                      <Table.Td style={{ fontWeight: 700 }}>{act.cptCode}</Table.Td>
                      <Table.Td style={{ color: 'var(--muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {act.description}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {act.rejectionAmount > 0 ? act.rejectionAmount.toFixed(2) : '0.00'}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Badge
                          variant="light"
                          color={act.currentStatus.toLowerCase().includes('written') ? 'orange' : 'gray'}
                          size="xs"
                          style={{ textTransform: 'none' }}
                        >
                          {act.currentStatus || 'Unknown'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ padding: '4px' }}>
                        <Select
                          size="xs"
                          radius="xs"
                          value={selectedAction}
                          onChange={(val) => handleActionChange(act.authOrderId, val || 'Unchanged')}
                          data={['Unchanged', 'Resubmit', 'Write-off', 'Close']}
                          styles={{
                            input: {
                              fontWeight: isModified ? 700 : 'normal',
                              color: isModified ? 'var(--mantine-color-text)' : 'inherit',
                              border: isModified
                                ? '1px solid var(--mantine-color-text)'
                                : '1px solid var(--line, rgba(255, 255, 255, 0.05))'
                            }
                          }}
                        />
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Save Button */}
      {activities.length > 0 && (
        <Group justify="flex-end">
          <Button
            onClick={handleSaveBypassChanges}
            disabled={saving || Object.values(targetActions).every((v) => v === 'Unchanged')}
            variant="filled"
            size="sm"
            leftSection={<Save size={16} />}
          >
            {saving ? 'Saving changes...' : 'Save Status Changes (Zero Remarks)'}
          </Button>
        </Group>
      )}
    </Card>
  )
}
