import React from 'react'
import { SegmentedControl, Button, Card, Title, Group, Text, Box, Stack } from '@mantine/core'

interface AdvancedPromptSettingsProps {
  wsStatus: 'connected' | 'disconnected' | 'connecting'
  theme: string
  toggleTheme: () => void
  setTheme: (theme: string) => void
  onStopServer: () => void
}

export function AdvancedPromptSettings({
  wsStatus,
  theme,
  toggleTheme,
  setTheme,
  onStopServer
}: AdvancedPromptSettingsProps) {
  return (
    <Card
      withBorder
      radius="sm"
      padding="md"
      bg="var(--panel-soft)"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '300px'
      }}
    >
      <Box>
        <Title
          order={3}
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: 'var(--mantine-color-text)',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          ⚡ Advanced Prompt & Environment
        </Title>

        <Stack gap="sm">
          {/* WS & Theme section */}
          <Group
            justify="space-between"
            align="center"
            p="sm"
            bg="var(--panel)"
            style={{ border: '1px solid var(--line)', borderRadius: 'var(--mantine-radius-sm)' }}
          >
            <Box>
              <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                WS Stream Feed
              </Text>
              <Text size="xs" c="dimmed">
                Realtime log connection
              </Text>
            </Box>
            <Group gap="xs" align="center">
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor:
                    wsStatus === 'connected'
                      ? 'var(--mantine-color-green-filled)'
                      : wsStatus === 'connecting'
                        ? 'var(--mantine-color-yellow-filled)'
                        : 'var(--mantine-color-red-filled)',
                  display: 'inline-block'
                }}
              />
              <Text size="xs" fw="bold">
                {wsStatus.toUpperCase()}
              </Text>
            </Group>
          </Group>

          {/* Theme switcher */}
          <Box
            p="sm"
            bg="var(--panel)"
            style={{ border: '1px solid var(--line)', borderRadius: 'var(--mantine-radius-sm)' }}
          >
            <Box mb="xs">
              <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active System Theme
              </Text>
              <Text size="xs" c="dimmed">
                Raw DOM sub-millisecond swapping
              </Text>
            </Box>

            <SegmentedControl
              value={theme}
              onChange={(val) => setTheme(val)}
              data={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' }
              ]}
              fullWidth
              styles={{
                root: {
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--mantine-radius-sm)',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                },
                control: {
                  border: 'none'
                },
                indicator: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--mantine-radius-sm)'
                }
              }}
            />
          </Box>
        </Stack>
      </Box>

      {/* Hard Stop server section */}
      <Group
        justify="space-between"
        align="center"
        mt="xl"
        style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}
      >
        <Box>
          <Text size="xs" fw={700} c="red" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Shutdown Portal Server
          </Text>
          <Text size="xs" c="dimmed">
            Terminates local node processes
          </Text>
        </Box>
        <Button
          onClick={onStopServer}
          color="red"
          variant="light"
          size="xs"
          style={{ height: '30px', fontWeight: 'bold' }}
        >
          🛑 Stop Server
        </Button>
      </Group>
    </Card>
  )
}
