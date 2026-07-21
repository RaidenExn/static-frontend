import React from 'react'
import { RcmActivity } from '../../types'
import { Observation, ObsType, ObsCode } from '../../hooks/useActivityState'
import {
  Modal,
  Select,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Grid,
  Card,
  Loader,
  ScrollArea,
  Box,
  Tooltip
} from '@mantine/core'

interface ObservationsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedActivity: RcmActivity | null
  filteredObservations: Observation[]
  loadingObs: boolean
  savingObs: boolean
  obsTypes: ObsType[]
  obsCodes: ObsCode[]
  editingObsvid: number | undefined
  obsType: number
  setObsType: (val: number) => void
  obsValue: string
  setObsValue: (val: string) => void
  obsDesc: string
  setObsDesc: (val: string) => void
  obsCode: number
  setObsCode: (val: number) => void
  obsCodeValue: string
  setObsCodeValue: (val: string) => void
  obsValueType: number
  setObsValueType: (val: number) => void
  uploadingObs: boolean
  dragActive: boolean
  fileNameDisplay: string
  handleEditObs: (obs: Observation) => void
  handleDeleteObs: (obsvid: number) => void
  handleDrag: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmitObs: (e: React.FormEvent) => void
  handleDownloadObsFile: (obsvid: number, filename: string) => void
  resetForm: () => void
}

export default function ObservationsModal({
  isOpen,
  onClose,
  selectedActivity,
  filteredObservations,
  loadingObs,
  savingObs,
  obsTypes,
  obsCodes,
  editingObsvid,
  obsType,
  setObsType,
  obsValue,
  setObsValue,
  obsDesc,
  setObsDesc,
  obsCode,
  setObsCode,
  obsCodeValue,
  setObsCodeValue,
  uploadingObs,
  dragActive,
  fileNameDisplay,
  handleEditObs,
  handleDeleteObs,
  handleDrag,
  handleDrop,
  handleFileChange,
  handleSubmitObs,
  handleDownloadObsFile,
  resetForm
}: ObservationsModalProps) {
  if (!selectedActivity) return null

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Stack gap={2}>
          <Text size="sm" fw={700} c="var(--ink)">
            Clinical Observations & Evidence
          </Text>
          <Text size="xs" c="var(--muted)">
            Procedure: <strong style={{ color: 'var(--badge-info-text)' }}>{selectedActivity.order_name}</strong> (Code:{' '}
            <strong style={{ color: 'var(--badge-info-text)' }}>{selectedActivity.code}</strong>)
          </Text>
        </Stack>
      }
      size="960px"
    >
      <Grid {...({ gutter: 'xl' } as any)}>
        {/* Left Column: Form Composer */}
        <Grid.Col span={5}>
          <Stack gap="md">
            <Text
              size="xs"
              fw={700}
              c="var(--muted)"
              pb="xs"
              style={{ textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--line)' }}
            >
              {editingObsvid ? 'Edit Observation' : 'Add Observation'}
            </Text>

            <Box component="form" onSubmit={handleSubmitObs}>
              <Stack gap="xs">
                {/* Observation Type Selector */}
                <Select
                  label="Observation Type"
                  size="xs"
                  value={String(obsType)}
                  onChange={(val) => {
                    setObsType(Number(val))
                    resetForm()
                  }}
                  data={obsTypes.map((t) => ({ value: String(t.id), label: t.name }))}
                />

                {/* LOINC Outcome Form Fields */}
                {obsType === 1 && (
                  <Card withBorder padding="xs" mt="xs">
                    <Stack gap="xs">
                      <Select
                        label="LOINC Code Reference"
                        size="xs"
                        value={String(obsCode)}
                        onChange={(val) => setObsCode(Number(val))}
                        data={obsCodes.map((c) => ({ value: String(c.code), label: c.name }))}
                      />

                      <Grid {...({ gutter: 'xs' } as any)}>
                        <Grid.Col span={6}>
                          <TextInput
                            label="Outcome Value"
                            size="xs"
                            placeholder="e.g. 98.6"
                            value={obsDesc}
                            onChange={(e) => setObsDesc(e.target.value)}
                            required
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <TextInput
                            label="Unit (UOM)"
                            size="xs"
                            placeholder="e.g. °F"
                            value={obsCodeValue}
                            onChange={(e) => setObsCodeValue(e.target.value)}
                          />
                        </Grid.Col>
                      </Grid>
                    </Stack>
                  </Card>
                )}

                {/* Text Note / Description Form Fields */}
                {(obsType === 2 || obsType === 8) && (
                  <Stack gap="xs" mt="xs">
                    <TextInput
                      label={obsType === 8 ? 'Evidence Code' : 'Short Title / Brief'}
                      size="xs"
                      placeholder={obsType === 8 ? 'e.g. EVIDENCE-101' : 'e.g. Lab result note'}
                      value={obsValue}
                      onChange={(e) => setObsValue(e.target.value)}
                      required
                    />

                    <Textarea
                      label="Clinical Note Details"
                      size="xs"
                      placeholder="Type details or clinical evidence findings here..."
                      value={obsDesc}
                      onChange={(e) => setObsDesc(e.target.value)}
                      required
                      minRows={3}
                      maxRows={5}
                    />
                  </Stack>
                )}

                {/* File Upload / Attachment Fields */}
                {obsType === 3 && (
                  <Stack gap="xs" mt="xs">
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      style={{
                        border: dragActive ? '1px dashed var(--badge-info-text)' : '1px dashed var(--line)',
                        borderRadius: 'var(--mantine-radius-sm)',
                        padding: '16px 12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: dragActive ? 'var(--badge-info-bg)' : 'rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                      <Text size="md" mb="xs">
                        📄
                      </Text>
                      <Text size="xs" fw={600}>
                        Drag and Drop PDF or Click to upload
                      </Text>
                      <Text size="xs" c="var(--muted)" mt={2}>
                        PDF only, maximum 5MB
                      </Text>
                    </div>

                    {fileNameDisplay && (
                      <Group
                        justify="space-between"
                        align="center"
                        style={{
                          backgroundColor: 'var(--panel-soft)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--mantine-radius-sm)',
                          padding: '6px 10px'
                        }}
                      >
                        <Text
                          size="xs"
                          style={{
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: '80%'
                          }}
                        >
                          📎 {fileNameDisplay}
                        </Text>
                        {uploadingObs && (
                          <Text size="xs" c="var(--badge-info-text)">
                            Processing...
                          </Text>
                        )}
                      </Group>
                    )}

                    <TextInput
                      label="Attachment Description"
                      size="xs"
                      placeholder="e.g. Blood test report"
                      value={obsDesc}
                      onChange={(e) => setObsDesc(e.target.value)}
                    />
                  </Stack>
                )}

                {/* Form Action Buttons */}
                <Group gap="xs" mt="md">
                  <Button type="submit" size="xs" disabled={savingObs || uploadingObs} style={{ flex: 1 }}>
                    {savingObs ? 'Saving...' : editingObsvid ? 'Update' : 'Add'}
                  </Button>
                  {editingObsvid && (
                    <Button type="button" size="xs" variant="default" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </Group>
              </Stack>
            </Box>
          </Stack>
        </Grid.Col>

        {/* Right Column: Observation List */}
        <Grid.Col span={7} style={{ borderLeft: '1px solid var(--line)', paddingLeft: '20px' }}>
          <Stack gap="md">
            <Text
              size="xs"
              fw={700}
              c="var(--muted)"
              pb="xs"
              style={{ textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--line)' }}
            >
              Active Observations ({filteredObservations.length})
            </Text>

            {loadingObs ? (
              <Group justify="center" align="center" style={{ minHeight: '150px' }}>
                <Loader size={16} />
                <Text size="xs" c="var(--muted)">
                  Loading active observations...
                </Text>
              </Group>
            ) : filteredObservations.length === 0 ? (
              <Group
                justify="center"
                align="center"
                style={{
                  minHeight: '150px',
                  border: '1px dashed var(--line)',
                  borderRadius: 'var(--mantine-radius-sm)',
                  padding: '20px'
                }}
              >
                <Text size="xs" c="var(--muted)" style={{ textAlign: 'center' }}>
                  No active observations on file.
                </Text>
              </Group>
            ) : (
              <ScrollArea style={{ height: '360px' }}>
                <Stack gap="xs" style={{ paddingRight: '6px' }}>
                  {filteredObservations.map((obs) => {
                    const typeObj = obsTypes.find((t) => t.id === obs.observation_type)
                    return (
                      <Card key={obs.obsvid} withBorder padding="xs">
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Badge
                              size="xs"
                              color={
                                obs.observation_type === 1 ? 'blue' : obs.observation_type === 3 ? 'green' : 'orange'
                              }
                            >
                              {typeObj?.name || 'Observation'}
                            </Badge>

                            <Group gap={4}>
                              <Tooltip label="Edit" position="top" withArrow>
                                <Button
                                  size="xs"
                                  variant="subtle"
                                  color="gray"
                                  onClick={() => handleEditObs(obs)}
                                  style={{ width: '20px', height: '14px', padding: 0 }}
                                  aria-label="Edit"
                                >
                                  ✏️
                                </Button>
                              </Tooltip>
                              <Tooltip label="Deactivate" position="top" withArrow>
                                <Button
                                  size="xs"
                                  variant="subtle"
                                  color="red"
                                  onClick={() => obs.obsvid && handleDeleteObs(obs.obsvid)}
                                  style={{ width: '20px', height: '14px', padding: 0 }}
                                  aria-label="Deactivate"
                                >
                                  🗑️
                                </Button>
                              </Tooltip>
                            </Group>
                          </Group>

                          <Stack gap={2}>
                            <Text size="xs" fw={600} c="var(--ink)">
                              {obs.observation_type === 1 ? (
                                <span>
                                  LOINC Code {obs.observation_code}:{' '}
                                  <strong style={{ color: 'var(--badge-info-text)' }}>{obs.observation_desc}</strong>{' '}
                                  {obs.observation_code_value || ''}
                                </span>
                              ) : (
                                obs.observation_value
                              )}
                            </Text>
                            {obs.observation_type !== 1 && obs.observation_desc && (
                              <Text size="xs" c="var(--muted)" style={{ whiteSpace: 'pre-wrap' }}>
                                {obs.observation_desc}
                              </Text>
                            )}
                          </Stack>

                          {obs.observation_type === 3 && obs.filePath && obs.obsvid && (
                            <Button
                              type="button"
                              size="xs"
                              variant="default"
                              onClick={() =>
                                handleDownloadObsFile(obs.obsvid!, obs.observation_value || 'attachment.pdf')
                              }
                              style={{ alignSelf: 'flex-start' }}
                            >
                              📥 Download Attachment
                            </Button>
                          )}
                        </Stack>
                      </Card>
                    )
                  })}
                </Stack>
              </ScrollArea>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Modal>
  )
}
