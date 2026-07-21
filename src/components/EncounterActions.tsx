import React from 'react'
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
  Tooltip
} from '@mantine/core'
import { FileText, Calendar, RefreshCw, Copy, Trash2, Zap, ShieldCheck, Settings } from 'lucide-react'
import { MODEL_PRESETS, GEMINI_MODEL_PRESETS, APPLE_MODEL_PRESETS } from '../utils/modelDefinitions'

interface EncounterActionsProps {
  onDownloadXml: () => void
  dateEditMode: boolean
  setDateEditMode: (val: boolean) => void
  onForceReload: () => void
  onCopyPrompt: () => void
  onNewChat?: () => void
  aiModel?: string
  setAiModel?: (val: string) => void
  aiProvider?: string
  setAiProvider?: (val: string) => void
  chatInputCount?: number
  currentModelInUse?: string | null
  chatStats?: {
    latencyMs: number
    attempts: number
    usage: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    } | null
  } | null
  onAutoPrompt: () => void
  onOpenCeedValidator: () => void
}

export default function EncounterActions({
  onDownloadXml,
  dateEditMode,
  setDateEditMode,
  onForceReload,
  onCopyPrompt,
  onNewChat,
  aiModel = 'openrouter/auto',
  setAiModel,
  aiProvider = 'openrouter',
  setAiProvider,
  chatInputCount = 0,
  currentModelInUse = null,
  chatStats = null,
  onAutoPrompt,
  onOpenCeedValidator
}: EncounterActionsProps) {
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

      {/* Copy Prompt */}
      <Tooltip label="Copy the current prompt to your clipboard" position="top" withArrow>
        <Button
          id="copyPromptButton"
          type="button"
          size="xs"
          variant="light"
          color="orange"
          leftSection={<Copy style={{ width: 14, height: 14 }} />}
          onClick={onCopyPrompt}
          aria-label="Copy prompt to clipboard"
        >
          Copy Prompt
        </Button>
      </Tooltip>

      {/* Unified Compact AI Orchestrator & Telemetry Bar */}
      {onNewChat && (
        <Group
          gap={0}
          wrap="nowrap"
          style={{
            border: '1px solid var(--line)',
            backgroundColor: 'var(--panel-soft, rgba(0, 0, 0, 0.02))',
            borderRadius: 'var(--mantine-radius-default, 4px)',
            height: '28px',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {/* Settings Popover for Provider and Model Config */}
          <Popover width={250} position="bottom-start" withArrow shadow="md" trapFocus>
            <Popover.Target>
              <Tooltip label="Configure AI Provider & Model" position="top" withArrow>
                <ActionIcon
                   size="xs"
                   variant="subtle"
                   color="blue"
                   style={{ marginRight: '4px', display: 'flex', alignItems: 'center' }}
                 >
                   <Settings style={{ width: 13, height: 13 }} />
                 </ActionIcon>
              </Tooltip>
            </Popover.Target>
            <Popover.Dropdown
              style={{ padding: '8px', border: '1px solid var(--line)', backgroundColor: 'var(--panel)' }}
            >
              <Stack gap="xs">
                <Text size="11px" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AI Configurations
                </Text>

                {/* Provider Selection */}
                <Stack gap={2}>
                  <Text size="10px" fw={600} c="dimmed">
                    PROVIDER
                  </Text>
                  <SegmentedControl
                    size="xs"
                    value={aiProvider}
                    onChange={(val) => {
                      if (val) {
                        setAiProvider?.(val)
                        const defaultModel =
                          val === 'gemini'
                            ? 'models/gemini-2.5-flash'
                            : val === 'apple'
                            ? 'apple/system-core'
                            : 'openrouter/auto'
                        setAiModel?.(defaultModel)
                      }
                    }}
                    data={[
                      { value: 'openrouter', label: 'OpenRouter' },
                      { value: 'gemini', label: 'Gemini' }
                      // { value: 'apple', label: 'Apple' }
                    ]}
                    style={{ width: '100%' }}
                  />
                </Stack>

                {/* Model Selection */}
                <Stack gap={2}>
                  <Text size="10px" fw={600} c="dimmed">
                    MODEL PRESET
                  </Text>
                  <Select
                    size="xs"
                    value={aiModel}
                    onChange={(val) => val && setAiModel?.(val)}
                    data={
                      aiProvider === 'gemini'
                        ? GEMINI_MODEL_PRESETS.map((p) => ({ value: p.value, label: p.shortLabel }))
                        : aiProvider === 'apple'
                        ? APPLE_MODEL_PRESETS.map((p) => ({ value: p.value, label: p.shortLabel }))
                        : MODEL_PRESETS.map((p) => ({ value: p.value, label: p.shortLabel }))
                    }
                    style={{ width: '100%' }}
                  />
                </Stack>

                {/* Reset Session Button */}
                <Tooltip label="Clear chat and start a new clean session" position="top" withArrow>
                  <Button
                    id="resetGptButton"
                    type="button"
                    size="xs"
                    variant="light"
                    color="red"
                    leftSection={<Trash2 style={{ width: 12, height: 12 }} />}
                    onClick={onNewChat}
                    style={{ marginTop: '4px', width: '100%' }}
                  >
                    Reset Session
                  </Button>
                </Tooltip>
              </Stack>
            </Popover.Dropdown>
          </Popover>

          {/* Provider Badge */}
          <Badge
            size="xs"
            variant="light"
            color={aiProvider === 'apple' ? 'teal' : aiProvider === 'gemini' ? 'purple' : 'indigo'}
            style={{ marginRight: '6px', fontSize: '9px', fontWeight: 800 }}
          >
            {aiProvider.toUpperCase()}
          </Badge>

          {/* Active Model Name Label */}
          <Tooltip label={currentModelInUse || aiModel} position="top" withArrow>
            <Text
              size="11px"
              fw={600}
              style={{
                color: 'var(--accent)',
                marginRight: '6px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: '120px',
                cursor: 'help'
              }}
            >
              {currentModelInUse
                ? currentModelInUse.split('/').pop() || currentModelInUse
                : aiModel.split('/').pop() || aiModel}
            </Text>
          </Tooltip>

          {/* Combined Dynamic Telemetry Stats */}
          {(chatInputCount > 0 || chatStats) && (
            <Group gap={0} wrap="nowrap" align="center" style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--line)', margin: '0 6px' }} />

              {/* Chat Input Count */}
              {chatInputCount > 0 && (
                <Group gap={4} wrap="nowrap" align="center" style={{ display: 'inline-flex' }}>
                  <Text size="11px" fw={700} c="dimmed">
                    Chat:
                  </Text>
                  <Text size="11px" fw={700} c="var(--ink)">
                    {chatInputCount}
                  </Text>
                </Group>
              )}

              {/* Latency and Retry Stats */}
              {chatStats && (
                <>
                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--line)', margin: '0 6px' }} />
                  <Group gap={4} wrap="nowrap" align="center" style={{ display: 'inline-flex' }}>
                    <Text size="11px" fw={500} c="dimmed">
                      Lat:
                    </Text>
                    <Text size="11px" fw={600} c="var(--ink)">
                      {(chatStats.latencyMs / 1000).toFixed(1)}s
                    </Text>
                    {chatStats.attempts > 1 && (
                      <Text size="10px" fw={700} style={{ color: '#f59e0b', marginLeft: '2px' }}>
                        R:{chatStats.attempts}
                      </Text>
                    )}
                  </Group>
                </>
              )}

              {/* Token Usage Stats */}
              {chatStats?.usage && (
                <>
                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--line)', margin: '0 6px' }} />
                  <Group gap={3} wrap="nowrap" align="center" style={{ display: 'inline-flex' }}>
                    <Text size="11px" fw={500} c="dimmed">
                      Tok:
                    </Text>
                    <Text size="11px" fw={600} c="var(--ink)">
                      {chatStats.usage.total_tokens >= 1000
                        ? `${(chatStats.usage.total_tokens / 1000).toFixed(1)}k`
                        : chatStats.usage.total_tokens}
                    </Text>
                    <Text size="10px" c="dimmed" style={{ opacity: 0.6 }}>
                      ({chatStats.usage.prompt_tokens}p/{chatStats.usage.completion_tokens}c)
                    </Text>
                  </Group>
                </>
              )}
            </Group>
          )}

          {/* Direct Session Reset Trash Icon */}
          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--line)', margin: '0 6px' }} />
          <Tooltip label="Clear chat and start a new clean session" position="top" withArrow>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              onClick={onNewChat}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}

      {/* Premium On-Device Badge */}
      {aiProvider === 'apple' && (
        <Badge
          size="xs"
          variant="gradient"
          gradient={{ from: 'teal', to: 'lime', deg: 135 }}
          style={{
            fontSize: '9px',
            fontWeight: 800,
            padding: '2px 8px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            textTransform: 'uppercase',
            boxShadow: '0 0 10px rgba(45, 212, 191, 0.3)',
            letterSpacing: '0.5px',
            border: '1px solid rgba(45, 212, 191, 0.2)'
          }}
        >
          ⚡ NATIVE ON-DEVICE
        </Badge>
      )}

      {/* Auto Prompt */}
      <Tooltip label="Send prompt to extension, submit automatically, and paste response here" position="top" withArrow>
        <Button
          id="autoPromptButton"
          type="button"
          size="xs"
          variant="filled"
          leftSection={<Zap style={{ width: 14, height: 14 }} />}
          onClick={onAutoPrompt}
          aria-label="Send prompt automatically"
        >
          Auto Prompt
        </Button>
      </Tooltip>
    </Group>
  )
}
