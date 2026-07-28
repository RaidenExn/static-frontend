import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  ActionIcon,
  Radio,
  Switch,
  TextInput,
  NumberInput,
  Select,
  SimpleGrid,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Code,
  FileButton
} from '@mantine/core'
import { Download, Upload, RefreshCw, Plus, Play, Trash2 } from 'lucide-react'
import { parseAndValidateImportConfig } from '../utils/openRouterConfigHelper'
import { customFetch as fetch } from '../config/backend'
import { LtChip } from '../shared_elements'
import AiProviderPipeline from './AiProviderPipeline'

interface ILovePdfKey {
  publicKey: string
  privateKey?: string
  remainingFiles?: number
  remainingCredits?: number
  status?: string
}
interface ILovePdfSettings {
  defaultPublicKey: string
  region?: string
  maxPoolSize?: number
  compressionLevel?: 'recommended' | 'extreme' | 'low'
  uploadMethod?: 'auto' | 'multipart' | 'cloud_pull'
  workflowMethod?: 'auto' | 'pool_only' | 'parallel_only' | 'sequential_only'
  keys: ILovePdfKey[]
  compressionService?: 'ilovepdf' | 'python_extreme' | 'cli_extreme'
  pythonDpi?: number
  pythonQuality?: number
  pythonNoCheck?: boolean
  pythonPath?: string
  cliPdfMode?: 'low' | 'recommended' | 'extreme'
  cliPdfPath?: string
}
interface ApiPanelProps {
  showToast: (text: string, tone: string) => void
  aiModel?: string
  setAiModel?: (model: string) => void
}

export default function ApiPanel({ showToast, aiModel, setAiModel }: ApiPanelProps) {
  const [ilovepdfSettings, setIlovepdfSettings] = useState<ILovePdfSettings>({
    defaultPublicKey: '',
    region: 'fr',
    maxPoolSize: 2,
    compressionLevel: 'recommended',
    uploadMethod: 'auto',
    workflowMethod: 'auto',
    keys: [],
    compressionService: 'ilovepdf',
    pythonDpi: 150,
    pythonQuality: 50,
    pythonNoCheck: false,
    pythonPath: '',
    cliPdfMode: 'extreme',
    cliPdfPath: ''
  })
  const [flags, setFlags] = useState({
    loadingPdf: true,
    savingPdf: false,
    compressing: false
  })

  const [newPublicKey, setNewPublicKey] = useState('')
  const [newPrivateKey, setNewPrivateKey] = useState('')
  const [testUrl, setTestUrl] = useState('')
  const [testFileName, setTestFileName] = useState('test_compression.pdf')
  const [progressLog, setProgressLog] = useState<{ stage: string; message: string }[]>([])

  const updateFlag = (key: keyof typeof flags, val: boolean) => setFlags((p) => ({ ...p, [key]: val }))

  const isMac = typeof navigator !== 'undefined' && (navigator.platform.startsWith('Mac') || navigator.platform === 'MacIntel')

  const fetchILovePdfSettings = async () => {
    try {
      const res = await fetch('/api/ilovepdf-settings')
      const data = await res.json()
      setIlovepdfSettings({
        defaultPublicKey: data.defaultPublicKey || '',
        region: data.region || 'fr',
        maxPoolSize: data.maxPoolSize || 2,
        compressionLevel: data.compressionLevel || 'recommended',
        uploadMethod: data.uploadMethod || 'auto',
        workflowMethod: data.workflowMethod || 'auto',
        keys: data.keys || [],
        compressionService: data.compressionService || 'ilovepdf',
        pythonDpi: data.pythonDpi ?? 150,
        pythonQuality: data.pythonQuality ?? 50,
        pythonNoCheck: !!data.pythonNoCheck,
        pythonPath: data.pythonPath || '',
        cliPdfMode: data.cliPdfMode || 'extreme',
        cliPdfPath: data.cliPdfPath || ''
      })
    } catch {
      showToast('Failed to load iLovePDF settings', 'error')
    } finally {
      updateFlag('loadingPdf', false)
    }
  }

  useEffect(() => {
    fetchILovePdfSettings()
  }, [])

  const handleSaveILovePdfSettings = async (updated: ILovePdfSettings) => {
    updateFlag('savingPdf', true)
    try {
      if (
        !(
          await fetch('/api/ilovepdf-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          })
        ).ok
      )
        throw new Error()
      setIlovepdfSettings(updated)
    } catch {
      showToast('Failed to update iLovePDF settings', 'error')
    } finally {
      updateFlag('savingPdf', false)
    }
  }

  const handleAddKey = async () => {
    const pub = newPublicKey.trim()
    if (!pub) return showToast('Public key cannot be empty', 'error')
    if (ilovepdfSettings.keys.some((k) => k.publicKey === pub)) return showToast('Key already exists', 'warning')
    await handleSaveILovePdfSettings({
      ...ilovepdfSettings,
      defaultPublicKey: ilovepdfSettings.defaultPublicKey || pub,
      keys: [
        ...ilovepdfSettings.keys,
        {
          publicKey: pub,
          privateKey: newPrivateKey.trim() || undefined,
          remainingFiles: -1,
          remainingCredits: -1,
          status: 'unknown'
        }
      ]
    })
    setNewPublicKey('')
    setNewPrivateKey('')
    handleCheckCredits()
  }

  const handleDeleteKey = async (pubKey: string) => {
    if (!confirm('Delete this key?')) return
    const keys = ilovepdfSettings.keys.filter((k) => k.publicKey !== pubKey)
    await handleSaveILovePdfSettings({
      ...ilovepdfSettings,
      defaultPublicKey:
        ilovepdfSettings.defaultPublicKey === pubKey ? keys[0]?.publicKey || '' : ilovepdfSettings.defaultPublicKey,
      keys
    })
  }

  const handleSetDefault = async (pubKey: string) => {
    await handleSaveILovePdfSettings({ ...ilovepdfSettings, defaultPublicKey: pubKey })
    showToast('Default key updated', 'ok')
  }

  const handleCheckCredits = async () => {
    showToast('Validating keys...', 'loading')
    try {
      if ((await fetch('/api/ilovepdf-credits')).ok) {
        await fetchILovePdfSettings()
        showToast('Quotas refreshed', 'ok')
      } else throw new Error()
    } catch {
      showToast('Validation failed', 'error')
    }
  }

  const handleTestCompression = async () => {
    if (!testUrl.trim()) return showToast('Enter a PDF URL', 'error')
    updateFlag('compressing', true)
    setProgressLog([])
    try {
      const res = await fetch('/api/compress-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl: testUrl.trim(), fileName: testFileName })
      })
      if (!res.ok || !res.body) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let chunkBuffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunkBuffer += decoder.decode(value, { stream: true })
        const lines = chunkBuffer.split('\n')
        chunkBuffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const chunk = JSON.parse(line)
          setProgressLog((p) => [...p, chunk])
          if (chunk.stage === 'done') showToast('Compression complete!', 'ok')
        }
      }
      fetchILovePdfSettings()
    } catch {
      showToast('Test failed', 'error')
    } finally {
      updateFlag('compressing', false)
    }
  }

  const handleExportAll = () => {
    const blob = new Blob(
      [JSON.stringify({ ilovepdf: ilovepdfSettings })],
      { type: 'application/json' }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'api_config.json'
    a.click()
  }

  const handleImportAll = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const v = parseAndValidateImportConfig(ev.target?.result as string)
      if (!v.isValid || !v.data) return showToast('Invalid config file', 'error')
      if (v.data.ilovepdf) await handleSaveILovePdfSettings(v.data.ilovepdf)
      showToast('Configuration restored!', 'ok')
      fetchILovePdfSettings()
    }
    reader.readAsText(file)
  }

  return (
    <Box>
      <Group justify="flex-end" mb="md">
        <Group gap="xs">
          <Button onClick={handleExportAll} variant="light" color="gray" size="xs" leftSection={<Download size={14} />}>
            Export API Config
          </Button>
          <FileButton onChange={handleImportAll} accept=".json">
            {(props) => (
              <Button {...props} variant="light" color="gray" size="xs" leftSection={<Upload size={14} />}>
                Import API Config
              </Button>
            )}
          </FileButton>
        </Group>
      </Group>

      <Box mb="xl">
        <AiProviderPipeline providerKey="openrouter" showToast={showToast} />
      </Box>

      {/* iLovePDF Compactor panel */}
      <Paper p="xl" bg="var(--panel-soft)" mb="xl" style={{ backdropFilter: "var(--backdrop-filter, blur(16px))", WebkitBackdropFilter: "var(--backdrop-filter, blur(16px))" }}>
        <Stack gap="xl">
          <Group justify="space-between">
            <Title order={3} size="h4" fw={600}>
              iLovePDF Compactor
            </Title>
            <Button onClick={handleCheckCredits} size="xs" variant="default" leftSection={<RefreshCw size={14} />}>
              Refresh Quotas
            </Button>
          </Group>
          {flags.loadingPdf ? (
            <Text size="sm" c="dimmed">
              Loading compression matrix...
            </Text>
          ) : (
            <Stack gap="lg">
              <Select
                label="Compression Service Engine"
                value={ilovepdfSettings.compressionService || 'ilovepdf'}
                onChange={(val) =>
                  val && handleSaveILovePdfSettings({ ...ilovepdfSettings, compressionService: val as any })
                }
                data={[
                  { value: 'ilovepdf', label: 'iLovePDF Cloud API (External Keys Required)' },
                  { value: 'python_extreme', label: 'Local Python Extreme Compressor (Offline/Free)' },
                  { value: 'cli_extreme', label: 'macOS CLI Extreme Compressor (4-Heights SDK via Rosetta)', disabled: !isMac }
                ]}
                size="sm"
              />

              {ilovepdfSettings.compressionService === 'python_extreme' ? (
                <Stack gap="md">
                  <SimpleGrid
                    cols={{ base: 1, sm: 3 }}
                    spacing="xs"
                    p="sm"
                    bg="var(--panel)"
                    style={{ borderRadius: '8px' }}
                  >
                    <NumberInput
                      label="Target Image DPI"
                      description="Downsample resolution (72 - 300)"
                      value={ilovepdfSettings.pythonDpi ?? 150}
                      min={72}
                      max={300}
                      onChange={(v) =>
                        handleSaveILovePdfSettings({ ...ilovepdfSettings, pythonDpi: typeof v === 'number' ? v : 150 })
                      }
                      size="xs"
                    />
                    <NumberInput
                      label="JPEG Encoding Quality"
                      description="Image re-encoding ratio (1 - 95)"
                      value={ilovepdfSettings.pythonQuality ?? 50}
                      min={1}
                      max={95}
                      onChange={(v) =>
                        handleSaveILovePdfSettings({
                          ...ilovepdfSettings,
                          pythonQuality: typeof v === 'number' ? v : 50
                        })
                      }
                      size="xs"
                    />
                    <Stack gap={2} style={{ alignSelf: 'end', paddingBottom: '4px' }}>
                      <Text size="xs" fw={500} style={{ marginBottom: '2px' }}>
                        Visual Check Integrity
                      </Text>
                      <Switch
                        label={
                          ilovepdfSettings.pythonNoCheck
                            ? 'Skip Integrity Check (Faster)'
                            : 'Safe Visual Check (Recommended)'
                        }
                        checked={!ilovepdfSettings.pythonNoCheck}
                        onChange={(e) =>
                          handleSaveILovePdfSettings({ ...ilovepdfSettings, pythonNoCheck: !e.currentTarget.checked })
                        }
                        size="sm"
                      />
                    </Stack>
                  </SimpleGrid>

                  <TextInput
                    label="Custom Python Binary Executable Path"
                    placeholder="Defaults to local virtual environment venv/bin/python or standard python3"
                    description="Specify an absolute path to a custom python3 binary if you want to override the default system or local virtual environment resolution."
                    value={ilovepdfSettings.pythonPath || ''}
                    onChange={(e) => handleSaveILovePdfSettings({ ...ilovepdfSettings, pythonPath: e.target.value })}
                    size="xs"
                  />
                </Stack>
              ) : ilovepdfSettings.compressionService === 'cli_extreme' ? (
                <Stack gap="md">
                  {!isMac && (
                    <Paper p="sm" bg="var(--mantine-color-yellow-0)" style={{ borderRadius: '8px' }}>
                      <Text size="sm" c="yellow.8">
                        This compressor requires macOS with Rosetta 2. Select another engine.
                      </Text>
                    </Paper>
                  )}
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs" p="sm" bg="var(--panel)" style={{ borderRadius: '8px' }}>
                    <Select
                      label="Compression Mode"
                      value={ilovepdfSettings.cliPdfMode || 'extreme'}
                      onChange={(val) => val && handleSaveILovePdfSettings({ ...ilovepdfSettings, cliPdfMode: val as any })}
                      data={[
                        { value: 'low', label: 'Low — 75% quality, 200 DPI' },
                        { value: 'recommended', label: 'Recommended — 60% quality, 150 DPI' },
                        { value: 'extreme', label: 'Extreme — 60% quality, 72 DPI, aggressive' }
                      ]}
                      size="xs"
                    />
                    <TextInput
                      label="Custom Binary Path"
                      placeholder="Defaults to ilovepdf-cli/compress-pdf"
                      description="Specify an absolute path to a custom compress-pdf script if needed."
                      value={ilovepdfSettings.cliPdfPath || ''}
                      onChange={(e) => handleSaveILovePdfSettings({ ...ilovepdfSettings, cliPdfPath: e.target.value })}
                      size="xs"
                    />
                  </SimpleGrid>
                </Stack>
              ) : (
                <>
                  <SimpleGrid
                    cols={{ base: 1, sm: 3 }}
                    spacing="xs"
                    p="sm"
                    bg="var(--panel)"
                    style={{ borderRadius: '8px' }}
                  >
                    <Select
                      label="Compression Level"
                      value={ilovepdfSettings.compressionLevel || 'recommended'}
                      onChange={(val) =>
                        val && handleSaveILovePdfSettings({ ...ilovepdfSettings, compressionLevel: val as any })
                      }
                      data={[
                        { value: 'recommended', label: 'Recommended' },
                        { value: 'extreme', label: 'Extreme' },
                        { value: 'low', label: 'Low (High Quality)' }
                      ]}
                      size="xs"
                    />
                    <Select
                      label="Upload Method"
                      value={ilovepdfSettings.uploadMethod || 'auto'}
                      onChange={(val) =>
                        val && handleSaveILovePdfSettings({ ...ilovepdfSettings, uploadMethod: val as any })
                      }
                      data={[
                        { value: 'auto', label: 'Auto (Dual-Approach)' },
                        { value: 'multipart', label: 'Multipart (B) Only' },
                        { value: 'cloud_pull', label: 'Cloud Pull (A) Only' }
                      ]}
                      size="xs"
                    />
                    <Select
                      label="Workflow Method"
                      value={ilovepdfSettings.workflowMethod || 'auto'}
                      onChange={(val) =>
                        val && handleSaveILovePdfSettings({ ...ilovepdfSettings, workflowMethod: val as any })
                      }
                      data={[
                        { value: 'auto', label: 'Auto (Adaptive)' },
                        { value: 'pool_only', label: 'Task Pool Only' },
                        { value: 'parallel_only', label: 'Parallel Probing' },
                        { value: 'sequential_only', label: 'Sequential Loop' }
                      ]}
                      size="xs"
                    />
                  </SimpleGrid>

                  <Stack gap="xs">
                    {ilovepdfSettings.keys.length === 0 ? (
                      <Paper p="xl" bg="var(--panel)" radius="sm">
                        <Text size="xs" c="dimmed" ta="center">
                          No active cryptographic profiles saved.
                        </Text>
                      </Paper>
                    ) : (
                      ilovepdfSettings.keys.map((k, i) => (
                        <Paper key={i} p="sm" bg="var(--panel)" radius="md">
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="sm" wrap="nowrap" style={{ flexGrow: 1, minWidth: 0 }}>
                              <Radio
                                checked={ilovepdfSettings.defaultPublicKey === k.publicKey}
                                onChange={() => handleSetDefault(k.publicKey)}
                                aria-label="Set default key"
                              />
                              <Stack gap={2} style={{ minWidth: 0, flexGrow: 1 }}>
                                <Text ff="monospace" size="xs" truncate style={{ maxWidth: '100%' }}>
                                  <Text component="span" fw={600} size="xs" c="dimmed" mr={4}>
                                    PUBLIC:
                                  </Text>
                                  {k.publicKey}
                                </Text>
                                {k.privateKey && (
                                  <Text ff="monospace" size="xs" truncate style={{ maxWidth: '100%' }}>
                                    <Text component="span" fw={600} size="xs" c="dimmed" mr={4}>
                                      SECRET:
                                    </Text>
                                    {k.privateKey}
                                  </Text>
                                )}
                                <Group gap="xs">
                                  <Text size="xs" c="dimmed">
                                    Files: {k.remainingFiles === -1 ? '—' : k.remainingFiles}
                                  </Text>
                                  <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>
                                    •
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    Credits: {k.remainingCredits === -1 ? '—' : k.remainingCredits}
                                  </Text>
                                </Group>
                              </Stack>
                            </Group>
                            <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                              <LtChip
                                size="xs"
                                color={
                                  k.status === 'active'
                                    ? 'green'
                                    : k.status === 'expired' || k.status === 'invalid'
                                      ? 'red'
                                      : 'gray'
                                }
                              >
                                {String(k.status).toUpperCase()}
                              </LtChip>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                onClick={() => handleDeleteKey(k.publicKey)}
                              >
                                <Trash2 size={14} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Paper>
                      ))
                    )}
                  </Stack>

                  <SimpleGrid
                    cols={{ base: 1, sm: 3 }}
                    spacing="xs"
                    p="md"
                    bg="var(--panel)"
                    style={{ alignItems: 'end' }}
                  >
                    <TextInput
                      label="Public Key"
                      value={newPublicKey}
                      onChange={(e) => setNewPublicKey(e.target.value)}
                      size="xs"
                    />
                    <TextInput
                      label="Private Key"
                      value={newPrivateKey}
                      onChange={(e) => setNewPrivateKey(e.target.value)}
                      size="xs"
                    />
                    <Button onClick={handleAddKey} leftSection={<Plus size={14} />} variant="default" size="xs">
                      Add Profile
                    </Button>
                  </SimpleGrid>
                </>
              )}

              <Stack gap="xs" p="md" bg="var(--panel)">
                <Text size="sm" fw={700}>
                  Specular Compression Cycle Validation
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                  <TextInput
                    label="PDF Document URL"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    size="xs"
                  />
                  <TextInput
                    label="Test File Name"
                    value={testFileName}
                    onChange={(e) => setTestFileName(e.target.value)}
                    size="xs"
                  />
                </SimpleGrid>
                <Button
                  onClick={handleTestCompression}
                  loading={flags.compressing}
                  variant="default"
                  size="xs"
                  leftSection={<Play size={14} />}
                >
                  Start Test
                </Button>
                {progressLog.length > 0 && (
                  <Code block p="xs" bg="var(--panel-soft)">
                    {progressLog.map((l) => l.message).join('\n')}
                  </Code>
                )}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>


    </Box>
  )
}
