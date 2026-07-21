import React, { useState, useEffect, useMemo } from 'react'
import { Card, Title, Group, Button, TextInput, Grid, Select, Stack, Box, Text } from '@mantine/core'
import { Lock, Unlock } from 'lucide-react'

interface IcdConfigCardProps {
  compact: boolean
  addendumId: number | null
  addendumStatusText: string
  handleCloseAddendum: () => void
  handleOpenAddendum: () => void
  addendumRemark: string
  setAddendumRemark: (v: string) => void
  creatingUserId: string
  setCreatingUserId: (v: string) => void
  setAddendumCreatedBy: (v: string) => void
  physicianId: number | null
  physicianName: string
  isBypassMode: boolean
  setIsBypassMode: (v: boolean) => void
  currentOperatorId: string
}

export function IcdConfigCard({
  compact,
  addendumId,
  addendumStatusText,
  handleCloseAddendum,
  handleOpenAddendum,
  addendumRemark,
  setAddendumRemark,
  creatingUserId,
  setCreatingUserId,
  setAddendumCreatedBy,
  physicianId,
  physicianName,
  isBypassMode,
  setIsBypassMode,
  currentOperatorId
}: IcdConfigCardProps) {
  // Local state to manage custom operator ID entry
  const [isCustomId, setIsCustomId] = useState(false)
  const [customIdVal, setCustomIdVal] = useState('')

  // Memoize predefined operator IDs to prevent unnecessary effect triggers
  const predefinedIds = useMemo(() => {
    return [String(physicianId || ''), '171', '163', String(currentOperatorId || '1089')]
  }, [physicianId, currentOperatorId])

  // Automatically track and toggle custom ID state if loaded/restored ID is not in predefined list
  useEffect(() => {
    if (creatingUserId && !predefinedIds.includes(creatingUserId) && creatingUserId !== 'custom') {
      setIsCustomId(true)
      setCustomIdVal(creatingUserId)
    } else if (creatingUserId === 'custom') {
      setIsCustomId(true)
    } else {
      setIsCustomId(false)
    }
  }, [creatingUserId, predefinedIds])

  // Build a dynamically deduplicated and correctly sorted operator options list
  const operatorOptions = useMemo(() => {
    if (isBypassMode) {
      if (!physicianId) return []
      return [{ value: String(physicianId), label: `${physicianName || 'Physician'} (${physicianId})` }]
    }

    const rawList = [
      { value: String(currentOperatorId || '1089'), label: `Portal Operator (${currentOperatorId || '1089'})` },
      ...(physicianId
        ? [{ value: String(physicianId), label: `${physicianName || 'Physician'} (${physicianId})` }]
        : []),
      { value: '171', label: 'Dr. Hina Kausar (171)' },
      { value: '163', label: 'Dr. Shukla (163)' },
      { value: 'custom', label: 'Custom Operator ID...' }
    ]

    // Deduplicate to guarantee 100% unique select options (prevents Mantine runtime crashes)
    return rawList.reduce((acc, item) => {
      if (!acc.some((existing) => existing.value === item.value)) {
        acc.push(item)
      }
      return acc
    }, [] as { value: string; label: string }[])
  }, [isBypassMode, currentOperatorId, physicianId, physicianName])

  return (
    <Card
      withBorder
      radius="sm"
      padding="xs"
      style={{
        backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
        backdropFilter: 'var(--backdrop-filter, blur(16px))',
        WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
        border: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
      }}
    >
      <Title
        order={4}
        style={{
          fontSize: '11px',
          fontWeight: 800,
          color: 'var(--mantine-color-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '10px'
        }}
      >
        Clinical & Addendum Configuration
      </Title>

      <Stack gap="xs">
        <Card
          withBorder
          padding="xs"
          radius="sm"
          style={{
            backgroundColor: 'var(--panel, rgba(255, 255, 255, 0.04))',
            borderStyle: 'dashed'
          }}
        >
          <Group justify="space-between" align="center">
            <Box>
              <Text size="9px" color="dimmed" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                Addendum State
              </Text>
              <Text size="sm" style={{ fontWeight: 800, color: addendumId ? 'var(--good, #2b8a3e)' : 'inherit' }}>
                {addendumStatusText}
              </Text>
            </Box>
            {addendumId ? (
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<Lock style={{ width: 12, height: 12 }} />}
                onClick={handleCloseAddendum}
              >
                Close Addendum
              </Button>
            ) : (
              <Button
                size="xs"
                variant="outline"
                leftSection={<Unlock style={{ width: 12, height: 12 }} />}
                onClick={handleOpenAddendum}
              >
                Open Addendum
              </Button>
            )}
          </Group>
        </Card>

        <TextInput
          label="Addendum Remarks"
          size="xs"
          placeholder="Enter reason or remark for addendum..."
          value={addendumRemark}
          onChange={(e) => setAddendumRemark(e.target.value)}
          styles={{
            label: {
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '3px'
            }
          }}
        />

        <Grid {...({ gutter: 'xs' } as any)}>
          <Grid.Col span={6}>
            <Select
              label="Operator Spoof / Auditing"
              size="xs"
              disabled={isBypassMode}
              value={isBypassMode ? String(physicianId || '') : (isCustomId ? 'custom' : creatingUserId)}
              onChange={(val) => {
                if (val) {
                  if (val === 'custom') {
                    setIsCustomId(true)
                    setCreatingUserId('custom')
                    setAddendumCreatedBy('custom')
                  } else {
                    setIsCustomId(false)
                    setCreatingUserId(val)
                    setAddendumCreatedBy(val)
                  }
                }
              }}
              data={operatorOptions}
              styles={{
                label: {
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: '3px'
                }
              }}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Bypass Lock"
              size="xs"
              value={isBypassMode ? 'direct' : 'addendum'}
              onChange={(val) => {
                const isDirect = val === 'direct'
                setIsBypassMode(isDirect)
                if (isDirect && physicianId) {
                  setCreatingUserId(String(physicianId))
                  setAddendumCreatedBy(String(physicianId))
                } else if (!isDirect) {
                  // Revert back to the logged-in current operator ID upon Standard Addendum toggle
                  setCreatingUserId(String(currentOperatorId || '1089'))
                  setAddendumCreatedBy(String(currentOperatorId || '1089'))
                }
              }}
              data={[
                { value: 'addendum', label: 'Standard Addendum' },
                { value: 'direct', label: 'Direct Bypass Write' }
              ]}
              styles={{
                label: {
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: '3px'
                }
              }}
            />
          </Grid.Col>
        </Grid>

        {isCustomId && !isBypassMode && (
          <TextInput
            label="Custom Operator ID"
            size="xs"
            placeholder="Enter custom operator numeric ID..."
            value={customIdVal}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '') // Keep numeric values only
              setCustomIdVal(digitsOnly)
              setCreatingUserId(digitsOnly)
              setAddendumCreatedBy(digitsOnly)
            }}
            styles={{
              label: {
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '3px'
              }
            }}
          />
        )}
      </Stack>
    </Card>
  )
}
