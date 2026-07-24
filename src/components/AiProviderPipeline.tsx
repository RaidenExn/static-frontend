import React, { useState, useEffect, useCallback } from 'react'
import {
  Paper, Stack, Title, Text, TextInput, NumberInput, Select,
  Button, Code, Group, Modal
} from '@mantine/core'
import { Play } from 'lucide-react'
import { MODEL_PRESETS, GEMINI_MODEL_PRESETS, mergeModelOptions } from '../utils/modelDefinitions'
import { validateModelId } from '../utils/openRouterConfigHelper'
import { customFetch as fetch } from '../config/backend'

interface ProviderSettings {
  apiKey: string
  model: string
  maxTokens?: number
}

interface AiProviderPipelineProps {
  providerKey: 'openrouter' | 'gemini'
  showToast: (text: string, tone: string) => void
  onModelChange?: (model: string) => void
}

const PROVIDER_MAP: Record<string, { title: string; apiKeyLabel: string; apiKeyPlaceholder: string; customModelPlaceholder: string; customModelDescription: string; fetchEndpoint: string; saveEndpoint: string }> = {
  openrouter: {
    title: 'OpenRouter AI Pipeline',
    apiKeyLabel: 'OpenRouter.ai API Key',
    apiKeyPlaceholder: 'sk-or-v1-...',
    customModelPlaceholder: 'google/gemini-2.5-pro',
    customModelDescription: 'Input the official string ID (e.g. author/model-name or similar)',
    fetchEndpoint: '/api/settings/openrouter',
    saveEndpoint: '/api/settings/openrouter'
  },
  gemini: {
    title: 'Google AI Studio (Gemini) Pipeline',
    apiKeyLabel: 'Gemini API Key',
    apiKeyPlaceholder: 'AIzaSy...',
    customModelPlaceholder: 'models/gemini-2.5-pro',
    customModelDescription: 'Input the official string ID (e.g. models/gemini-2.5-pro or similar)',
    fetchEndpoint: '/api/settings/gemini',
    saveEndpoint: '/api/settings/gemini'
  }
}

export default function AiProviderPipeline({
  providerKey,
  showToast,
  onModelChange
}: AiProviderPipelineProps) {
  const info = PROVIDER_MAP[providerKey]
  const presets = providerKey === 'gemini' ? GEMINI_MODEL_PRESETS : MODEL_PRESETS
  const { title, apiKeyLabel, apiKeyPlaceholder, customModelPlaceholder, customModelDescription, fetchEndpoint, saveEndpoint } = info

  const [settings, setSettings] = useState<ProviderSettings>({ apiKey: '', model: '', maxTokens: 4096 })
  const [customModels, setCustomModels] = useState<string[]>([])
  const [selectedDropdown, setSelectedDropdown] = useState('')
  const [customModelInput, setCustomModelInput] = useState('')
  const [testPrompt, setTestPrompt] = useState(
    providerKey === 'openrouter'
      ? 'Say "OpenRouter is working!" in a single short sentence.'
      : 'Say "Google AI Studio is working!" in a single short sentence.'
  )
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(fetchEndpoint)
      const data = await res.json()
      const model = data.model || ''
      const list = data.customModels || []
      setSettings({ apiKey: data.apiKey || '', model, maxTokens: data.maxTokens ?? 4096 })
      setCustomModels(list)
      setSelectedDropdown(
        presets.some((p) => p.value === model) || list.includes(model) ? model : ''
      )
    } catch {
      showToast(`Failed to load ${title} settings`, 'error')
    } finally {
      setLoading(false)
    }
  }, [fetchEndpoint, presets, title, showToast])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const saveConfig = async (key: string, mod: string, list: string[], max?: number) => {
    const body = {
      apiKey: key.trim(),
      model: mod.trim(),
      customModels: list,
      maxTokens: max ?? settings.maxTokens ?? 4096
    }
    if (!(await fetch(saveEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })).ok) throw new Error()
    setSettings({ apiKey: body.apiKey, model: body.model, maxTokens: body.maxTokens })
    setCustomModels(list)
    onModelChange?.(body.model)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    let model = selectedDropdown
    if (selectedDropdown === 'custom') {
      const v = validateModelId(customModelInput.trim())
      if (!v.isValid) return showToast(v.error || 'Invalid ID', 'error')
      model = customModelInput.trim()
    }
    setSaving(true)
    try {
      await saveConfig(settings.apiKey, model, customModels.includes(model) ? customModels : [...customModels, model])
      showToast(`${title} settings saved!`, 'ok')
    } catch {
      showToast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!settings.apiKey.trim() || !testPrompt.trim()) return showToast('Check API Key and Prompt', 'error')
    setTesting(true)
    setTestResult('Connecting...')
    try {
      const res = await fetch('/api/gpt-automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt.trim(), provider: providerKey, model: settings.model })
      })
      const data = await res.json()
      if (data.responseText) {
        setTestResult(data.responseText)
        showToast('Response captured!', 'ok')
      } else throw new Error()
    } catch {
      setTestResult('Error Executing Test')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveCustomModel = () => {
    const val = customModelInput.trim()
    if (!validateModelId(val).isValid) return showToast('Invalid format', 'error')
    if (customModels.includes(val)) return showToast('Model already listed', 'warning')
    const nextList = [...customModels, val]
    setCustomModels(nextList)
    setSelectedDropdown(val)
    setShowModal(false)
    setCustomModelInput('')
    saveConfig(settings.apiKey, val, nextList).then(() => showToast('Custom Model registered!', 'ok'))
  }

  const mergedData = mergeModelOptions(providerKey, customModels, 'full')

  if (loading) {
    return (
      <Paper p="xl" bg="var(--panel-soft)" style={{ backdropFilter: "var(--backdrop-filter, blur(16px))", WebkitBackdropFilter: "var(--backdrop-filter, blur(16px))" }}>
        <Stack gap="xl">
          <Title order={3} size="h4" fw={600}>{title}</Title>
          <Text size="sm" c="dimmed">Loading runtime parameters...</Text>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper p="xl" bg="var(--panel-soft)" style={{ backdropFilter: "var(--backdrop-filter, blur(16px))", WebkitBackdropFilter: "var(--backdrop-filter, blur(16px))" }}>
      <Stack gap="xl">
        <Title order={3} size="h4" fw={600}>{title}</Title>
        <Stack gap="lg" component="form" onSubmit={handleSave}>
          <TextInput
            label={apiKeyLabel}
            placeholder={apiKeyPlaceholder}
            value={settings.apiKey}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            size="sm"
          />
          <Select
            label="Primary Model Router"
            value={selectedDropdown}
            data={mergedData}
            onChange={(v) => (v === 'custom' ? setShowModal(true) : v && setSelectedDropdown(v))}
            size="sm"
          />
          <NumberInput
            label="Max Completion Tokens Cap"
            min={1}
            max={65536}
            value={settings.maxTokens || 4096}
            onChange={(v) => setSettings((p) => ({ ...p, maxTokens: typeof v === 'number' ? v : 4096 }))}
            size="sm"
          />
          <Button type="submit" loading={saving} size="sm">Save {title}</Button>

          <Stack gap="sm" p="md" bg="var(--panel)">
            <Text size="sm" fw={700}>Live {title} Validation</Text>
            <TextInput
              label="Verification Prompt"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              size="xs"
            />
            <Button
              onClick={handleTest}
              loading={testing}
              variant="default"
              size="xs"
              leftSection={<Play size={14} />}
            >
              Run {providerKey === 'openrouter' ? 'OpenRouter' : 'Gemini'} Test
            </Button>
            {testResult && (
              <Code block p="xs" bg="var(--panel-soft)">{testResult}</Code>
            )}
          </Stack>
        </Stack>
      </Stack>

      <Modal opened={showModal} onClose={() => setShowModal(false)} title="Register Custom Model ID" centered>
        <Stack gap="md">
          <Text size="xs" c="dimmed">{customModelDescription}</Text>
          <TextInput
            value={customModelInput}
            onChange={(e) => setCustomModelInput(e.target.value)}
            placeholder={customModelPlaceholder}
            size="sm"
          />
          <Group justify="flex-end" gap="xs">
            <Button onClick={() => setShowModal(false)} variant="subtle" color="gray" size="xs">Cancel</Button>
            <Button onClick={handleSaveCustomModel} size="xs">Save Model</Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  )
}
