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
  Badge,
  Modal,
  Code,
  FileButton
} from '@mantine/core'
import { Download, Upload, RefreshCw, Play, Plus, Trash2 } from 'lucide-react'
import { MODEL_PRESETS, GEMINI_MODEL_PRESETS } from '../utils/modelDefinitions'
import { validateModelId, parseAndValidateImportConfig } from '../utils/openRouterConfigHelper'
import { customFetch as fetch } from '../config/backend'

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
  compressionService?: 'ilovepdf' | 'python_extreme'
  pythonDpi?: number
  pythonQuality?: number
  pythonNoCheck?: boolean
  pythonPath?: string
}
interface OpenRouterSettings {
  apiKey: string
  model: string
  maxTokens?: number
}
interface GeminiSettings {
  apiKey: string
  model: string
  maxTokens?: number
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
    pythonPath: ''
  })
  const [openRouterSettings, setOpenRouterSettings] = useState<OpenRouterSettings>({
    apiKey: '',
    model: 'openrouter/auto',
    maxTokens: 4096
  })
  const [geminiSettings, setGeminiSettings] = useState<GeminiSettings>({
    apiKey: '',
    model: 'models/gemini-2.5-flash',
    maxTokens: 4096
  })

  const [flags, setFlags] = useState({
    loadingPdf: true,
    savingPdf: false,
    compressing: false,
    loadingOr: true,
    savingOr: false,
    testingOr: false,
    loadingGem: true,
    savingGem: false,
    testingGem: false,
    showModal: false,
    showGeminiModal: false
  })

  const [newPublicKey, setNewPublicKey] = useState('')
  const [newPrivateKey, setNewPrivateKey] = useState('')
  const [testUrl, setTestUrl] = useState('')
  const [testFileName, setTestFileName] = useState('test_compression.pdf')
  const [progressLog, setProgressLog] = useState<{ stage: string; message: string }[]>([])

  // OpenRouter Model States
  const [selectedDropdown, setSelectedDropdown] = useState('openrouter/auto')
  const [customModelId, setCustomModelId] = useState('')
  const [customModelsList, setCustomModelsList] = useState<string[]>([])
  const [testPrompt, setTestPrompt] = useState('Say "OpenRouter is working!" in a single short sentence.')
  const [testResult, setTestPromptResult] = useState('')
  const [newCustomModelInput, setNewCustomModelInput] = useState('')

  // Gemini Model States
  const [geminiDropdown, setGeminiDropdown] = useState('models/gemini-2.5-flash')
  const [geminiCustomModelId, setGeminiCustomModelId] = useState('')
  const [geminiCustomModelsList, setGeminiCustomModelsList] = useState<string[]>([])
  const [testGeminiPrompt, setTestGeminiPrompt] = useState(
    'Say "Google AI Studio is working!" in a single short sentence.'
  )
  const [testGeminiResult, setTestGeminiResult] = useState('')
  const [newGeminiCustomModelInput, setNewGeminiCustomModelInput] = useState('')

  const updateFlag = (key: keyof typeof flags, val: boolean) => setFlags((p) => ({ ...p, [key]: val }))

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
        pythonPath: data.pythonPath || ''
      })
    } catch {
      showToast('Failed to load iLovePDF settings', 'error')
    } finally {
      updateFlag('loadingPdf', false)
    }
  }

  const fetchOpenRouterSettings = async () => {
    try {
      const res = await fetch('/api/openrouter-settings')
      const data = await res.json()
      const model = data.model || 'openrouter/auto'
      const customList = data.customModels || []
      setOpenRouterSettings({ apiKey: data.apiKey || '', model, maxTokens: data.maxTokens ?? 4096 })
      setCustomModelsList(customList)
      if (setAiModel && localStorage.getItem('lifetrenz.aiProvider') !== 'gemini') setAiModel(model)
      setSelectedDropdown(
        MODEL_PRESETS.some((p) => p.value === model) || customList.includes(model) ? model : 'openrouter/auto'
      )
    } catch {
      showToast('Failed to load OpenRouter settings', 'error')
    } finally {
      updateFlag('loadingOr', false)
    }
  }

  const fetchGeminiSettings = async () => {
    try {
      const res = await fetch('/api/gemini-settings')
      const data = await res.json()
      const model = data.model || 'models/gemini-2.5-flash'
      const customList = data.customModels || []
      setGeminiSettings({ apiKey: data.apiKey || '', model, maxTokens: data.maxTokens ?? 4096 })
      setGeminiCustomModelsList(customList)
      if (setAiModel && localStorage.getItem('lifetrenz.aiProvider') === 'gemini') setAiModel(model)
      setGeminiDropdown(
        GEMINI_MODEL_PRESETS.some((p) => p.value === model) || customList.includes(model)
          ? model
          : 'models/gemini-2.5-flash'
      )
    } catch {
      showToast('Failed to load Google AI Studio settings', 'error')
    } finally {
      updateFlag('loadingGem', false)
    }
  }

  useEffect(() => {
    fetchILovePdfSettings()
    fetchOpenRouterSettings()
    fetchGeminiSettings()
  }, [])

  useEffect(() => {
    if (aiModel) {
      const activeProvider = localStorage.getItem('lifetrenz.aiProvider') || 'openrouter'
      if (activeProvider === 'gemini') {
        if (aiModel !== geminiSettings.model) {
          setGeminiSettings((p) => ({ ...p, model: aiModel }))
          setGeminiDropdown(aiModel)
        }
      } else {
        if (aiModel !== openRouterSettings.model) {
          setOpenRouterSettings((p) => ({ ...p, model: aiModel }))
          setSelectedDropdown(aiModel)
        }
      }
    }
  }, [aiModel])

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

  const saveOpenRouterConfig = async (key: string, mod: string, list: string[], max?: number) => {
    const body = {
      apiKey: key.trim(),
      model: mod.trim(),
      customModels: list,
      maxTokens: max ?? openRouterSettings.maxTokens ?? 4096
    }
    if (
      !(
        await fetch('/api/openrouter-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      ).ok
    )
      throw new Error()
    setOpenRouterSettings({ apiKey: body.apiKey, model: body.model, maxTokens: body.maxTokens })
    setCustomModelsList(list)
    if (setAiModel && localStorage.getItem('lifetrenz.aiProvider') !== 'gemini') setAiModel(body.model)
  }

  const handleSaveOpenRouterSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    let model = selectedDropdown
    if (selectedDropdown === 'custom') {
      const v = validateModelId(customModelId.trim())
      if (!v.isValid) return showToast(v.error || 'Invalid ID', 'error')
      model = customModelId.trim()
    }
    updateFlag('savingOr', true)
    try {
      await saveOpenRouterConfig(
        openRouterSettings.apiKey,
        model,
        customModelsList.includes(model) ? customModelsList : [...customModelsList, model]
      )
      showToast('OpenRouter settings saved!', 'ok')
    } catch {
      showToast('Save failed', 'error')
    } finally {
      updateFlag('savingOr', false)
    }
  }

  const saveGeminiConfig = async (key: string, mod: string, list: string[], max?: number) => {
    const body = {
      apiKey: key.trim(),
      model: mod.trim(),
      customModels: list,
      maxTokens: max ?? geminiSettings.maxTokens ?? 4096
    }
    if (
      !(
        await fetch('/api/gemini-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      ).ok
    )
      throw new Error()
    setGeminiSettings({ apiKey: body.apiKey, model: body.model, maxTokens: body.maxTokens })
    setGeminiCustomModelsList(list)
    if (setAiModel && localStorage.getItem('lifetrenz.aiProvider') === 'gemini') setAiModel(body.model)
  }

  const handleSaveGeminiSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    let model = geminiDropdown
    if (geminiDropdown === 'custom') {
      const v = validateModelId(geminiCustomModelId.trim())
      if (!v.isValid) return showToast(v.error || 'Invalid ID', 'error')
      model = geminiCustomModelId.trim()
    }
    updateFlag('savingGem', true)
    try {
      await saveGeminiConfig(
        geminiSettings.apiKey,
        model,
        geminiCustomModelsList.includes(model) ? geminiCustomModelsList : [...geminiCustomModelsList, model]
      )
      showToast('Gemini settings saved!', 'ok')
    } catch {
      showToast('Save failed', 'error')
    } finally {
      updateFlag('savingGem', false)
    }
  }

  const handleTestOpenRouter = async () => {
    if (!openRouterSettings.apiKey.trim() || !testPrompt.trim()) return showToast('Check API Key and Prompt', 'error')
    updateFlag('testingOr', true)
    setTestPromptResult('Connecting...')
    try {
      const res = await fetch('/api/gpt-automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt.trim(), provider: 'openrouter', model: openRouterSettings.model })
      })
      const data = await res.json()
      if (data.responseText) {
        setTestPromptResult(data.responseText)
        showToast('Response captured!', 'ok')
      } else throw new Error()
    } catch {
      setTestPromptResult('Error Executing Test')
    } finally {
      updateFlag('testingOr', false)
    }
  }

  const handleTestGemini = async () => {
    if (!geminiSettings.apiKey.trim() || !testGeminiPrompt.trim()) return showToast('Check API Key and Prompt', 'error')
    updateFlag('testingGem', true)
    setTestGeminiResult('Connecting...')
    try {
      const res = await fetch('/api/gpt-automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testGeminiPrompt.trim(), provider: 'gemini', model: geminiSettings.model })
      })
      const data = await res.json()
      if (data.responseText) {
        setTestGeminiResult(data.responseText)
        showToast('Response captured!', 'ok')
      } else throw new Error()
    } catch {
      setTestGeminiResult('Error Executing Test')
    } finally {
      updateFlag('testingGem', false)
    }
  }

  const handleExportAll = () => {
    const blob = new Blob(
      [
        JSON.stringify({
          ilovepdf: ilovepdfSettings,
          openrouter: { ...openRouterSettings, customModels: customModelsList },
          gemini: { ...geminiSettings, customModels: geminiCustomModelsList }
        })
      ],
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
      if (v.data.openrouter?.apiKey)
        await saveOpenRouterConfig(
          v.data.openrouter.apiKey,
          v.data.openrouter.model,
          v.data.openrouter.customModels || [],
          v.data.openrouter.maxTokens
        )
      if (v.data.gemini?.apiKey)
        await saveGeminiConfig(
          v.data.gemini.apiKey,
          v.data.gemini.model,
          v.data.gemini.customModels || [],
          v.data.gemini.maxTokens
        )
      showToast('Configuration restored!', 'ok')
      fetchILovePdfSettings()
      fetchOpenRouterSettings()
      fetchGeminiSettings()
    }
    reader.readAsText(file)
  }

  const handleSaveCustomModel = () => {
    const val = newCustomModelInput.trim()
    if (!validateModelId(val).isValid) return showToast('Invalid format', 'error')
    if (customModelsList.includes(val)) return showToast('Model already listed', 'warning')
    const nextList = [...customModelsList, val]
    setCustomModelsList(nextList)
    setSelectedDropdown(val)
    updateFlag('showModal', false)
    setNewCustomModelInput('')
    saveOpenRouterConfig(openRouterSettings.apiKey, val, nextList).then(() =>
      showToast('Custom Model registered!', 'ok')
    )
  }

  const handleSaveGeminiCustomModel = () => {
    const val = newGeminiCustomModelInput.trim()
    if (!validateModelId(val).isValid) return showToast('Invalid format', 'error')
    if (geminiCustomModelsList.includes(val)) return showToast('Model already listed', 'warning')
    const nextList = [...geminiCustomModelsList, val]
    setGeminiCustomModelsList(nextList)
    setGeminiDropdown(val)
    updateFlag('showGeminiModal', false)
    setNewGeminiCustomModelInput('')
    saveGeminiConfig(geminiSettings.apiKey, val, nextList).then(() =>
      showToast('Custom Gemini Model registered!', 'ok')
    )
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

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl" mb="xl">
        {/* OpenRouter AI pipeline configuration */}
        <Paper p="xl" bg="var(--panel-soft)">
          <Stack gap="xl">
            <Title order={3} size="h4" fw={600}>
              OpenRouter AI Pipeline
            </Title>
            {flags.loadingOr ? (
              <Text size="sm" c="dimmed">
                Loading runtime parameters...
              </Text>
            ) : (
              <Stack gap="lg" component="form" onSubmit={handleSaveOpenRouterSettings}>
                <TextInput
                  label="OpenRouter.ai API Key"
                  placeholder="sk-or-v1-..."
                  value={openRouterSettings.apiKey}
                  onChange={(e) => setOpenRouterSettings({ ...openRouterSettings, apiKey: e.target.value })}
                  size="sm"
                />
                <Select
                  label="Primary Model Router"
                  value={selectedDropdown}
                  data={[
                    ...MODEL_PRESETS.map((p) => ({ value: p.value, label: p.label })),
                    ...customModelsList
                      .filter((m) => !MODEL_PRESETS.some((p) => p.value === m))
                      .map((m) => ({ value: m, label: m })),
                    { value: 'custom', label: 'Custom Model ID...' }
                  ]}
                  onChange={(v) => (v === 'custom' ? updateFlag('showModal', true) : v && setSelectedDropdown(v))}
                  size="sm"
                />
                <NumberInput
                  label="Max Completion Tokens Cap"
                  min={1}
                  max={65536}
                  value={openRouterSettings.maxTokens || 4096}
                  onChange={(v) =>
                    setOpenRouterSettings((p) => ({ ...p, maxTokens: typeof v === 'number' ? v : 4096 }))
                  }
                  size="sm"
                />
                <Button type="submit" loading={flags.savingOr} size="sm">
                  Save OpenRouter Config
                </Button>
                <Stack gap="sm" p="md" bg="var(--panel)">
                  <Text size="sm" fw={700}>
                    Live OpenRouter Pipeline Validation
                  </Text>
                  <TextInput
                    label="Verification Prompt"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    size="xs"
                  />
                  <Button
                    onClick={handleTestOpenRouter}
                    loading={flags.testingOr}
                    variant="default"
                    size="xs"
                    leftSection={<Play size={14} />}
                  >
                    Run OpenRouter Test
                  </Button>
                  {testResult && (
                    <Code block p="xs" bg="var(--panel-soft)">
                      {testResult}
                    </Code>
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>

        {/* Gemini AI pipeline configuration */}
        <Paper p="xl" bg="var(--panel-soft)">
          <Stack gap="xl">
            <Title order={3} size="h4" fw={600}>
              Google AI Studio (Gemini) Pipeline
            </Title>
            {flags.loadingGem ? (
              <Text size="sm" c="dimmed">
                Loading Gemini parameters...
              </Text>
            ) : (
              <Stack gap="lg" component="form" onSubmit={handleSaveGeminiSettings}>
                <TextInput
                  label="Gemini API Key"
                  placeholder="AIzaSy..."
                  value={geminiSettings.apiKey}
                  onChange={(e) => setGeminiSettings({ ...geminiSettings, apiKey: e.target.value })}
                  size="sm"
                />
                <Select
                  label="Primary Model Router"
                  value={geminiDropdown}
                  data={[
                    ...GEMINI_MODEL_PRESETS.map((p) => ({ value: p.value, label: p.label })),
                    ...geminiCustomModelsList
                      .filter((m) => !GEMINI_MODEL_PRESETS.some((p) => p.value === m))
                      .map((m) => ({ value: m, label: m })),
                    { value: 'custom', label: 'Custom Model ID...' }
                  ]}
                  onChange={(v) => (v === 'custom' ? updateFlag('showGeminiModal', true) : v && setGeminiDropdown(v))}
                  size="sm"
                />
                <NumberInput
                  label="Max Completion Tokens Cap"
                  min={1}
                  max={65536}
                  value={geminiSettings.maxTokens || 4096}
                  onChange={(v) => setGeminiSettings((p) => ({ ...p, maxTokens: typeof v === 'number' ? v : 4096 }))}
                  size="sm"
                />
                <Button type="submit" loading={flags.savingGem} size="sm">
                  Save Gemini Config
                </Button>
                <Stack gap="sm" p="md" bg="var(--panel)">
                  <Text size="sm" fw={700}>
                    Live Gemini Pipeline Validation
                  </Text>
                  <TextInput
                    label="Verification Prompt"
                    value={testGeminiPrompt}
                    onChange={(e) => setTestGeminiPrompt(e.target.value)}
                    size="xs"
                  />
                  <Button
                    onClick={handleTestGemini}
                    loading={flags.testingGem}
                    variant="default"
                    size="xs"
                    leftSection={<Play size={14} />}
                  >
                    Run Gemini Test
                  </Button>
                  {testGeminiResult && (
                    <Code block p="xs" bg="var(--panel-soft)">
                      {testGeminiResult}
                    </Code>
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* iLovePDF Compactor panel */}
      <Paper p="xl" bg="var(--panel-soft)" mb="xl">
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
                  { value: 'python_extreme', label: 'Local Python Extreme Compressor (Offline/Free)' }
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
                              <Badge
                                size="xs"
                                color={
                                  k.status === 'active'
                                    ? 'green'
                                    : k.status === 'expired' || k.status === 'invalid'
                                      ? 'red'
                                      : 'gray'
                                }
                                variant="light"
                              >
                                {String(k.status).toUpperCase()}
                              </Badge>
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

      {/* Custom OpenRouter Model Modal */}
      <Modal
        opened={flags.showModal}
        onClose={() => updateFlag('showModal', false)}
        title="Register Custom Model ID"
        centered
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Input the official string ID (e.g. author/model-name or similar)
          </Text>
          <TextInput
            value={newCustomModelInput}
            onChange={(e) => setNewCustomModelInput(e.target.value)}
            placeholder="google/gemini-2.5-pro"
            size="sm"
          />
          <Group justify="flex-end" gap="xs">
            <Button onClick={() => updateFlag('showModal', false)} variant="subtle" color="gray" size="xs">
              Cancel
            </Button>
            <Button onClick={handleSaveCustomModel} size="xs">
              Save Model
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Custom Gemini Model Modal */}
      <Modal
        opened={flags.showGeminiModal}
        onClose={() => updateFlag('showGeminiModal', false)}
        title="Register Custom Gemini Model ID"
        centered
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Input the official string ID (e.g. models/gemini-2.5-pro or similar)
          </Text>
          <TextInput
            value={newGeminiCustomModelInput}
            onChange={(e) => setNewGeminiCustomModelInput(e.target.value)}
            placeholder="models/gemini-2.5-pro"
            size="sm"
          />
          <Group justify="flex-end" gap="xs">
            <Button onClick={() => updateFlag('showGeminiModal', false)} variant="subtle" color="gray" size="xs">
              Cancel
            </Button>
            <Button onClick={handleSaveGeminiCustomModel} size="xs">
              Save Model
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}
