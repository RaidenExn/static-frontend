import React from 'react'
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  TextInput,
  Button,
  Progress,
  Switch,
  Badge,
  Tooltip,
  Box,
  Loader
} from '@mantine/core'
import { Search, Radio, ArrowRight, RefreshCw, Power } from 'lucide-react'
import { useNetworkDiscovery } from '../hooks/useNetworkDiscovery'
import { DiscoveredServer } from '../services/discoveryService'

interface NetworkDiscoveryCardProps {
  onSelectServer: (ip: string) => void
  compact?: boolean
}

export default function NetworkDiscoveryCard({ onSelectServer, compact = false }: NetworkDiscoveryCardProps) {
  const {
    subnetInput,
    setSubnetInput,
    isScanning,
    checkedCount,
    totalCount,
    progressPercent,
    currentIp,
    discoveredServers,
    autoscanEnabled,
    toggleAutoscan,
    startScan,
    stopScan,
    initialValidating
  } = useNetworkDiscovery()

  const handleScanToggle = () => {
    if (isScanning) {
      stopScan()
    } else {
      startScan()
    }
  }

  return (
    <Card
      withBorder
      radius="sm"
      padding={compact ? 'sm' : 'md'}
      bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs" align="center">
            <Radio size={16} color="var(--mantine-color-blue-filled)" />
            <Title
              order={4}
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--mantine-color-text)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: 0
              }}
            >
              LAN Network Discovery
            </Title>
          </Group>
          <Group gap="sm" align="center">
            <Switch
              label="Auto-Scan on Startup"
              checked={autoscanEnabled}
              onChange={(e) => toggleAutoscan(e.currentTarget.checked)}
              size="xs"
            />
          </Group>
        </Group>

        <Group align="flex-end" gap="xs">
          <TextInput
            label="Subnet Prefix"
            placeholder="192.168.10"
            value={subnetInput}
            onChange={(e) => setSubnetInput(e.target.value)}
            disabled={isScanning}
            size="xs"
            style={{ flex: 1 }}
          />
          <Tooltip label={isScanning ? 'Halt network scan' : 'Scan subnet for active LT-Local servers'} openDelay={0} closeDelay={0}>
            <Button
              size="xs"
              color={isScanning ? 'red' : 'blue'}
              onClick={handleScanToggle}
              leftSection={isScanning ? <Power size={14} /> : <Search size={14} />}
            >
              {isScanning ? 'STOP SCAN' : 'SCAN NETWORK'}
            </Button>
          </Tooltip>
        </Group>

        {/* Live Progress Bar when Scanning */}
        {isScanning && (
          <Box p="xs" bg="var(--panel, rgba(0, 0, 0, 0.2))" style={{ borderRadius: 'var(--mantine-radius-sm)', border: '1px solid var(--line)' }}>
            <Stack gap={4}>
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
                  <Text size="xs" fw={700}>
                    Scanning {subnetInput}.x...
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {checkedCount} / {totalCount} checked ({progressPercent}%)
                </Text>
              </Group>
              <Progress value={progressPercent} size="xs" color="blue" animated />
              <Group justify="space-between" align="center" mt={2}>
                <Text size="xs" c="dimmed">
                  Checking IP: <Text span fw={600} c="var(--mantine-color-text)">{currentIp}</Text>
                </Text>
                <Badge size="xs" variant="light" color="blue">
                  Found: {discoveredServers.length}
                </Badge>
              </Group>
            </Stack>
          </Box>
        )}

        {/* Initial Validating Spinner */}
        {initialValidating && !isScanning && (
          <Group gap="xs" justify="center" p="xs">
            <Loader size="xs" color="blue" />
            <Text size="xs" c="dimmed">
              Probing cached network servers...
            </Text>
          </Group>
        )}

        {/* Discovered Servers Grid */}
        {!initialValidating && discoveredServers.length > 0 && (
          <Box mt="xs">
            <Group justify="space-between" align="center" mb="xs">
              <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Discovered Servers ({discoveredServers.length})
              </Text>
            </Group>
            <Stack gap="xs">
              {discoveredServers.map((server: DiscoveredServer) => (
                <Card
                  key={server.ip}
                  withBorder
                  padding="xs"
                  radius="xs"
                  bg="var(--panel, rgba(0, 0, 0, 0.15))"
                  style={{ border: '1px solid var(--line)' }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-green-filled)' }} />
                      <Box>
                        <Group gap="xs" align="center">
                          <Text size="sm" fw={800} style={{ fontFamily: 'monospace' }}>
                            {server.ip}
                          </Text>
                          <Badge size="xs" variant="outline" color="green">
                            Beacon OK
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          Port 8788 • Last seen: {server.lastSeen}
                        </Text>
                      </Box>
                    </Group>
                    <Button
                      size="xs"
                      color="green"
                      variant="light"
                      rightSection={<ArrowRight size={14} />}
                      onClick={() => onSelectServer(server.ip)}
                    >
                      CONNECT
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* No Servers Found State */}
        {!initialValidating && !isScanning && discoveredServers.length === 0 && (
          <Box p="xs" style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">
              No active LT-Local servers detected on {subnetInput}.x subnet. Make sure your server is running and click <strong>SCAN NETWORK</strong>.
            </Text>
          </Box>
        )}
      </Stack>
    </Card>
  )
}
