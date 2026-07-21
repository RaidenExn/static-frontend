import React, { useRef } from 'react'
import {
  Box,
  Container,
  Group,
  Stack,
  SimpleGrid,
  Title,
  Text,
  TextInput,
  Select,
  Button,
  ActionIcon,
  Checkbox,
  Textarea,
  Center,
  Loader,
  Paper,
  Divider
} from '@mantine/core'
import { usePromptConfig } from '../hooks/usePromptConfig'

interface PromptPanelProps {
  active: boolean
  showToast?: (msg: string, tone: 'ok' | 'error' | 'warning' | 'loading') => void
}

export default function PromptPanel({ active, showToast }: PromptPanelProps) {
  const {
    blocks,
    encounterBlocks,
    versions,
    selectedVersion,
    name,
    setName,
    description,
    setDescription,
    aiModel,
    setAiModel,
    loading,
    saving,
    handleSave,
    handleSaveAsNew,
    handleLoadVersion,
    handleDeleteVersion,
    handleAddBlock,
    handleDeleteBlock,
    handleMoveBlock,
    handleBlockChange,
    handleAddEncounterBlock,
    handleDeleteEncounterBlock,
    handleMoveEncounterBlock,
    handleEncounterBlockChange,
    handleEncounterThresholdChange,
    handleEncounterProfileFieldsChange,
    handleExport,
    handleImportFile
  } = usePromptConfig({ active, showToast })

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!active) return null

  return (
    <Box component="section" id="promptPanel" p="lg" bg="var(--mantine-color-body)" mih="100vh">
      {/* Top Controls Toolbar */}
      <Group justify="space-between" align="center" gap="md" pb="md">
        <Stack gap={4} style={{ maxWidth: '60%' }}>
          <Title order={1} fz={26} fw={600} lts="-0.02em">
            {name || 'Prompt Configuration Workspace'}
          </Title>
          <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-line' }}>
            {description ||
              'Side-by-side customization of instructions and EMR data formatting. Save custom prompt versions to switch configurations.'}
          </Text>
        </Stack>

        {/* Configuration loading, saving & file controls */}
        <Group gap="xs">
          {versions.length > 0 && (
            <Group gap={6}>
              <Select
                size="sm"
                w={180}
                radius="xl"
                placeholder="-- Load Config --"
                value={selectedVersion || null}
                onChange={(val) => {
                  if (val) handleLoadVersion(val)
                }}
                data={versions.map((v) => ({ value: v.filename, label: v.name }))}
              />
              {selectedVersion && (
                <ActionIcon
                  variant="outline"
                  color="red"
                  radius="xl"
                  size={30}
                  onClick={() => handleDeleteVersion(selectedVersion)}
                >
                  ✕
                </ActionIcon>
              )}
            </Group>
          )}

          <Button radius="xl" size="sm" bg="#cc7129" fw={600} disabled={saving} onClick={() => handleSave()}>
            {saving ? 'Saving...' : 'Save Active'}
          </Button>

          <Button
            variant="default"
            radius="xl"
            size="sm"
            fw={500}
            onClick={() => {
              const proposedName = prompt('Enter name for the new configuration:', name)
              if (proposedName && proposedName.trim()) {
                handleSaveAsNew(proposedName.trim())
              }
            }}
          >
            Save As New
          </Button>

          <Button variant="default" radius="xl" size="sm" fw={500} onClick={handleExport}>
            Export YAML
          </Button>

          <Button variant="default" radius="xl" size="sm" fw={500} onClick={() => fileInputRef.current?.click()}>
            Import Config
          </Button>

          <input type="file" ref={fileInputRef} accept=".yaml,.yml,.json" onChange={handleImportFile} hidden />
        </Group>
      </Group>

      <Divider mb="xl" />

      {loading ? (
        <Center mih="300px">
          <Stack align="center" gap="xs">
            <Loader color="#cc7129" size="xl" type="dots" />
            <Text size="sm" c="dimmed" fs="italic">
              Loading dynamic workspaces...
            </Text>
          </Stack>
        </Center>
      ) : (
        <Container fluid p={0}>
          {/* Workspace Metadata Settings Card */}
          <Paper withBorder p="md" radius="sm" mb="xl" bg="var(--mantine-color-default-hover)">
            <Title order={3} fz="xs" fw={700} mb="xs" c="#cc7129" lts="0.06em">
              WORKSPACE METADATA & MODEL SETTINGS
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <TextInput
                label="Config Name"
                placeholder="e.g. Standard Clinical Claims Auditor"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                size="xs"
              />
              <Select
                label="Target AI Model"
                placeholder="Select model"
                value={aiModel}
                onChange={(val) => setAiModel(val || 'claude-3-5-sonnet-20241022')}
                data={[
                  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
                  { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
                  { value: 'gpt-4o', label: 'GPT-4o' },
                  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
                ]}
                size="xs"
              />
              <TextInput
                label="Description"
                placeholder="Description of this prompt layout..."
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                size="xs"
              />
            </SimpleGrid>
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            {/* ==================== LEFT COLUMN: SYSTEM INSTRUCTIONS ==================== */}
            <Box>
              <Group
                justify="space-between"
                align="center"
                mb="md"
                pb="xs"
                bd="0 0 1px solid var(--mantine-color-default-border)"
              >
                <Title order={2} fz={18} fw={600}>
                  System Instructions
                </Title>
                <Button
                  variant="outline"
                  color="#cc7129"
                  size="xs"
                  radius="xl"
                  fw={600}
                  onClick={handleAddBlock}
                  bd="1px solid #cc7129"
                >
                  + Add Block
                </Button>
              </Group>

              <Stack gap="md">
                {blocks.map((block, idx) => (
                  <Paper
                    key={block.id}
                    withBorder
                    p="md"
                    radius="sm"
                    bg="var(--mantine-color-default-hover)"
                    opacity={block.enabled ? 1 : 0.65}
                  >
                    <Group justify="space-between" align="center" mb="xs">
                      <Group gap="md" flex={1}>
                        <TextInput
                          variant="unstyled"
                          size="xs"
                          fw={700}
                          flex={1}
                          value={block.title || ''}
                          onChange={(e) => handleBlockChange(idx, 'title', e.currentTarget.value.toUpperCase())}
                          c="#cc7129"
                          lts="0.06em"
                        />
                        <Checkbox
                          size="xs"
                          color="#cc7129"
                          label="Active"
                          checked={block.enabled}
                          onChange={(e) => handleBlockChange(idx, 'enabled', e.currentTarget.checked)}
                        />
                      </Group>

                      <Group gap={2}>
                        <ActionIcon
                          variant="subtle"
                          color="dimmed"
                          onClick={() => handleMoveBlock(idx, 'up')}
                          disabled={idx === 0}
                        >
                          ↑
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="dimmed"
                          onClick={() => handleMoveBlock(idx, 'down')}
                          disabled={idx === blocks.length - 1}
                        >
                          ↓
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteBlock(block.id)}>
                          ✕
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Textarea
                      autosize
                      minRows={4}
                      value={block.content || ''}
                      onChange={(e) => handleBlockChange(idx, 'content', e.currentTarget.value)}
                      placeholder="Guideline content..."
                      ff="monospace"
                      size="xs"
                    />
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* ==================== RIGHT COLUMN: ENCOUNTER DATA ==================== */}
            <Box>
              <Group
                justify="space-between"
                align="center"
                mb="md"
                pb="xs"
                bd="0 0 1px solid var(--mantine-color-default-border)"
              >
                <Title order={2} fz={18} fw={600}>
                  Encounter Data
                </Title>
              </Group>

              <Stack gap="md">
                {encounterBlocks.map((block, idx) => (
                  <Paper
                    key={block.id}
                    withBorder
                    p="md"
                    radius="sm"
                    bg="var(--mantine-color-default-hover)"
                    opacity={block.enabled ? 1 : 0.65}
                  >
                    <Group justify="space-between" align="end" mb="sm" wrap="wrap" gap="sm">
                      <Group gap="sm" align="end" flex={1}>
                        <TextInput
                          label="Title"
                          variant="unstyled"
                          size="xs"
                          fw={700}
                          w={140}
                          value={block.title || ''}
                          onChange={(e) =>
                            handleEncounterBlockChange(idx, 'title', e.currentTarget.value.toUpperCase())
                          }
                          styles={{ input: { borderBottom: '1px solid var(--mantine-color-default-border)' } }}
                        />

                        <TextInput
                          label="XML Tag"
                          size="xs"
                          w={140}
                          ff="monospace"
                          value={block.xmlTag || ''}
                          onChange={(e) =>
                            handleEncounterBlockChange(
                              idx,
                              'xmlTag',
                              e.currentTarget.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                            )
                          }
                          c="#cc7129"
                        />

                        <Checkbox
                          size="xs"
                          color="#cc7129"
                          label="Active"
                          checked={block.enabled}
                          onChange={(e) => handleEncounterBlockChange(idx, 'enabled', e.currentTarget.checked)}
                          mb={6}
                        />
                      </Group>

                      <Group gap={2} mb={4}>
                        <ActionIcon
                          variant="subtle"
                          color="dimmed"
                          onClick={() => handleMoveEncounterBlock(idx, 'up')}
                          disabled={idx === 0}
                        >
                          ↑
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="dimmed"
                          onClick={() => handleMoveEncounterBlock(idx, 'down')}
                          disabled={idx === encounterBlocks.length - 1}
                        >
                          ↓
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteEncounterBlock(block.id)}>
                          ✕
                        </ActionIcon>
                      </Group>
                    </Group>

                    {block.id === 'patient_profile' ? (
                      <Paper p="sm" bg="var(--mantine-color-body)" withBorder radius="sm">
                        <Stack gap="md">
                          <Box>
                            <Text size="xs" fw={600} c="#cc7129" mb={8}>
                              Included Profile Components:
                            </Text>
                            <Group gap="md">
                              {['name', 'age', 'gender', 'temperature', 'bp', 'pulse', 'bmi'].map((field) => {
                                const pFields = {
                                  name: true,
                                  age: true,
                                  gender: true,
                                  temperature: true,
                                  bp: true,
                                  pulse: true,
                                  bmi: true,
                                  ...(block.profileFields || {})
                                }
                                const val = pFields[field as keyof typeof pFields]
                                return (
                                  <Checkbox
                                    key={field}
                                    size="xs"
                                    color="#cc7129"
                                    label={field === 'bp' ? 'BP' : field === 'bmi' ? 'BMI' : field}
                                    checked={val}
                                    onChange={(e) =>
                                      handleEncounterProfileFieldsChange(idx, field as any, e.currentTarget.checked)
                                    }
                                    tt="capitalize"
                                  />
                                )
                              })}
                            </Group>
                          </Box>

                          <Box>
                            <Text size="xs" fw={600} c="#cc7129" mb={8}>
                              Smart Vital Thresholds (Include only if outside range):
                            </Text>
                            <Group gap="sm" wrap="wrap">
                              <TextInput
                                label="Temp Max"
                                size="xs"
                                w={95}
                                type="number"
                                placeholder="38.0"
                                rightSection={
                                  <Text fz={10} c="dimmed">
                                    °C
                                  </Text>
                                }
                                value={block.thresholds?.tempMinC ?? ''}
                                onChange={(e) => handleEncounterThresholdChange(idx, 'tempMinC', e.currentTarget.value)}
                              />

                              <TextInput
                                label="Sys BP Max"
                                size="xs"
                                w={95}
                                type="number"
                                placeholder="140"
                                rightSection={
                                  <Text fz={10} c="dimmed">
                                    mmHg
                                  </Text>
                                }
                                value={block.thresholds?.bpSystolicMax ?? ''}
                                onChange={(e) =>
                                  handleEncounterThresholdChange(idx, 'bpSystolicMax', e.currentTarget.value)
                                }
                              />

                              <TextInput
                                label="Dias BP Max"
                                size="xs"
                                w={95}
                                type="number"
                                placeholder="90"
                                rightSection={
                                  <Text fz={10} c="dimmed">
                                    mmHg
                                  </Text>
                                }
                                value={block.thresholds?.bpDiastolicMax ?? ''}
                                onChange={(e) =>
                                  handleEncounterThresholdChange(idx, 'bpDiastolicMax', e.currentTarget.value)
                                }
                              />

                              <TextInput
                                label="Pulse Max"
                                size="xs"
                                w={95}
                                type="number"
                                placeholder="100"
                                rightSection={
                                  <Text fz={10} c="dimmed">
                                    bpm
                                  </Text>
                                }
                                value={block.thresholds?.pulseMax ?? ''}
                                onChange={(e) => handleEncounterThresholdChange(idx, 'pulseMax', e.currentTarget.value)}
                              />
                            </Group>
                          </Box>
                        </Stack>
                      </Paper>
                    ) : (
                      <Text size="xs" c="dimmed" fs="italic" px={2}>
                        Values are dynamically loaded from corresponding EMR sections into the custom XML tag.
                      </Text>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          </SimpleGrid>
        </Container>
      )}
    </Box>
  )
}
