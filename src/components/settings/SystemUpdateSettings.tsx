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
  Alert
} from '@mantine/core'
import { RefreshCw, GitBranch, ArrowUpCircle, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react'
import { customFetch as fetch } from '../../config/backend'

interface SystemUpdateSettingsProps {
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
}

interface UpdateCheckInfo {
  currentBranch: string
  localCommit: string
  remoteCommit: string
  hasUpdate: boolean
  hasUncommittedChanges: boolean
  uncommittedFiles: string[]
}

export function SystemUpdateSettings({ showToast }: SystemUpdateSettingsProps) {
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckInfo | null>(null)
  const [logs, setLogs] = useState<string>('')
  const [modalOpen, setModalOpened] = useState(false)

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
      if (!silent) {
        if (data.hasUpdate) {
          showToast('Updates are available on the main branch!', 'info')
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

  const runUpdate = async (forceReset = false) => {
    setUpdating(true)
    showToast(forceReset ? 'Executing force reset and sync...' : 'Downloading and installing updates...', 'loading')
    try {
      const res = await fetch('/api/system/update/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceReset })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setLogs(data.logs || data.message || 'Unknown update execution error')
        setModalOpened(true)
        showToast(data.message || 'Update failed due to merge conflicts or environment issues.', 'error')
      } else {
        showToast('System updated and Docker container rebuilt successfully!', 'ok')
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
    // Initial silent check
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
        text: 'Uncommitted changes detected in workspace',
        color: 'orange',
        icon: <AlertTriangle size={14} color="var(--mantine-color-orange-filled)" />
      }
    }
    if (updateInfo.hasUpdate) {
      return {
        text: 'Updates available on the remote main branch',
        color: 'violet',
        icon: <ArrowUpCircle size={14} color="var(--mantine-color-violet-filled)" />
      }
    }
    return {
      text: 'System is running the latest main version',
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
          🔄 System Self-Update Center
        </Title>

        <Stack gap="sm">
          {/* Integrated Telemetry Row */}
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
            {/* Branch */}
            <Box p="xs" style={{ textAlign: 'center' }}>
              <Text size="10px" fw={800} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Branch
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

          {/* Action Buttons */}
          <Group gap="xs" grow mt="xs">
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

            <Tooltip label="Fetch changes from main branch and build Docker image" openDelay={0} closeDelay={0}>
              <Button
                variant="filled"
                color="violet"
                size="xs"
                onClick={() => runUpdate(false)}
                disabled={checking || updating || !updateInfo?.hasUpdate}
                leftSection={<ArrowUpCircle size={14} />}
                style={{ fontWeight: 600 }}
              >
                {updating ? 'Updating...' : 'Install Update'}
              </Button>
            </Tooltip>
          </Group>
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
              ⚠️ Warning: Hard reset will discard all local changes permanently and sync to main branch.
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
              {updating ? 'Syncing...' : 'Force Reset & Sync to Main'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
