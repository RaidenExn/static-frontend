import React from 'react'
import { Card, Group, Stack, Text, Title, Textarea, Button, Badge } from '@mantine/core'
import { Database, Play } from 'lucide-react'

interface LocalStorageControllerProps {
  storageInput: string
  setStorageInput: (val: string) => void
  storageLoading: boolean
  storageJob: any
  storageConcurrency: number
  setStorageConcurrency: (val: number) => void
  onStartStorageCaching: () => void
}

export const LocalStorageController: React.FC<LocalStorageControllerProps> = ({
  storageInput,
  setStorageInput,
  storageLoading,
  storageJob,
  storageConcurrency,
  setStorageConcurrency,
  onStartStorageCaching
}) => {
  const isRunning = storageJob && storageJob.status === 'running'

  return (
    <Card
      withBorder
      radius="sm"
      padding="sm"
      bg="var(--mantine-color-body)"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '400px' }}
    >
      <Stack gap="xs" style={{ flex: 1 }}>
        {/* Header Block */}
        <Group bd="0 0 1px solid var(--line, rgba(255, 255, 255, 0.05))" pb="xs" mb="sm">
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
            <Database size={14} /> Local Storage Controller
          </Title>
        </Group>

        {/* Informational Subtext */}
        <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
          Paste one or more encounter numbers here (separated by lines, spaces, or commas). Encounters will be saved as
          raw JSON files inside <code>data/encounters/</code> for offline review.
        </Text>

        {/* Input Textarea Area */}
        <Textarea
          placeholder="Paste encounter numbers here..."
          value={storageInput}
          onChange={(e) => setStorageInput(e.currentTarget.value)}
          disabled={storageLoading || isRunning}
          minRows={10}
          autosize={false}
          size="xs"
          radius="xs"
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          styles={{
            root: { flex: 1, display: 'flex', flexDirection: 'column' },
            wrapper: { flex: 1, display: 'flex', flexDirection: 'column' },
            input: { flex: 1, fontFamily: 'monospace' }
          }}
        />

        {/* Control Desk */}
        <Stack gap="xs" mt="xs">
          <Group justify="space-between" align="center">
            <Text size="xs" fw={700}>
              Threads Count:
            </Text>
            <Group gap={4}>
              {([2, 4, 8, 10] as const).map((num) => {
                const isActive = storageConcurrency === num
                return (
                  <Button
                    key={num}
                    variant={isActive ? 'filled' : 'outline'}
                    color={isActive ? 'dark' : 'gray'}
                    size="xs"
                    onClick={() => setStorageConcurrency(num)}
                    disabled={storageLoading || isRunning}
                    style={{ width: '32px', height: '24px', padding: 0 }}
                  >
                    {num}
                  </Button>
                )
              })}
            </Group>
          </Group>

          <Button
            onClick={onStartStorageCaching}
            disabled={storageLoading || isRunning}
            variant="filled"
            size="sm"
            fullWidth
            leftSection={<Play size={14} />}
          >
            {storageLoading ? 'Initializing...' : isRunning ? 'Storing In Progress' : 'Start Storage'}
          </Button>
        </Stack>
      </Stack>
    </Card>
  )
}
