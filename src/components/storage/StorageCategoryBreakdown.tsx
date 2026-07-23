import React, { useEffect, useState, useCallback } from 'react'
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Button,
  SimpleGrid,
  Modal,
  Box,
  Progress,
  Divider,
  Switch
} from '@mantine/core'
import {
  HardDrive,
  Paperclip,
  FolderArchive,
  FileSpreadsheet,
  Database,
  Clock,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FlaskConical,
  ShieldCheck
} from 'lucide-react'
import { customFetch as fetch } from '../../config/backend'
import { ExperimentalSettingsCard } from '../settings/ExperimentalSettingsCard'



function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export interface StorageOverviewData {
  attachments: { count: number; sizeBytes: number; path: string }
  cache: { count: number; sizeBytes: number; path: string }
  excel_workshop: { count: number; sizeBytes: number; path: string }
  encounters: { count: number; sizeBytes: number; path: string }
  recents: { count: number; sizeBytes: number; path: string }
  total: { count: number; sizeBytes: number }
}

export const StorageCategoryBreakdown: React.FC = () => {
  const [overview, setOverview] = useState<StorageOverviewData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [purgingTarget, setPurgingTarget] = useState<string | null>(null)
  const [confirmModalTarget, setConfirmModalTarget] = useState<{ target: string; title: string } | null>(null)
  const [expEhrVerification, setExpEhrVerification] = useState<boolean>(true)
  const [savingExp, setSavingExp] = useState<boolean>(false)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/storage/overview')
      if (res.ok) {
        const data = await res.json()
        setOverview(data)
      }
    } catch (_) {
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchExperimentalSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/experimental-verification')
      if (res.ok) {
        const data = await res.json()
        setExpEhrVerification(data.experimentalEhrVerification !== false)
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    fetchOverview()
    fetchExperimentalSettings()
  }, [fetchOverview, fetchExperimentalSettings])

  const handleToggleExp = async (checked: boolean) => {
    setExpEhrVerification(checked)
    setSavingExp(true)
    try {
      await fetch('/api/settings/experimental-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentalEhrVerification: checked })
      })
    } catch (_) {
    } finally {
      setSavingExp(false)
    }
  }

  const handlePurge = async (target: string) => {

    setPurgingTarget(target)
    setConfirmModalTarget(null)
    try {
      const res = await fetch('/api/storage/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      })
      if (res.ok) {
        await fetchOverview()
      }
    } catch (_) {
    } finally {
      setPurgingTarget(null)
    }
  }

  if (!overview) {
    return (
      <Stack gap="md">
        <Card withBorder radius="sm" padding="sm">
          <Group justify="space-between" align="center">
            <Text size="xs" fw={700}>
              Loading Storage Breakdown...
            </Text>
            <Button variant="subtle" size="xs" loading onClick={fetchOverview} leftSection={<RefreshCw size={12} />}>
              Refresh
            </Button>
          </Group>
        </Card>
        <ExperimentalSettingsCard />
      </Stack>
    )
  }


  const categories = [
    {
      key: 'attachments',
      title: 'Attachments Folder',
      icon: Paperclip,
      color: 'blue',
      data: overview.attachments
    },
    {
      key: 'cache',
      title: 'Cache & Temporary Files',
      icon: FolderArchive,
      color: 'orange',
      data: overview.cache
    },
    {
      key: 'excel_workshop',
      title: 'Excel Workshop Files',
      icon: FileSpreadsheet,
      color: 'teal',
      data: overview.excel_workshop
    },
    {
      key: 'encounters',
      title: 'Encounters Database (zstd)',
      icon: Database,
      color: 'indigo',
      data: overview.encounters
    },
    {
      key: 'recents',
      title: 'Recent Search History',
      icon: Clock,
      color: 'violet',
      data: overview.recents
    }
  ]

  const totalSize = overview.total.sizeBytes || 1

  return (
    <Card withBorder radius="sm" padding="sm" bg="var(--mantine-color-body)" style={{ marginTop: '12px' }}>
      <Stack gap="xs">
        {/* Header */}
        <Group justify="space-between" align="center" bd="0 0 1px solid var(--line, rgba(255, 255, 255, 0.05))" pb="xs">
          <Title
            order={4}
            style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HardDrive size={14} /> System Storage Breakdown & Cleanup
          </Title>

          <Group gap="xs">
            <Button
              variant="outline"
              color="gray"
              size="xs"
              loading={loading}
              onClick={fetchOverview}
              leftSection={<RefreshCw size={12} />}
            >
              Refresh
            </Button>
            <Button
              variant="filled"
              color="red"
              size="xs"
              leftSection={<Trash2 size={12} />}
              onClick={() => setConfirmModalTarget({ target: 'all', title: 'Master System Purge' })}
            >
              Master System Purge
            </Button>
          </Group>
        </Group>

        {/* Total Summary Banner */}
        <Card withBorder radius="sm" padding="xs" bg="var(--panel-soft, rgba(255, 255, 255, 0.02))">
          <Group justify="space-between" align="center">
            <Box style={{ flex: 1 }}>
              <Group gap="xs" align="center">
                <Text size="xs" fw={700}>
                  Total Disk Consumption:
                </Text>
                <Badge color="cyan" variant="filled" size="sm">
                  {formatBytes(overview.total.sizeBytes)}
                </Badge>
                <Badge color="gray" variant="outline" size="sm">
                  {overview.total.count} Total Items
                </Badge>
              </Group>

              {/* Disk usage distribution bar */}
              <Progress.Root size="sm" mt="xs" radius="xs">
                {categories.map((cat) => {
                  const pct = Math.round((cat.data.sizeBytes / totalSize) * 100)
                  if (pct <= 0) return null
                  return <Progress.Section key={cat.key} value={pct} color={cat.color} />
                })}
              </Progress.Root>
            </Box>
          </Group>
        </Card>

        {/* Category Breakdown Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs" mt="xs">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isPurging = purgingTarget === cat.key
            return (
              <Card
                key={cat.key}
                withBorder
                radius="sm"
                padding="xs"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  borderColor: 'var(--line, rgba(255, 255, 255, 0.05))'
                }}
              >
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Group gap={6} align="center">
                      <Icon size={14} style={{ color: `var(--mantine-color-${cat.color}-filled)` }} />
                      <Text size="xs" fw={700}>
                        {cat.title}
                      </Text>
                    </Group>
                    <Badge color={cat.color} variant="light" size="xs">
                      {cat.data.count} items
                    </Badge>
                  </Group>

                  <Text size="10px" c="dimmed" style={{ fontFamily: 'monospace' }}>
                    {cat.data.path}
                  </Text>

                  <Group justify="space-between" align="center">
                    <Text size="xs" fw={800} c={cat.color}>
                      {cat.key === 'recents' ? `${cat.data.count} Records` : formatBytes(cat.data.sizeBytes)}
                    </Text>

                    <Button
                      variant="light"
                      color="red"
                      size="xs"
                      px={6}
                      loading={isPurging}
                      leftSection={<Trash2 size={10} />}
                      onClick={() => setConfirmModalTarget({ target: cat.key, title: cat.title })}
                    >
                      Purge
                    </Button>
                  </Group>
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>

        {/* Experimental Features Section */}
        <ExperimentalSettingsCard />
      </Stack>


      {/* Confirmation Modal */}
      <Modal

        opened={!!confirmModalTarget}
        onClose={() => setConfirmModalTarget(null)}
        title={
          <Group gap={6}>
            <AlertTriangle color="var(--mantine-color-red-filled)" size={16} />
            <Text fw={700} size="xs" style={{ textTransform: 'uppercase' }}>
              Confirm Storage Purge
            </Text>
          </Group>
        }
        centered
        size="sm"
      >
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Are you sure you want to purge <b>{confirmModalTarget?.title}</b>? This action will permanently remove all cached files/records in this category from disk.
          </Text>

          <Divider />

          <Group justify="flex-end" gap="xs">
            <Button variant="outline" color="gray" size="xs" onClick={() => setConfirmModalTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="filled"
              color="red"
              size="xs"
              leftSection={<Trash2 size={12} />}
              onClick={() => confirmModalTarget && handlePurge(confirmModalTarget.target)}
            >
              Confirm & Purge
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  )
}
