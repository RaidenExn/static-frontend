import React, { useState, useCallback } from 'react'
import {
  Group,
  Text,
  SegmentedControl,
  Select,
  Popover,
  Stack,
  TextInput
} from '@mantine/core'
import { LtButton, LtIconButton, LtTooltip, LtChip } from '../shared_elements'
import { FileText, Calendar, RefreshCw, ShieldCheck, Settings, Plus, Zap, Clipboard, RotateCcw } from 'lucide-react'
import { mergeModelOptions } from '../utils/modelDefinitions'
import { customFetch as fetch } from '../config/backend'

interface EncounterActionsProps {
  onDownloadXml: () => void
  dateEditMode: boolean
  setDateEditMode: (_val: boolean) => void
  onForceReload: () => void
  aiModel?: string
  setAiModel?: (_val: string) => void
  aiProvider?: string
  setAiProvider?: (_val: string) => void
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
    <Group gap="xs" align="center" wrap="wrap">
      {/* Download XML */}
      <LtButton
        id="downloadXmlButton"
        type="button"
        variant="default"
        leftIcon={<FileText size={14} />}
        onClick={onDownloadXml}
        ariaLabel="Download XML file"
      >
        Download XML
      </LtButton>

      {/* Edit Mode Toggle */}
      <LtButton
        id="dateEditModeButton"
        type="button"
        variant={dateEditMode ? 'filled' : 'default'}
        leftIcon={<Calendar size={14} />}
        onClick={() => setDateEditMode(!dateEditMode)}
        tooltip="Toggle Edit Mode (reveals editable encounter and authorization dates)"
        ariaLabel="Toggle edit mode"
      >
        Edit Mode
      </LtButton>

      {/* Force Refresh */}
      <LtButton
        id="forceReloadButton"
        type="button"
        variant="light"
        color="red"
        leftIcon={<RefreshCw size={14} />}
        onClick={onForceReload}
        tooltip="Force reload from upstream (bypass local cache)"
        ariaLabel="Force reload from upstream"
      >
        Force Refresh
      </LtButton>

      {/* CEED Validator */}
      <LtButton
        id="ceedValidatorButton"
        type="button"
        variant="light"
        color="cyan"
        leftIcon={<ShieldCheck size={14} />}
        onClick={onOpenCeedValidator}
        tooltip="Open CEED Rules Engine & Validation Suite"
        ariaLabel="Open CEED Validator"
      >
        CEED Validator
      </LtButton>

      {/* Auto Prompt */}
      {onAutoPrompt && (
        <LtButton
          id="autoPromptButton"
          type="button"
          color="green"
          leftIcon={<Zap size={14} />}
          onClick={onAutoPrompt}
          tooltip="Auto-generate AI justification for denied services and paste into comments"
          ariaLabel="Auto-generate AI justification"
        >
          Auto Prompt
        </LtButton>
      )}

      {/* Copy Prompt */}
      {onCopyPrompt && (
        <LtButton
          id="copyPromptButton"
          type="button"
          variant="default"
          leftIcon={<Clipboard size={14} />}
          onClick={onCopyPrompt}
          tooltip="Copy compiled clinical prompt to clipboard"
          ariaLabel="Copy compiled prompt"
        >
          Copy Prompt
        </LtButton>
      )}

      {/* New Chat */}
      {onNewChat && (
        <LtButton
          id="newChatButton"
          type="button"
          variant="light"
          color="red"
          leftIcon={<RotateCcw size={14} />}
          onClick={onNewChat}
          tooltip="Clear AI chat history and start a new conversation"
          ariaLabel="Reset AI chat"
        >
          New Chat
        </LtButton>
      )}

      {/* AI Provider & Model Config */}
      <Popover width={280} position="bottom-start" withArrow shadow="md" trapFocus onOpen={fetchAiModels}>
        <Popover.Target>
          <LtIconButton
            icon={Settings}
            iconSize={13}
            variant="subtle"
            color="blue"
            tooltip="Configure AI Provider & Model"
          />
        </Popover.Target>
        <Popover.Dropdown p="xs">
          <Stack gap="xs">
            <Text size="11px" fw={700} c="dimmed" tt="uppercase" lts="0.5px">
              AI Configurations
            </Text>
            <Stack gap={2}>
              <Text size="10px" fw={600} c="dimmed">
                PROVIDER
              </Text>
              <SegmentedControl
                size="xs"
                value={aiProvider}
                onChange={handleProviderChange}
                data={[
                  { value: 'openrouter', label: 'OpenRouter' },
                  { value: 'gemini', label: 'Gemini' }
                ]}
                fullWidth
              />
            </Stack>
            <Stack gap={2}>
              <Text size="10px" fw={600} c="dimmed">
                MODEL
              </Text>
              <Select
                size="xs"
                value={aiModel}
                onChange={handleModelChange}
                data={modelOptions}
                searchable
                w="100%"
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
                  <LtIconButton
                    icon={Plus}
                    iconSize={12}
                    size="sm"
                    variant="filled"
                    color="blue"
                    onClick={handleSaveCustomModel}
                  />
                </Group>
              )}
            </Stack>
            <LtChip
              size="xs"
              color={aiProvider === 'gemini' ? 'purple' : 'indigo'}
              fw={800}
              style={{ alignSelf: 'flex-start', fontSize: 9 }}
            >
              {aiProvider.toUpperCase()} · {aiModel.split('/').pop() || aiModel}
            </LtChip>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  )
}
