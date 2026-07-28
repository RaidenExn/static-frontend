import React, { useRef } from 'react'
import {
  Box,
  Container,
  Group,
  Stack,
  SimpleGrid,
  Text,
  TextInput,
  Select,
  Checkbox,
  Textarea,
  Center,
  Loader,
  Paper,
  Card
} from '@mantine/core'
import { Save, Download, Upload, Plus, FileText, Trash2 } from 'lucide-react'
import { usePromptConfig } from '../hooks/usePromptConfig'
import { LtButton, LtIconButton } from '../shared_elements'

interface PromptPanelProps {
  active: boolean
  showToast?: (msg: string, tone: 'ok' | 'error' | 'warning' | 'loading') => void
}

export default function PromptPanel({ active, showToast }: PromptPanelProps) {
  const {
    systemInstructions,
    setSystemInstructions,
    encounterBlocks,
    versions,
    selectedVersion,
    loading,
    name,
    saving,
    handleSave,
    handleSaveAsNew,
    handleLoadVersion,
    handleDeleteVersion,
    handleAddEncounterBlock: _handleAddEncounterBlock,
    handleDeleteEncounterBlock: _handleDeleteEncounterBlock,
    handleMoveEncounterBlock: _handleMoveEncounterBlock,
    handleEncounterBlockChange,
    handleEncounterThresholdChange,
    handleEncounterProfileFieldsChange,
    handleExport,
    handleImportFile
  } = usePromptConfig({ active, showToast })

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!active) return null

  return (
    <Box component="section" id="promptPanel" p="md" bg="var(--mantine-color-body)" mih="100vh">
      {/* ==================== CONTROL TOOLBAR ==================== */}
      <Card withBorder radius="sm" p="xs" mb="lg" bg="var(--mantine-color-body)">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          {/* Left: Version management */}
          <Group gap="xs" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
            <FileText size={14} />
            <Text size="xs" fw={800} tt="uppercase" lts="0.5px">
              Prompt Config
            </Text>
            {versions.length > 0 && (
              <Group gap={4} wrap="nowrap">
                <Select
                  size="xs"
                  w={160}
                  placeholder="-- Load Config --"
                  value={selectedVersion || null}
                  onChange={(val) => { if (val) handleLoadVersion(val) }}
                  data={versions.map((v) => ({ value: v.filename, label: v.name }))}
                />
                {selectedVersion && (
                  <LtIconButton
                    icon={Trash2}
                    iconSize={13}
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={() => handleDeleteVersion(selectedVersion)}
                    tooltip="Delete this version"
                  />
                )}
              </Group>
            )}
          </Group>

          {/* Right: Action buttons */}
          <Group gap="xs" wrap="wrap">
            <LtButton
              color="orange"
              variant="filled"
              disabled={saving}
              leftIcon={<Save size={13} />}
              onClick={() => handleSave()}
              tooltip="Save current configuration"
            >
              {saving ? 'Saving...' : 'Save Active'}
            </LtButton>

            <LtButton
              variant="default"
              leftIcon={<Plus size={13} />}
              onClick={() => {
                const proposedName = prompt('Enter name for the new configuration:', name)
                if (proposedName && proposedName.trim()) {
                  handleSaveAsNew(proposedName.trim())
                }
              }}
              tooltip="Save as a new named version"
            >
              Save As New
            </LtButton>

            <LtButton
              variant="default"
              leftIcon={<Download size={13} />}
              onClick={handleExport}
              tooltip="Export configuration as YAML file"
            >
              Export
            </LtButton>

            <LtButton
              variant="default"
              leftIcon={<Upload size={13} />}
              onClick={() => fileInputRef.current?.click()}
              tooltip="Import configuration from YAML/JSON file"
            >
              Import
            </LtButton>
          </Group>
        </Group>
      </Card>

      <input type="file" ref={fileInputRef} accept=".yaml,.yml,.json" onChange={handleImportFile} hidden />

      {loading ? (
        <Center mih="300px">
          <Stack align="center" gap="xs">
            <Loader color="orange" size="xl" type="dots" />
            <Text size="xs" c="dimmed" fs="italic">
              Loading dynamic workspaces...
            </Text>
          </Stack>
        </Center>
      ) : (
        <Container fluid p={0}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* ==================== LEFT COLUMN: SYSTEM INSTRUCTIONS ==================== */}
            <Box>
              <Text size="xs" fw={800} tt="uppercase" lts="0.5px" mb="xs">
                System Instructions
              </Text>

              <Textarea
                autosize
                minRows={20}
                maxRows={60}
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.currentTarget.value)}
                placeholder="Enter your system instructions..."
                style={{ fontFamily: 'monospace' }}
                size="xs"
                radius="sm"
              />
            </Box>

            {/* ==================== RIGHT COLUMN: ENCOUNTER DATA ==================== */}
            <Box>
              <Group
                justify="space-between"
                align="center"
                mb="xs"
                pb="xs"
                bd="0 0 1px solid var(--mantine-color-default-border)"
              >
                <Text size="xs" fw={800} tt="uppercase" lts="0.5px">
                  Encounter Data Blocks
                </Text>
              </Group>

              <Stack gap="sm">
                {encounterBlocks.map((block, idx) => (
                  <Paper
                    key={block.id}
                    withBorder
                    p="sm"
                    radius="sm"
                    bg="var(--mantine-color-body)"
                    style={{ opacity: block.enabled ? 1 : 0.65 }}
                  >
                    <Group justify="space-between" align="end" mb="xs" wrap="wrap" gap="xs">
                      <Group gap="xs" align="end" style={{ flex: 1 }}>
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
                          value={block.xmlTag || ''}
                          onChange={(e) =>
                            handleEncounterBlockChange(
                              idx,
                              'xmlTag',
                              e.currentTarget.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                            )
                          }
                          c="orange"
                          style={{ fontFamily: 'monospace' }}
                        />

                        <Checkbox
                          size="xs"
                          color="orange"
                          label="Active"
                          checked={block.enabled}
                          onChange={(e) => handleEncounterBlockChange(idx, 'enabled', e.currentTarget.checked)}
                          mb={6}
                        />
                      </Group>
                    </Group>

                    {block.id === 'patient_profile' ? (
                      <Paper p="xs" bg="var(--mantine-color-body)" withBorder radius="sm" mt="xs">
                        <Stack gap="xs">
                          <Box>
                            <Text size="xs" fw={700} c="orange" mb={4}>
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
                                    color="orange"
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
                            <Text size="xs" fw={700} c="orange" mb={4}>
                              Smart Vital Thresholds (Include only if outside range):
                            </Text>
                            <Group gap="xs" wrap="wrap">
                              <TextInput
                                label="Temp Max"
                                size="xs"
                                w={95}
                                type="number"
                                placeholder="38.0"
                                rightSection={
                                  <Text size="10px" c="dimmed">
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
                                  <Text size="10px" c="dimmed">
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
                                  <Text size="10px" c="dimmed">
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
                                  <Text size="10px" c="dimmed">
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
                      <Text size="xs" c="dimmed" fs="italic">
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
