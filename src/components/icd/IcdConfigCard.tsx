import React, { useState, useEffect, useMemo } from 'react'
import { Group, Button, TextInput, Select, Stack, Text } from '@mantine/core'
import { Lock, Unlock, Settings } from 'lucide-react'
import { LtAppCard } from '../../shared_elements'

interface IcdConfigCardProps {
  compact: boolean
  addendumId: number | null
  addendumStatusText: string
  handleCloseAddendum: () => void
  handleOpenAddendum: () => void
  addendumRemark: string
  setAddendumRemark: (_v: string) => void
  creatingUserId: string
  setCreatingUserId: (_v: string) => void
  setAddendumCreatedBy: (_v: string) => void
  physicianId: number | null
  physicianName: string
  isBypassMode: boolean
  setIsBypassMode: (_v: boolean) => void
  currentOperatorId: string
}

export function IcdConfigCard({
  compact: _compact,
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
  const [isCustomId, setIsCustomId] = useState(false)
  const [customIdVal, setCustomIdVal] = useState('')

  const predefinedIds = useMemo(() => {
    return [String(physicianId || ''), '171', '163', String(currentOperatorId || '1089')]
  }, [physicianId, currentOperatorId])

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

    return rawList.reduce((acc, item) => {
      if (!acc.some((existing) => existing.value === item.value)) {
        acc.push(item)
      }
      return acc
    }, [] as { value: string; label: string }[])
  }, [isBypassMode, currentOperatorId, physicianId, physicianName])

  return (
    <LtAppCard
      title="ICD-10 Session & Addendum Configuration"
      icon={Settings}
      actions={
        addendumId ? (
          <Button
            size="xs"
            color="red"
            variant="light"
            leftSection={<Lock size={12} />}
            onClick={handleCloseAddendum}
          >
            Close Addendum
          </Button>
        ) : (
          <Button
            size="xs"
            color="teal"
            variant="filled"
            leftSection={<Unlock size={12} />}
            onClick={handleOpenAddendum}
          >
            Open Addendum
          </Button>
        )
      }
    >
      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed">
          Status: <Text span fw={700} c="cyan">{addendumStatusText || 'Not Initialized'}</Text>
        </Text>

        <TextInput
          label="Addendum Remark / Justification"
          size="xs"
          placeholder="Enter reason for modifying diagnosis..."
          value={addendumRemark}
          onChange={(e) => setAddendumRemark(e.target.value)}
        />

        <Group gap="xs" align="flex-end">
          <Select
            label="Operator / Prescribing Physician"
            size="xs"
            data={operatorOptions}
            value={isCustomId ? 'custom' : creatingUserId}
            onChange={(val) => {
              if (val === 'custom') {
                setIsCustomId(true)
                setCreatingUserId('custom')
              } else if (val) {
                setIsCustomId(false)
                setCreatingUserId(val)
                setAddendumCreatedBy(val)
              }
            }}
            style={{ flex: 1 }}
          />

          {isCustomId && (
            <TextInput
              label="Custom User ID"
              size="xs"
              placeholder="Numeric ID"
              value={customIdVal}
              onChange={(e) => {
                const text = e.target.value
                setCustomIdVal(text)
                setCreatingUserId(text)
                setAddendumCreatedBy(text)
              }}
              w={110}
            />
          )}

          <Button
            size="xs"
            variant={isBypassMode ? 'filled' : 'outline'}
            color={isBypassMode ? 'orange' : 'gray'}
            onClick={() => setIsBypassMode(!isBypassMode)}
          >
            {isBypassMode ? 'Bypass ON' : 'Bypass OFF'}
          </Button>
        </Group>
      </Stack>
    </LtAppCard>
  )
}
