import React from 'react'
import { Card, Group, Stack, Button, Text, Box } from '@mantine/core'
import { Calendar } from 'lucide-react'
import { DateTimePicker } from '@mantine/dates'
import { RcmActivity, RcmRemark, RcmResubmission, RcmVisit } from '../types'
import { useActivityState } from '../hooks/useActivityState'
import ObservationsModal from './activity/ObservationsModal'
import PriorAuthModal from './activity/PriorAuthModal'
import ActivityTable from './activity/ActivityTable'

// Helper to parse "DD/MM/YYYY HH:mm" to Date object
const parseDateString = (str: string | null | undefined): Date | null => {
  if (!str) return null
  const trimmed = str.trim()
  
  // 1. Try DD/MM/YYYY HH:mm (or with seconds) or DD-MM-YYYY HH:mm
  const slashDmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (slashDmyMatch) {
    const [_, day, month, year, hour, minute] = slashDmyMatch
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  }

  // 2. Try YYYY-MM-DD HH:mm (or with seconds / T separator)
  const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+|T)(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (ymdMatch) {
    const [_, year, month, day, hour, minute] = ymdMatch
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  }

  // 3. Fallback to native Date parser
  const fallbackDate = new Date(trimmed)
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate
  }

  return null
}

// Helper to format Date object to "DD/MM/YYYY HH:mm"
const formatDateToString = (date: any): string => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hour}:${minute}`
}

interface ActivityPanelProps {
  active: boolean
  activityCount: number
  activityRows: RcmActivity[]
  remarksCount: number
  remarksRows: RcmRemark[]
  resubmissionsCount: number
  resubmissionsRows: RcmResubmission[]
  rowActions: Record<number, 're-sub' | 'w-off' | 'close'>
  setRowActions: React.Dispatch<React.SetStateAction<Record<number, 're-sub' | 'w-off' | 'close'>>>
  canSaveRaRemarks: boolean
  appDateTime?: string | null
  visits: RcmVisit[]
  onLoadSubmissionFile: (fileId: string, siteId: string, fileName: string, isViewXml: boolean) => void
  loading?: boolean
  repeatTrackerLoaded: boolean
  onLoadRepeatTracker: (encValue?: any, lookbackYears?: number, mode?: 'auto' | 'manual') => void
  loadingRepeatTracker: boolean
  repeatTrackerLookbackYears: number
  setRepeatTrackerLookbackYears: (val: number) => void
  shortcodes?: Record<string, string | string[]>
  dateEditMode: boolean
  setDateEditMode: (val: boolean) => void
  encounter: string
  encounterStartDate: string
  encounterEndDate?: string
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
}

const formatToDisplayDatetime = (str: string): string => {
  if (!str) return ''
  const trimmed = str.trim()
  if (trimmed.includes('T')) {
    const parts = trimmed.split('T')
    const dPart = parts[0]
    const tPart = parts[1] || '00:00'
    const dSplit = dPart.split('-')
    if (dSplit.length === 3) {
      const [y, m, d] = dSplit
      return `${d}/${m}/${y} ${tPart}`
    }
  }
  return trimmed
}

export default function ActivityPanel(props: ActivityPanelProps) {
  const state = useActivityState({
    ...props,
    encounterEndDate: props.encounterEndDate || ''
  })

  if (!props.active) return null

  const handleStartChange = (val: any) => {
    if (!val) {
      state.setEncStartInput('')
      return
    }
    const dateObj = val instanceof Date ? val : new Date(val)
    if (isNaN(dateObj.getTime())) return
    const formattedNewStart = formatDateToString(dateObj)
    state.setEncStartInput(formattedNewStart)

    // Auto-propagate date shift to end date
    const oldStart = parseDateString(state.encStartInput)
    const oldEnd = parseDateString(state.encEndInput)
    if (oldStart && oldEnd) {
      const dateChanged =
        dateObj.getDate() !== oldStart.getDate() ||
        dateObj.getMonth() !== oldStart.getMonth() ||
        dateObj.getFullYear() !== oldStart.getFullYear()

      if (dateChanged) {
        const updatedEnd = new Date(
          dateObj.getFullYear(),
          dateObj.getMonth(),
          dateObj.getDate(),
          oldEnd.getHours(),
          oldEnd.getMinutes()
        )
        state.setEncEndInput(formatDateToString(updatedEnd))
      }
    } else if (!oldEnd) {
      state.setEncEndInput(formattedNewStart)
    }
  }

  const handleEndChange = (val: any) => {
    if (!val) {
      state.setEncEndInput('')
      return
    }
    const dateObj = val instanceof Date ? val : new Date(val)
    if (isNaN(dateObj.getTime())) return
    const formattedNewEnd = formatDateToString(dateObj)
    state.setEncEndInput(formattedNewEnd)

    // Auto-propagate date shift to start date
    const oldStart = parseDateString(state.encStartInput)
    const oldEnd = parseDateString(state.encEndInput)
    if (oldStart && oldEnd) {
      const dateChanged =
        dateObj.getDate() !== oldEnd.getDate() ||
        dateObj.getMonth() !== oldEnd.getMonth() ||
        dateObj.getFullYear() !== oldEnd.getFullYear()

      if (dateChanged) {
        const updatedStart = new Date(
          dateObj.getFullYear(),
          dateObj.getMonth(),
          dateObj.getDate(),
          oldStart.getHours(),
          oldStart.getMinutes()
        )
        state.setEncStartInput(formatDateToString(updatedStart))
      }
    } else if (!oldStart) {
      state.setEncStartInput(formattedNewEnd)
    }
  }

  return (
    <Stack gap="md">
      {/* Date Configuration Deck (Only when date edit mode is active) */}
      {props.dateEditMode && (
        <Card
          withBorder
          padding="xs"
          style={{
            backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
            backdropFilter: 'var(--backdrop-filter, blur(16px))',
            WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
            border: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
            borderRadius: 'var(--mantine-radius-sm)'
          }}
        >
          <Group justify="space-between" align="center" gap="xs">
            <Group gap="xs" align="center">
              <Calendar style={{ width: 14, height: 14, color: 'var(--mantine-color-text)' }} />
              <Text size="xs" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Encounter Period
              </Text>
            </Group>

            <Group gap="sm" align="center">
              <DateTimePicker
                label="Start Time"
                size="xs"
                placeholder="Select Start Date & Time"
                value={parseDateString(state.encStartInput)}
                onChange={handleStartChange}
                valueFormat="DD/MM/YYYY HH:mm"
                styles={{
                  root: { display: 'flex', alignItems: 'center', gap: '6px' },
                  label: {
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    margin: 0
                  },
                  input: { width: '180px', height: '32px', fontSize: 'var(--mantine-font-size-sm)' }
                }}
              />
              <DateTimePicker
                label="End Time"
                size="xs"
                placeholder="Select End Date & Time"
                value={parseDateString(state.encEndInput)}
                onChange={handleEndChange}
                valueFormat="DD/MM/YYYY HH:mm"
                styles={{
                  root: { display: 'flex', alignItems: 'center', gap: '6px' },
                  label: {
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    margin: 0
                  },
                  input: { width: '180px', height: '32px', fontSize: 'var(--mantine-font-size-sm)' }
                }}
              />
              <Button
                size="xs"
                variant="outline"
                onClick={state.handleSaveEncounterDates}
                loading={state.isSavingEncDates}
                style={{ height: '32px', fontSize: 'var(--mantine-font-size-sm)' }}
              >
                Save Period
              </Button>
            </Group>
          </Group>
        </Card>
      )}

      {/* Main Activity Table */}
      <ActivityTable
        loading={!!props.loading}
        sortedRows={state.sortedRows}
        loadingRepeatTracker={props.loadingRepeatTracker}
        repeatTrackerLoaded={props.repeatTrackerLoaded}
        onLoadRepeatTracker={props.onLoadRepeatTracker}
        repeatTrackerLookbackYears={props.repeatTrackerLookbackYears}
        batchAuthStartInput={state.batchAuthStartInput}
        setBatchAuthStartInput={state.setBatchAuthStartInput}
        batchAuthExpiryInput={state.batchAuthExpiryInput}
        setBatchAuthExpiryInput={state.setBatchAuthExpiryInput}
        batchActivityStartInput={state.batchActivityStartInput}
        setBatchActivityStartInput={state.setBatchActivityStartInput}
        handleBatchSaveField={state.handleBatchSaveField}
        handleToggleAllActions={state.handleToggleAllActions}
        editingCell={state.editingCell}
        setEditingCell={state.setEditingCell}
        editValue={state.editValue}
        setEditValue={state.setEditValue}
        handleSaveCell={state.handleSaveCell}
        modifiedCells={state.modifiedCells}
        observationCounts={state.observationCounts}
        handleOpenObservationsModal={state.handleOpenObservationsModal}
        getDenialDescription={state.getDenialDescription}
        rowActions={props.rowActions}
        setRowActions={props.setRowActions}
        canSaveRaRemarks={props.canSaveRaRemarks}
        dateEditMode={props.dateEditMode}
      />

      {/* Modals for Activities & Authorizations */}
      <ObservationsModal
        isOpen={state.isObsModalOpen}
        onClose={() => state.setIsObsModalOpen(false)}
        selectedActivity={state.selectedActivityForObs}
        filteredObservations={state.filteredObservations}
        loadingObs={state.loadingObs}
        savingObs={state.savingObs}
        obsTypes={state.obsTypes}
        obsCodes={state.obsCodes}
        editingObsvid={state.editingObsvid}
        obsType={state.obsType}
        setObsType={state.setObsType}
        obsValue={state.obsValue}
        setObsValue={state.setObsValue}
        obsDesc={state.obsDesc}
        setObsDesc={state.setObsDesc}
        obsCode={state.obsCode}
        setObsCode={state.setObsCode}
        obsCodeValue={state.obsCodeValue}
        setObsCodeValue={state.setObsCodeValue}
        obsValueType={state.obsValueType}
        setObsValueType={state.setObsValueType}
        uploadingObs={state.uploadingObs}
        dragActive={state.dragActive}
        fileNameDisplay={state.fileNameDisplay}
        handleEditObs={state.handleEditObs}
        handleDeleteObs={state.handleDeleteObs}
        handleDrag={state.handleDrag}
        handleDrop={state.handleDrop}
        handleFileChange={state.handleFileChange}
        handleSubmitObs={state.handleSubmitObs}
        handleDownloadObsFile={state.handleDownloadObsFile}
        resetForm={state.resetForm}
      />

      <PriorAuthModal
        editingAuthId={state.editingAuthId}
        onClose={() => state.setEditingAuthId(null)}
        tempAuthCode={state.tempAuthCode}
        setTempAuthCode={state.setTempAuthCode}
        tempAuthStartDate={state.tempAuthStartDate}
        setTempAuthStartDate={state.setTempAuthStartDate}
        tempAuthExpiryDate={state.tempAuthExpiryDate}
        setTempAuthExpiryDate={state.setTempAuthExpiryDate}
        isSavingAuth={state.isSavingAuth}
        handleSavePriorAuth={state.handleSavePriorAuth}
        formatToDisplayDatetime={formatToDisplayDatetime}
      />
    </Stack>
  )
}
