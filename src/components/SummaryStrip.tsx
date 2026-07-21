import React from 'react'
import { SimpleGrid, Paper, Text } from '@mantine/core'

interface SummaryStripProps {
  resolvedEncounter: string
  patientName: string
  patientAge: string
  doctorName: string
  encounterDate: string
  attachmentsCount: number
}

export default function SummaryStrip({
  resolvedEncounter,
  patientName,
  patientAge,
  doctorName,
  encounterDate,
  attachmentsCount
}: SummaryStripProps) {
  return (
    <SimpleGrid
      cols={{ base: 1, xs: 2, sm: 3, md: 6 }}
      spacing="xs"
      id="summaryStrip"
      role="region"
      aria-label="Encounter summary"
    >
      <Paper style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        <Text size="xs" c="dimmed" fw={700} lts="0.02em" tt="uppercase">
          Resolved
        </Text>
        <Text size="xs" fw={700} style={{ overflowWrap: 'anywhere' }}>
          {resolvedEncounter}
        </Text>
      </Paper>

      <Paper style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        <Text size="xs" c="dimmed" fw={700} lts="0.02em" tt="uppercase">
          Patient
        </Text>
        <Text size="xs" fw={700} style={{ overflowWrap: 'anywhere' }}>
          {patientName}
        </Text>
      </Paper>

      <Paper style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        <Text size="xs" c="dimmed" fw={700} lts="0.02em" tt="uppercase">
          Age
        </Text>
        <Text size="xs" fw={700} style={{ overflowWrap: 'anywhere' }}>
          {patientAge}
        </Text>
      </Paper>

      <Paper style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        <Text size="xs" c="dimmed" fw={700} lts="0.02em" tt="uppercase">
          Doctor
        </Text>
        <Text size="xs" fw={700} style={{ overflowWrap: 'anywhere' }}>
          {doctorName}
        </Text>
      </Paper>

      <Paper style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        <Text size="xs" c="dimmed" fw={700} lts="0.02em" tt="uppercase">
          Date
        </Text>
        <Text size="xs" fw={700} style={{ overflowWrap: 'anywhere' }}>
          {encounterDate}
        </Text>
      </Paper>

      <Paper style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        <Text size="xs" c="dimmed" fw={700} lts="0.02em" tt="uppercase">
          Attachments
        </Text>
        <Text size="xs" fw={700} style={{ overflowWrap: 'anywhere' }}>
          {attachmentsCount}
        </Text>
      </Paper>
    </SimpleGrid>
  )
}
