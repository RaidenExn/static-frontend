import React from 'react'
import { Card, Group, Stack, Text, Title, Badge, Progress, SimpleGrid, Table, Button, Box, Tooltip } from '@mantine/core'
import { BarChart3, Database, Trash2, ShieldAlert } from 'lucide-react'

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
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}
    >
      {/* Header section */}
      <Group
        justify="space-between"
        align="center"
        bd="0 0 1px solid var(--line, rgba(255, 255, 255, 0.05))"
        pb="xs"
        mb="sm"
      >
        <Title
          order={3}
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: 'var(--mantine-color-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <BarChart3 size={14} /> Storage Job Monitor
        </Title>
        <Badge color="gray" variant="light" size="xs">
          Total Stored: {storedCount} encounters
        </Badge>
      </Group>

      {/* Main Body */}
      {!storageJob ? (
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            border: '1px dashed var(--line, rgba(255, 255, 255, 0.05))',
            borderRadius: 'var(--mantine-radius-sm)',
            padding: 'var(--mantine-spacing-md)',
            textAlign: 'center'
          }}
        >
          <Database
            size={36}
            style={{ color: 'var(--mantine-color-dimmed)', marginBottom: 'var(--mantine-spacing-xs)', opacity: 0.6 }}
          />
          <Text size="xs" fw={700} style={{ marginBottom: '4px' }}>
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
              style={{
                color:
                  storageJob.status === 'running' ? 'var(--mantine-color-text)' : 'var(--mantine-color-green-filled)'
              }}
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
            color="dark"
            animated={storageJob.status === 'running'}
          />

          <SimpleGrid cols={4} spacing="xs" mt="xs">
            <Card
              withBorder
              padding="xs"
              radius="sm"
              bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
              style={{ textAlign: 'center', borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
            >
              <Text size="md" fw={800}>
                {storageJob.total}
              </Text>
              <Text size="9px" c="dimmed" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Total
              </Text>
            </Card>
            <Card
              withBorder
              padding="xs"
              radius="sm"
              bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
              style={{ textAlign: 'center', borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
            >
              <Text size="md" fw={800} c="green">
                {storageJob.success}
              </Text>
              <Text size="9px" c="dimmed" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Success
              </Text>
            </Card>
            <Card
              withBorder
              padding="xs"
              radius="sm"
              bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
              style={{ textAlign: 'center', borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
            >
              <Text size="md" fw={800} c="red">
                {storageJob.failed}
              </Text>
              <Text size="9px" c="dimmed" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Failed
              </Text>
            </Card>
            <Card
              withBorder
              padding="xs"
              radius="sm"
              bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
              style={{ textAlign: 'center', borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
            >
              <Text size="md" fw={800}>
                {storageJob.skipped}
              </Text>
              <Text size="9px" c="dimmed" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Skipped
              </Text>
            </Card>
          </SimpleGrid>

          <Stack gap={4} style={{ flex: 1, marginTop: '10px' }}>
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700}>
                Processed Encounters
              </Text>
              {storageJob.status !== 'running' && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={onClearStorageJob}
                  style={{ height: 'auto', padding: 0 }}
                >
                  Clear Job
                </Button>
              )}
            </Group>

            <Card
              withBorder
              radius="sm"
              padding={0}
              style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))', overflow: 'hidden' }}
            >
              <Box style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <Table highlightOnHover verticalSpacing={4} horizontalSpacing="xs" style={{ fontSize: '10.5px' }}>
                  <Table.Thead bg="var(--panel-soft, rgba(255, 255, 255, 0.02))">
                    <Table.Tr style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))' }}>
                      <Table.Th
                        style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}
                      >
                        Encounter
                      </Table.Th>
                      <Table.Th
                        style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}
                      >
                        Patient Name
                      </Table.Th>
                      <Table.Th
                        style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}
                      >
                        Status
                      </Table.Th>
                      <Table.Th
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          textAlign: 'right'
                        }}
                      >
                        Time
                      </Table.Th>
                      <Table.Th
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          textAlign: 'right'
                        }}
                      >
                        Size
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {storageJob.rows
                      .slice()
                      .reverse()
                      .map((row: any, idx: number) => (
                        <Table.Tr
                          key={idx}
                          style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))' }}
                        >
                          <Table.Td style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Tooltip label={row.ok ? 'Success' : `Failed: ${row.error || 'Unknown'}`} openDelay={0} closeDelay={0}>
                              <div
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: row.ok
                                    ? 'var(--mantine-color-green-filled)'
                                    : 'var(--mantine-color-red-filled)',
                                  display: 'inline-block',
                                  flexShrink: 0
                                }}
                              />
                            </Tooltip>
                            <span>{row.encounter}</span>
                          </Table.Td>
                          <Table.Td style={{ color: 'var(--muted)' }}>{row.patientName || '-'}</Table.Td>
                          <Table.Td>
                            {row.ok ? (
                              <Text size="10px" fw={700} c="green">
                                {row.cached ? 'Skipped' : 'Stored'}
                              </Text>
                            ) : (
                              <Tooltip label={row.error || 'Failed'} openDelay={0} closeDelay={0}>
                                <Text size="10px" fw={700} c="red">
                                  Error
                                </Text>
                              </Tooltip>
                            )}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right', color: 'var(--muted)' }}>
                            {row.ms ? `${row.ms}ms` : '-'}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right', color: 'var(--muted)' }}>
                            {row.bytes ? `${(row.bytes / 1024).toFixed(1)} KB` : '-'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </Card>
          </Stack>
        </Stack>
      )}

      {/* Fast Cache Cleanup Controls */}
      <Box
        style={{
          marginTop: 'auto',
          paddingTop: 'var(--mantine-spacing-sm)',
          borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
        }}
      >
        <Title
          order={4}
          style={{
            margin: '0 0 var(--mantine-spacing-xs) 0',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--mantine-color-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <Trash2 size={12} /> Fast Cache Cleanup
        </Title>
        <SimpleGrid cols={2} spacing="xs">
          <Button onClick={() => onCleanStorage({ olderThanDays: 20 })} variant="outline" color="gray" size="xs">
            Clear Encounters &gt; 20 Days
          </Button>
          <Button
            onClick={() => onCleanStorage()}
            variant="filled"
            color="red"
            size="xs"
            leftSection={<ShieldAlert size={14} />}
          >
            Purge Encounters DB
          </Button>
        </SimpleGrid>
      </Box>
    </Card>
  )
}
