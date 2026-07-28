import React from 'react'
import { Table, SegmentedControl, Text } from '@mantine/core'
import { Trash2 } from 'lucide-react'
import { Diagnosis } from '../../hooks/useIcdState'
import { LtIconButton, LtTooltip, LtChip } from '../../shared_elements'

interface IcdResultsTableProps {
  diagnoses: Diagnosis[]
  compact: boolean
  handleTogglePrimary: (_diag: Diagnosis, targetIsPrimary: boolean) => void
  handleDeleteDiagnosis: (_diag: Diagnosis) => void
}

export function IcdResultsTable({
  diagnoses,
  compact,
  handleTogglePrimary,
  handleDeleteDiagnosis
}: IcdResultsTableProps) {
  return (
    <Table horizontalSpacing="xs" verticalSpacing="xs" highlightOnHover striped w="100%" fs="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={compact ? 70 : 90} fs="xs" tt="uppercase">
            Code
          </Table.Th>
          <Table.Th fs="xs" tt="uppercase">
            Description
          </Table.Th>
          <Table.Th w={compact ? 160 : 180} fs="xs" tt="uppercase">
            Priority
          </Table.Th>
          {!compact && (
            <Table.Th w={80} fs="xs" tt="uppercase">
              Audit ID
            </Table.Th>
          )}
          <Table.Th w={compact ? 80 : 90} fs="xs" tt="uppercase">
            Status
          </Table.Th>
          <Table.Th ta="center" w={compact ? 40 : 80} fs="xs" tt="uppercase">
            Action
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {diagnoses.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={compact ? 5 : 6} ta="center" py="lg">
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                No active diagnoses.
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          diagnoses.map((diag) => {
            const isDiagPrimary = Number(diag.is_primary) === 1
            const isDiagDeleted = Number(diag.disease_addendum_status_id) === 2 || Number((diag as any).is_active) === 0
            return (
              <Table.Tr key={diag.patient_diseases_id} style={{ opacity: isDiagDeleted ? 0.5 : 1 }}>
                <Table.Td fw={800} c="cyan" fs="xs">
                  {diag.icd_code}
                </Table.Td>
                <Table.Td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                  <LtTooltip label={diag.disease_desc}>
                    <Text size="xs" style={{ cursor: 'help', textDecoration: isDiagDeleted ? 'line-through' : 'none' }}>
                      {diag.disease_desc}
                    </Text>
                  </LtTooltip>
                </Table.Td>
                <Table.Td>
                  <SegmentedControl
                    size="xs"
                    value={isDiagPrimary ? 'primary' : 'secondary'}
                    onChange={(val) => handleTogglePrimary(diag, val === 'primary')}
                    disabled={isDiagDeleted}
                    data={[
                      { label: 'Primary', value: 'primary' },
                      { label: 'Secondary', value: 'secondary' }
                    ]}
                  />
                </Table.Td>
                {!compact && (
                  <Table.Td fs="xs">
                    {diag.creatinguserId !== undefined ? diag.creatinguserId : '-'}
                  </Table.Td>
                )}
                <Table.Td>
                  <LtChip color={isDiagDeleted ? 'gray' : 'green'}>
                    {isDiagDeleted ? 'Struck Out' : 'Active'}
                  </LtChip>
                </Table.Td>
                <Table.Td ta="center">
                  <LtIconButton
                    icon={Trash2}
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={() => handleDeleteDiagnosis(diag)}
                    ariaLabel="Delete Diagnosis"
                    tooltip="Delete Diagnosis"
                  />
                </Table.Td>
              </Table.Tr>
            )
          })
        )}
      </Table.Tbody>
    </Table>
  )
}
