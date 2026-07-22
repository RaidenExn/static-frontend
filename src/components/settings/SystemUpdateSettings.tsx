import React, { useState, useEffect } from 'react'
import {
  Card,
  Text,
  Group,
  Stack,
  Box,
  Button,
  Title,
  Tooltip,
  Badge,
  Modal,
  Code,
  Divider,
  Alert,
  Switch,
  SegmentedControl,
  Collapse,
  ThemeIcon,
  Timeline
} from '@mantine/core'
import {
  RefreshCw,
  GitBranch,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Terminal,
  Activity,
  Cpu,
  BookOpen,
  ArrowRight
} from 'lucide-react'
import { customFetch as fetch } from '../../config/backend'
import { FRONTEND_VERSION } from '../../version'

interface SystemUpdateSettingsProps {
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
}

interface UpdateCheckInfo {
  currentBranch: string
  localCommit: string
  remoteCommit: string
  targetBranch: string
  localVersion: string
  remoteVersion: string
  remoteChangelog: string[]
  recentCommits: string[]
  hasUpdate: boolean
  hasUncommittedChanges: boolean
  uncommittedFiles: string[]
  settings: {
    autoUpdateEnabled: boolean
    autoUpdateChannel: 'stable' | 'dev'
  }
}

export function SystemUpdateSettings({ showToast }: SystemUpdateSettingsProps) {
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckInfo | null>(null)
  const [logs, setLogs] = useState<string>('')
  const [modalOpen, setModalOpened] = useState(false)

  // System Config states
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false)
  const [autoUpdateChannel, setAutoUpdateChannel] = useState<'stable' | 'dev'>('stable')
  const [savingConfig, setSavingConfig] = useState(false)

  const checkUpdates = async (silent = false) => {
    if (!silent) {
      setChecking(true)
      showToast('Checking for system updates...', 'loading')
    }
    try {
      const res = await fetch('/api/system/update/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`)
      }
      const data = await res.json()
      setUpdateInfo(data)

      // Align settings states with fetched backend settings
      if (data.settings) {
        setAutoUpdateEnabled(!!data.settings.autoUpdateEnabled)
        setAutoUpdateChannel(data.settings.autoUpdateChannel === 'dev' ? 'dev' : 'stable')
      }

      if (!silent) {
        if (data.hasUpdate) {
          showToast(`Updates are available! New remote version: v${data.remoteVersion}`, 'info')
        } else {
          showToast('Your system is up to date.', 'ok')
        }
      }
    } catch (err: any) {
      console.error('Update check failed:', err)
      if (!silent) {
        showToast(`Failed to check updates: ${err.message}`, 'error')
      }
    } finally {
      setChecking(false)
    }
  }

  const handleToggleAutoUpdate = async (checked: boolean) => {
    setAutoUpdateEnabled(checked)
    await saveConfig(checked, autoUpdateChannel)
  }

  const handleChannelChange = async (value: string) => {
    const channel = value === 'dev' ? 'dev' : 'stable'
    setAutoUpdateChannel(channel)
    await saveConfig(autoUpdateEnabled, channel)
    // Run an update check immediately to fetch correct channel commits/version
    setTimeout(() => checkUpdates(true), 200)
  }

  const saveConfig = async (enabled: boolean, channel: 'stable' | 'dev') => {
    setSavingConfig(true)
    try {
      const res = await fetch('/api/system/version/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoUpdateEnabled: enabled,
          autoUpdateChannel: channel
        })
      })
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`)
      }
      showToast('Updater configurations saved successfully.', 'ok')
    } catch (err: any) {
      console.error('Failed to save updater configurations:', err)
      showToast(`Failed to save config: ${err.message}`, 'error')
    } finally {
      setSavingConfig(false)
    }
  }

  const runUpdate = async (forceReset = false) => {
    setUpdating(true)
    setLogs('')
    showToast(forceReset ? 'Executing force reset and sync...' : 'Downloading and installing updates...', 'loading')
    try {
      const res = await fetch('/api/system/update/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceReset })
      })
      const data = await res.json()

      if (data.logs) {
        setLogs(data.logs)
      }

      if (!res.ok || !data.success) {
        setModalOpened(true)
        showToast(data.message || 'Update failed due to merge conflicts or environment issues.', 'error')
      } else {
        showToast('System updated and production assets rebuilt successfully!', 'ok')
        setModalOpened(false)
        await checkUpdates(true)
      }
    } catch (err: any) {
      console.error('Update failed:', err)
      setLogs(err.stack || err.message)
      setModalOpened(true)
      showToast(`Update execution failed: ${err.message}`, 'error')
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    checkUpdates(true)
  }, [])

  const getStatusContent = () => {
    if (!updateInfo) {
      return {
        text: 'Sync status pending check',
        color: 'dimmed',
        icon: <HelpCircle size={14} color="var(--mantine-color-gray-5)" />
      }
    }
    if (updateInfo.hasUncommittedChanges) {
      return {
        text: 'Uncommitted changes detected in local directory',
        color: 'orange',
        icon: <AlertTriangle size={14} color="var(--mantine-color-orange-filled)" />
      }
    }
    if (updateInfo.hasUpdate) {
      return {
        text: `Updates available on remote channel: v${updateInfo.localVersion} → v${updateInfo.remoteVersion}`,
        color: 'violet',
        icon: <ArrowUpCircle size={14} color="var(--mantine-color-violet-filled)" />
      }
    }
    return {
      text: `Running the latest version (v${updateInfo.localVersion}) on track origin`,
      color: 'green',
      icon: <CheckCircle size={14} color="var(--mantine-color-green-filled)" />
    }
  }

  const status = getStatusContent()
  const shortLocal = updateInfo?.localCommit ? updateInfo.localCommit.substring(0, 8) : '--'
  const shortRemote = updateInfo?.remoteCommit ? updateInfo.remoteCommit.substring(0, 8) : '--'

  return (
    <Box>
      <Card withBorder radius="sm" padding="md" bg="var(--panel-soft)">
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
          🔄 Enterprise Self-Update Center
        </Title>

        <Stack gap="md">
          {/* Main Dual Version and Connected Telemetry Panel */}
          <Group
            grow
            gap={0}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--mantine-radius-sm)',
              background: 'var(--panel)',
              overflow: 'hidden'
            }}
          >
            {/* Frontend Local Version */}
            <Box p="xs" style={{ textAlign: 'center' }}>
              <Text size="10px" fw={800} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Frontend Version
              </Text>
              <Group gap={4} justify="center" align="center" mt={2}>
                <Activity size={12} color="var(--mantine-color-blue-filled)" />
                <Text size="xs" fw={700}>
                  v{FRONTEND_VERSION}
                </Text>
              </Group>
            </Box>

            <Divider orientation="vertical" color="var(--line)" />

            {/* Backend Connected Version */}
            <Box p="xs" style={{ textAlign: 'center' }}>
              <Text size="10px" fw={800} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Connected Backend
              </Text>
              <Group gap={4} justify="center" align="center" mt={2}>
                <Cpu size={12} color="var(--mantine-color-green-filled)" />
                <Text size="xs" fw={700}>
                  {updateInfo?.localVersion ? `v${updateInfo.localVersion}` : '--'}
                </Text>
              </Group>
            </Box>

            <Divider orientation="vertical" color="var(--line)" />

            {/* Active Channel Track */}
            <Box p="xs" style={{ textAlign: 'center' }}>
              <Text size="10px" fw={800} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Update Channel
              </Text>
              <Badge
                size="xs"
                variant="light"
                color={autoUpdateChannel === 'dev' ? 'orange' : 'teal'}
                mt={2}
                styles={{ label: { textTransform: 'uppercase', fontWeight: 800 } }}
              >
                {autoUpdateChannel === 'dev' ? 'Development' : 'Stable'}
              </Badge>
            </Box>
          </Group>

          {/* Integrated Telemetry Row (Git References) */}
          <Group
            grow
            gap={0}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--mantine-radius-sm)',
              background: 'var(--panel)',
              overflow: 'hidden'
            }}
          >
            {/* Active Branch */}
            <Box p="xs" style={{ textAlign: 'center' }}>
              <Text size="10px" fw={800} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tracking Branch
              </Text>
              <Group gap={4} justify="center" align="center" mt={2}>
                <GitBranch size={12} color="var(--mantine-color-blue-filled)" />
                <Text size="xs" fw={700}>
                  {updateInfo?.currentBranch || '--'}
                </Text>
              </Group>
            </Box>

            <Divider orientation="vertical" color="var(--line)" />

            {/* Local Commit */}
            <Box p="xs" style={{ textAlign: 'center' }}>
              <Text size="10px" fw={800} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Local Commit
              </Text>
              <Text size="xs" fw={700} style={{ fontFamily: 'monospace' }} mt={2}>
                {shortLocal}
              </Text>
            </Box>

            <Divider orientation="vertical" color="var(--line)" />

            {/* Remote Commit */}
            <Box p="xs" style={{ textAlign: 'center' }}>
              <Text size="10px" fw={800} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Remote Commit
              </Text>
              <Text
                size="xs"
                fw={700}
                style={{ fontFamily: 'monospace' }}
                mt={2}
                c={updateInfo?.hasUpdate ? 'violet' : 'inherit'}
              >
                {shortRemote}
              </Text>
            </Box>
          </Group>

          {/* Status Message Panel */}
          <Group
            justify="space-between"
            align="center"
            p="sm"
            bg="var(--panel)"
            style={{ border: '1px solid var(--line)', borderRadius: 'var(--mantine-radius-sm)' }}
          >
            <Box>
              <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Update Status
              </Text>
              <Text size="xs" c="dimmed" mt={1}>
                {status.text}
              </Text>
            </Box>
            <Group gap="xs">{status.icon}</Group>
          </Group>

          {/* Auto-Updating Configurations Panel */}
          <Card withBorder radius="sm" padding="sm" bg="var(--panel)">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Box>
                  <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Background Auto-Update
                  </Text>
                  <Text size="10px" c="dimmed">
                    Periodically polls, fetches, and auto-installs during off-peak downtime (2 AM - 4 AM).
                  </Text>
                </Box>
                <Switch
                  checked={autoUpdateEnabled}
                  onChange={(event) => handleToggleAutoUpdate(event.currentTarget.checked)}
                  disabled={savingConfig || updating}
                  size="sm"
                  thumbIcon={
                    autoUpdateEnabled ? (
                      <CheckCircle size={10} color="var(--mantine-color-teal-filled)" />
                    ) : undefined
                  }
                />
              </Group>

              <Divider color="var(--line)" />

              <Group justify="space-between" align="center">
                <Box>
                  <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Release Channel track
                  </Text>
                  <Text size="10px" c="dimmed">
                    Select the update track channel you wish to fetch and install updates from.
                  </Text>
                </Box>
                <SegmentedControl
                  value={autoUpdateChannel}
                  onChange={handleChannelChange}
                  disabled={savingConfig || updating}
                  size="xs"
                  data={[
                    { label: 'Stable', value: 'stable' },
                    { label: 'Development', value: 'dev' }
                  ]}
                  styles={{
                    root: { border: '1px solid var(--line)' }
                  }}
                />
              </Group>
            </Stack>
          </Card>

          {/* Dynamic Release Notes Accordion */}
          <Collapse expanded={!!updateInfo && (updateInfo.remoteChangelog.length > 0 || updateInfo.recentCommits.length > 0)}>
            <Card withBorder radius="sm" padding="sm" bg="var(--panel)" style={{ borderStyle: 'dashed' }}>
              <Stack gap="xs">
                <Group gap={6}>
                  <BookOpen size={13} color="var(--mantine-color-violet-filled)" />
                  <Text size="xs" fw={800} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    What's New in this Release
                  </Text>
                </Group>
                
                {updateInfo && updateInfo.remoteChangelog.length > 0 ? (
                  <Timeline active={99} bulletSize={14} lineWidth={1.5} color="violet" mt="xs">
                    {updateInfo.remoteChangelog.map((item, index) => (
                      <Timeline.Item key={index} bullet={<ArrowRight size={8} />}>
                        <Text size="xs" fw={600}>
                          {item}
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  updateInfo && updateInfo.recentCommits.length > 0 && (
                    <Box mt="xs">
                      <Text size="10px" fw={700} c="dimmed" mb={4} style={{ textTransform: 'uppercase' }}>
                        Recent Commit logs:
                      </Text>
                      <Stack gap={4}>
                        {updateInfo.recentCommits.map((item, index) => (
                          <Group key={index} gap="xs" wrap="nowrap" align="flex-start">
                            <Text size="10px" fw={700} style={{ fontFamily: 'monospace' }} c="violet">
                              {item.substring(0, 7)}
                            </Text>
                            <Text size="xs" fw={500} style={{ flex: 1 }}>
                              {item.substring(8)}
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  )
                )}
              </Stack>
            </Card>
          </Collapse>

          {/* Action Buttons */}
          <Group gap="xs" grow>
            <Tooltip label="Check GitHub repository for latest commits" openDelay={0} closeDelay={0}>
              <Button
                variant="outline"
                color="gray"
                size="xs"
                onClick={() => checkUpdates()}
                disabled={checking || updating}
                leftSection={<RefreshCw size={14} className={checking ? 'animate-spin' : ''} />}
                style={{ fontWeight: 600 }}
              >
                {checking ? 'Checking...' : 'Check For Updates'}
              </Button>
            </Tooltip>

            <Tooltip label="Fetch changes, update submodules, and compile frontend production bundle" openDelay={0} closeDelay={0}>
              <Button
                variant="filled"
                color="violet"
                size="xs"
                onClick={() => runUpdate(false)}
                disabled={checking || updating || !updateInfo?.hasUpdate}
                leftSection={<ArrowUpCircle size={14} />}
                style={{ fontWeight: 600 }}
              >
                {updating ? 'Installing...' : 'Install Update'}
              </Button>
            </Tooltip>
          </Group>

          {/* Real-time Inline Logs console frame (Only shown during active compilations) */}
          <Collapse expanded={updating || (logs.length > 0 && !modalOpen)}>
            <Box>
              <Group gap={6} mb={6}>
                <Terminal size={12} color="var(--mantine-color-violet-filled)" />
                <Text size="10px" fw={800} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Execution Progress Terminal
                </Text>
              </Group>
              <Code
                block
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  background: 'var(--panel-dark, #0c0d10)',
                  color: '#e4e4e7',
                  border: '1px solid var(--line)',
                  padding: '10px',
                  borderRadius: 'var(--mantine-radius-sm)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {logs || '[Self-Updater] Initiating update pipeline...'}
              </Code>
            </Box>
          </Collapse>
        </Stack>
      </Card>

      {/* Force Reset & Conflict Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <AlertTriangle size={18} color="var(--mantine-color-red-filled)" />
            <Text fw={800} size="sm" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              System Update Conflict
            </Text>
          </Group>
        }
        size="lg"
        centered
        radius="sm"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3
        }}
      >
        <Stack gap="md">
          <Alert color="red" radius="sm" icon={<AlertTriangle size={16} />}>
            <Text size="xs" fw={600}>
              The automatic update process failed or was blocked. This usually happens if you have uncommitted changes
              or conflicting modifications in your local portal files.
            </Text>
            <Text size="xs" fw={700} mt="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚠️ Warning: Hard reset will discard all local changes permanently and sync to tracking branch.
            </Text>
          </Alert>

          <Box>
            <Text size="xs" fw={700} mb={6} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Command Execution Logs:
            </Text>
            <Code
              block
              style={{
                maxHeight: '250px',
                overflowY: 'auto',
                fontSize: '11px',
                fontFamily: 'monospace',
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                padding: '12px',
                borderRadius: 'var(--mantine-radius-sm)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {logs}
            </Code>
          </Box>

          <Group justify="flex-end" gap="xs" mt="sm">
            <Button variant="outline" color="gray" size="xs" onClick={() => setModalOpened(false)} disabled={updating}>
              Cancel
            </Button>
            <Button
              variant="filled"
              color="red"
              size="xs"
              onClick={() => runUpdate(true)}
              disabled={updating}
              leftSection={<AlertTriangle size={14} />}
              style={{ fontWeight: 600 }}
            >
              {updating ? 'Syncing...' : `Force Reset & Sync to ${autoUpdateChannel === 'dev' ? 'dev' : 'main'}`}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
