import React from 'react'
import { RcmResult } from '../types'
import { useObservations } from '../hooks/useObservations'
import { ProcedureGrid } from './observations/ProcedureGrid'
import { ObservationForm } from './observations/ObservationForm'
import { ObservationList } from './observations/ObservationList'

interface ObservationsPanelProps {
  active: boolean
  rcmResult: RcmResult | null
  encounterInput: string
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
}

export default function ObservationsPanel({ active, rcmResult, encounterInput, showToast }: ObservationsPanelProps) {
  const obsState = useObservations({
    active,
    rcmResult,
    encounterInput,
    showToast
  })

  if (!active) return null

  return (
    <div
      className="observations-tab-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', padding: '4px' }}
    >
      {/* Row 1: Patient Procedure Grid CPT/CDT Codes Selector */}
      <ProcedureGrid
        activities={obsState.activities}
        selectedActivity={obsState.selectedActivity}
        setSelectedActivity={obsState.setSelectedActivity}
        observationCounts={obsState.observationCounts}
      />

      {/* Row 2: Dual-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: '300px' }}>
        {/* Left Panel: Observation Entry Form */}
        <ObservationForm
          selectedActivity={obsState.selectedActivity}
          editingObsvid={obsState.editingObsvid}
          obsType={obsState.obsType}
          setObsType={obsState.setObsType}
          obsTypes={obsState.obsTypes}
          obsCodes={obsState.obsCodes}
          obsCode={obsState.obsCode}
          setObsCode={obsState.setObsCode}
          obsDesc={obsState.obsDesc}
          setObsDesc={obsState.setObsDesc}
          obsCodeValue={obsState.obsCodeValue}
          setObsCodeValue={obsState.setObsCodeValue}
          obsValue={obsState.obsValue}
          setObsValue={obsState.setObsValue}
          uploading={obsState.uploading}
          dragActive={obsState.dragActive}
          fileNameDisplay={obsState.fileNameDisplay}
          saving={obsState.saving}
          handleDrag={obsState.handleDrag}
          handleDrop={obsState.handleDrop}
          handleFileChange={obsState.handleFileChange}
          handleSubmit={obsState.handleSubmit}
          resetForm={obsState.resetForm}
        />

        {/* Right Panel: Active Observations Grid */}
        <ObservationList
          loading={obsState.loading}
          filteredObservations={obsState.filteredObservations}
          selectedActivity={!!obsState.selectedActivity}
          obsTypes={obsState.obsTypes}
          handleDownloadFile={obsState.handleDownloadFile}
          handleEdit={obsState.handleEdit}
          handleDelete={obsState.handleDelete}
        />
      </div>
    </div>
  )
}
