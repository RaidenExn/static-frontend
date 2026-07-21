import React from 'react'
import { Table, SegmentedControl, Badge, ActionIcon, Group, Text, Tooltip } from '@mantine/core'
import { Trash2 } from 'lucide-react'
import { Diagnosis } from '../../hooks/useIcdState'

interface IcdResultsTableProps {
  diagnoses: Diagnosis[]
  compact: boolean
  handleTogglePrimary: (diag: Diagnosis, targetIsPrimary: boolean) => void
  handleDeleteDiagnosis: (diag: Diagnosis) => void
}

export function IcdResultsTable({
  diagnoses,
  compact,
  handleTogglePrimary,
  handleDeleteDiagnosis
}: IcdResultsTableProps) {
  return (
    <Table horizontalSpacing="xs" verticalSpacing="xs" highlightOnHover striped style={{ minWidth: '100%' }}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: compact ? '70px' : '90px', fontSize: '11px', textTransform: 'uppercase' }}>
            Code
          </Table.Th>
          <Table.Th style={{ fontSize: '11px', textTransform: 'uppercase' }}>Description</Table.Th>
          <Table.Th style={{ width: compact ? '160px' : '180px', fontSize: '11px', textTransform: 'uppercase' }}>
            Priority
          </Table.Th>
          {!compact && (
            <Table.Th style={{ width: '80px', fontSize: '11px', textTransform: 'uppercase' }}>Audit ID</Table.Th>
          )}
          <Table.Th style={{ width: compact ? '80px' : '90px', fontSize: '11px', textTransform: 'uppercase' }}>
            Status
          </Table.Th>
          <Table.Th
            style={{
              textAlign: 'center',
              width: compact ? '40px' : '80px',
              fontSize: '11px',
              textTransform: 'uppercase'
            }}
          >
            Action
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {diagnoses.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={compact ? 5 : 6} style={{ textAlign: 'center', padding: '24px 0' }}>
              <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
                No active diagnoses.
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          diagnoses.map((diag) => {
            const isDiagPrimary = Number(diag.is_primary) === 1
            const isDiagDeleted = Number(diag.disease_addendum_status_id) === 2
            return (
              <Table.Tr key={diag.patient_diseases_id} style={{ opacity: isDiagDeleted ? 0.6 : 1 }}>
                <Table.Td style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '11px' }}>
                  {diag.icd_code}
                </Table.Td>
                <Table.Td style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                  <Tooltip label={diag.disease_desc} position="top" withArrow>
                    <Text size="xs" style={{ cursor: 'help' }}>
                      {diag.disease_desc}
                    </Text>
                  </Tooltip>
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
                    styles={{
                      root: { padding: '2px' },
                      control: { minWidth: '70px' }
                    }}
                  />
                </Table.Td>
                {!compact && (
                  <Table.Td style={{ fontSize: '11px' }}>
                    {diag.creatinguserId !== undefined ? diag.creatinguserId : '-'}
                  </Table.Td>
                )}
                <Table.Td>
                  <Badge size="xs" variant="light" color={isDiagDeleted ? 'red' : 'green'}>
                    {isDiagDeleted ? 'Deleted' : 'Active'}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Tooltip label="Delete Diagnosis" position="top" withArrow>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={() => handleDeleteDiagnosis(diag)}
                      aria-label="Delete Diagnosis"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            )
          })
        )}
      </Table.Tbody>
    </Table>
  )
}
