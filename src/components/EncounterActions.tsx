import React, { useState, useCallback } from 'react'
import {
  Button,
  Badge,
  Group,
  Text,
  SegmentedControl,
  Select,
  Popover,
  ActionIcon,
  Stack,
  Tooltip,
  TextInput
} from '@mantine/core'
import { FileText, Calendar, RefreshCw, ShieldCheck, Settings, Plus, Zap, Clipboard, RotateCcw } from 'lucide-react'
import { mergeModelOptions } from '../utils/modelDefinitions'
import { customFetch as fetch } from '../config/backend'

interface EncounterActionsProps {
  onDownloadXml: () => void
  dateEditMode: boolean
  setDateEditMode: (val: boolean) => void
  onForceReload: () => void
  aiModel?: string
  setAiModel?: (val: string) => void
  aiProvider?: string
  setAiProvider?: (val: string) => void
  onOpenCeedValidator: () => void
  onAutoPrompt?: () => void
  onCopyPrompt?: () => void
  onNewChat?: () => void
}

export default function EncounterActions({
  onDownloadXml,
  dateEditMode,
  setDateEditMode,
  onForceReload,
  aiModel = 'openrouter/auto',
  setAiModel,
  aiProvider = 'openrouter',
  setAiProvider,
  onOpenCeedValidator,
  onAutoPrompt,
  onCopyPrompt,
  onNewChat
}: EncounterActionsProps) {
  const [customModels, setCustomModels] = useState<{ openrouter: string[]; gemini: string[] }>({
    openrouter: [],
    gemini: []
  })
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customModelInput, setCustomModelInput] = useState('')

  const fetchAiModels = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-models')
      if (res.ok) {
        const data = await res.json()
        setCustomModels({
          openrouter: data.openrouter?.customModels || [],
          gemini: data.gemini?.customModels || []
        })
      }
    } catch { /* ignore fetch errors */ }
  }, [])

  const modelOptions = mergeModelOptions(
    aiProvider as 'openrouter' | 'gemini',
    aiProvider === 'gemini' ? customModels.gemini : customModels.openrouter
  )

  const handleModelChange = (val: string | null) => {
    if (val === 'custom') {
      setShowCustomInput(true)
      return
    }
    if (val && val !== aiModel) {
      setAiModel?.(val)
      fetch('/api/ai-models/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: aiProvider, model: val })
      }).catch(() => {})
    }
  }

  const handleSaveCustomModel = () => {
    const val = customModelInput.trim()
    if (!val) return
    setAiModel?.(val)
    setShowCustomInput(false)
    setCustomModelInput('')
    const key = aiProvider === 'gemini' ? 'gemini' : 'openrouter'
    setCustomModels((prev) => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key] : [...prev[key], val]
    }))
    fetch('/api/ai-models/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: aiProvider, model: val })
    }).catch(() => {})
  }

  const handleProviderChange = (val: string) => {
    if (val) {
      setAiProvider?.(val)
      const defaultModel =
        val === 'gemini'
          ? 'models/gemini-2.5-flash'
          : 'openrouter/auto'
      setAiModel?.(defaultModel)
    }
  }

  return (
    <Group gap="xs" className="actions-group-container" align="center" style={{ flexWrap: 'wrap' }}>
      {/* Download XML */}
      <Button
        id="downloadXmlButton"
        type="button"
        size="xs"
        variant="default"
        leftSection={<FileText style={{ width: 14, height: 14 }} />}
        onClick={onDownloadXml}
        aria-label="Download XML file"
      >
        Download XML
      </Button>

      {/* Edit Mode Toggle */}
      <Tooltip label="Toggle Edit Mode (reveals editable encounter and authorization dates)" position="top" withArrow>
        <Button
          id="dateEditModeButton"
          type="button"
          size="xs"
          variant={dateEditMode ? 'filled' : 'default'}
          leftSection={<Calendar style={{ width: 14, height: 14 }} />}
          onClick={() => setDateEditMode(!dateEditMode)}
          aria-label="Toggle edit mode"
        >
          Edit Mode
        </Button>
      </Tooltip>

      {/* Force Refresh */}
      <Tooltip label="Force reload from upstream (bypass local cache)" position="top" withArrow>
        <Button
          id="forceReloadButton"
          type="button"
          size="xs"
          variant="light"
          color="red"
          leftSection={<RefreshCw style={{ width: 14, height: 14 }} />}
          onClick={onForceReload}
          aria-label="Force reload from upstream"
        >
          Force Refresh
        </Button>
      </Tooltip>

      {/* CEED Validator */}
      <Tooltip label="Open CEED Rules Engine & Validation Suite" position="top" withArrow>
        <Button
          id="ceedValidatorButton"
          type="button"
          size="xs"
          variant="light"
          color="cyan"
          leftSection={<ShieldCheck style={{ width: 14, height: 14 }} />}
          onClick={onOpenCeedValidator}
          aria-label="Open CEED Validator"
        >
          CEED Validator
        </Button>
      </Tooltip>

      {/* Auto Prompt */}
      {onAutoPrompt && (
        <Tooltip label="Auto-generate AI justification for denied services and paste into comments" position="top" withArrow>
          <Button
            id="autoPromptButton"
            type="button"
            size="xs"
            variant="filled"
            color="green"
            leftSection={<Zap style={{ width: 14, height: 14 }} />}
            onClick={onAutoPrompt}
            aria-label="Auto-generate AI justification"
          >
            Auto Prompt
          </Button>
        </Tooltip>
      )}

      {/* Copy Prompt */}
      {onCopyPrompt && (
        <Tooltip label="Copy compiled clinical prompt to clipboard" position="top" withArrow>
          <Button
            id="copyPromptButton"
            type="button"
            size="xs"
            variant="default"
            leftSection={<Clipboard style={{ width: 14, height: 14 }} />}
            onClick={onCopyPrompt}
            aria-label="Copy compiled prompt"
          >
            Copy Prompt
          </Button>
        </Tooltip>
      )}

      {/* New Chat */}
      {onNewChat && (
        <Tooltip label="Clear AI chat history and start a new conversation" position="top" withArrow>
          <Button
            id="newChatButton"
            type="button"
            size="xs"
            variant="light"
            color="red"
            leftSection={<RotateCcw style={{ width: 14, height: 14 }} />}
            onClick={onNewChat}
            aria-label="Reset AI chat"
          >
            New Chat
          </Button>
        </Tooltip>
      )}

      {/* AI Provider & Model Config */}
      <Popover width={280} position="bottom-start" withArrow shadow="md" trapFocus onOpen={fetchAiModels}>
        <Popover.Target>
          <Tooltip label="Configure AI Provider & Model" position="top" withArrow>
            <ActionIcon size="xs" variant="subtle" color="blue">
              <Settings style={{ width: 13, height: 13 }} />
            </ActionIcon>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown style={{ padding: '8px', border: '1px solid var(--line)', backgroundColor: 'var(--panel)' }}>
          <Stack gap="xs">
            <Text size="11px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AI Configurations
            </Text>
            <Stack gap={2}>
              <Text size="10px" fw={600} c="dimmed">PROVIDER</Text>
              <SegmentedControl
                size="xs"
                value={aiProvider}
                onChange={handleProviderChange}
                data={[
                  { value: 'openrouter', label: 'OpenRouter' },
                  { value: 'gemini', label: 'Gemini' }
                ]}
                style={{ width: '100%' }}
              />
            </Stack>
            <Stack gap={2}>
              <Text size="10px" fw={600} c="dimmed">MODEL</Text>
              <Select
                size="xs"
                value={aiModel}
                onChange={handleModelChange}
                data={modelOptions}
                searchable
                style={{ width: '100%' }}
              />
              {showCustomInput && (
                <Group gap={4} wrap="nowrap" align="center">
                  <TextInput
                    size="xs"
                    placeholder="Enter model ID..."
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon size="sm" variant="filled" color="blue" onClick={handleSaveCustomModel}>
                    <Plus style={{ width: 12, height: 12 }} />
                  </ActionIcon>
                </Group>
              )}
            </Stack>
            <Badge size="xs" variant="light" color={aiProvider === 'gemini' ? 'purple' : 'indigo'} style={{ alignSelf: 'flex-start', fontSize: '9px', fontWeight: 800 }}>
              {aiProvider.toUpperCase()} · {aiModel.split('/').pop() || aiModel}
            </Badge>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  )
}
