import React from 'react'
import { Card, Group, Stack, Text, Progress, SimpleGrid, Table, Box } from '@mantine/core'
import { BarChart3, Database, Trash2, ShieldAlert } from 'lucide-react'
import { LtMetricStatGrid, LtTooltip, LtButton, LtTableCard, LtChip } from '../shared_elements'

interface StorageJobMonitorProps {
  storedCount: number
  storageJob: any
  onClearStorageJob: () => void
  onCleanStorage: (options?: { encounter?: string; olderThanDays?: number }) => Promise<void>
}

export const StorageJobMonitor: React.FC<StorageJobMonitorProps> = ({
  storedCount,
  storageJob,
  onClearStorageJob,
  onCleanStorage
}) => {
  return (
    <Card
      withBorder
      radius="sm"
      padding="sm"
      bg="var(--mantine-color-body)"
      mih={400}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Header section */}
      <Group justify="space-between" align="center" bd="0 0 1px solid var(--mantine-color-default-border)" pb="xs" mb="sm">
        <Group gap={6} align="center">
          <BarChart3 size={14} />
          <Text size="xs" fw={800} tt="uppercase" lts="0.5px">
            Storage Job Monitor
          </Text>
        </Group>
        <LtChip>
          Total Stored: {storedCount} encounters
        </LtChip>
      </Group>

      {/* Main Body */}
      {!storageJob ? (
        <Box
          mih={200}
          p="md"
          ta="center"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)'
          }}
        >
          <Database size={36} style={{ color: 'var(--mantine-color-dimmed)', marginBottom: '8px', opacity: 0.6 }} />
          <Text size="xs" fw={700} mb={4}>
            No Active Storage Job Running
          </Text>
          <Text size="xs" c="dimmed">
            Paste encounter numbers on the left and click "Start Storage" to monitor progress in real-time.
          </Text>
        </Box>
      ) : (
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group justify="space-between" align="center">
            <Text
              size="xs"
              fw={700}
              c={storageJob.status === 'running' ? undefined : 'green'}
            >
              Status: {storageJob.status.toUpperCase()}
            </Text>
            <Text size="xs" fw={700}>
              {storageJob.done} / {storageJob.total} ({Math.round((storageJob.done / storageJob.total) * 100) || 0}%)
            </Text>
          </Group>

          <Progress
            value={(storageJob.done / storageJob.total) * 100}
            size="xs"
            color="orange"
            animated={storageJob.status === 'running'}
          />

          <LtMetricStatGrid
            stats={[
              { label: 'Total', value: storageJob.total },
              { label: 'Success', value: storageJob.success, color: 'green' },
              { label: 'Failed', value: storageJob.failed, color: 'red' },
              { label: 'Skipped', value: storageJob.skipped }
            ]}
          />

          <Stack gap={4} mt="xs" style={{ flex: 1 }}>
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700}>
                Processed Encounters
              </Text>
              {storageJob.status !== 'running' && (
                <LtButton
                  variant="subtle"
                  color="gray"
                  onClick={onClearStorageJob}
                  style={{ height: 'auto', padding: 0 }}
                >
                  Clear Job
                </LtButton>
              )}
            </Group>

            <LtTableCard maxHeight={180} scrollable>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th fs="9px" fw={700} tt="uppercase" c="var(--muted)">
                    Encounter
                  </Table.Th>
                  <Table.Th fs="9px" fw={700} tt="uppercase" c="var(--muted)">
                    Patient Name
                  </Table.Th>
                  <Table.Th fs="9px" fw={700} tt="uppercase" c="var(--muted)">
                    Status
                  </Table.Th>
                  <Table.Th fs="9px" fw={700} tt="uppercase" c="var(--muted)" ta="right">
                    Time
                  </Table.Th>
                  <Table.Th fs="9px" fw={700} tt="uppercase" c="var(--muted)" ta="right">
                    Size
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {storageJob.rows
                  .slice()
                  .reverse()
                  .map((row: any, idx: number) => (
                    <Table.Tr key={idx} bd="0 0 1px solid var(--mantine-color-default-border)">
                      <Table.Td fw={700}>
                        <Group gap={6} align="center" wrap="nowrap">
                          <LtTooltip label={row.ok ? 'Success' : `Failed: ${row.error || 'Unknown'}`}>
                            <Box
                              w={6}
                              h={6}
                              bg={row.ok ? 'green' : 'red'}
                              style={{ borderRadius: '50%', flexShrink: 0, display: 'inline-block' }}
                            />
                          </LtTooltip>
                          <span>{row.encounter}</span>
                        </Group>
                      </Table.Td>
                      <Table.Td c="var(--muted)">{row.patientName || '-'}</Table.Td>
                      <Table.Td>
                        {row.ok ? (
                          <Text size="10px" fw={700} c="green">
                            {row.cached ? 'Skipped' : 'Stored'}
                          </Text>
                        ) : (
                          <LtTooltip label={row.error || 'Failed'}>
                            <Text size="10px" fw={700} c="red">
                              Error
                            </Text>
                          </LtTooltip>
                        )}
                      </Table.Td>
                      <Table.Td ta="right" c="var(--muted)">
                        {row.ms ? `${row.ms}ms` : '-'}
                      </Table.Td>
                      <Table.Td ta="right" c="var(--muted)">
                        {row.bytes ? `${(row.bytes / 1024).toFixed(1)} KB` : '-'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </LtTableCard>
          </Stack>
        </Stack>
      )}

      {/* Fast Cache Cleanup Controls */}
      <Box pt="xs" mt="auto" bd="1px 0 0 0 solid var(--mantine-color-default-border)">
        <Group gap={6} align="center" mb="xs">
          <Trash2 size={12} />
          <Text size="xs" fw={800} tt="uppercase" lts="0.5px">
            Fast Cache Cleanup
          </Text>
        </Group>
        <SimpleGrid cols={2} spacing="xs">
          <LtButton onClick={() => onCleanStorage({ olderThanDays: 20 })} variant="outline" color="gray">
            Clear Encounters &gt; 20 Days
          </LtButton>
          <LtButton
            onClick={() => onCleanStorage()}
            variant="filled"
            color="red"
            leftIcon={<ShieldAlert size={14} />}
          >
            Purge Encounters DB
          </LtButton>
        </SimpleGrid>
      </Box>
    </Card>
  )
}
