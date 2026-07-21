import React from 'react'
import { Observation, ObsType } from '../../hooks/useObservations'
import { Tooltip } from '@mantine/core'

interface ObservationListProps {
  loading: boolean
  filteredObservations: Observation[]
  selectedActivity: boolean
  obsTypes: ObsType[]
  handleDownloadFile: (obsvid: number, filename: string) => void
  handleEdit: (obs: Observation) => void
  handleDelete: (obsvid: number) => void
}

export function ObservationList({
  loading,
  filteredObservations,
  selectedActivity,
  obsTypes,
  handleDownloadFile,
  handleEdit,
  handleDelete
}: ObservationListProps) {
  return (
    <section className="panel-block" style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
      <div
        className="panel-head"
        style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h2 style={{ fontSize: '14px', fontWeight: 600 }}>📋 Active Observations List</h2>
        <span
          style={{
            fontSize: '11px',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.6)',
            padding: '2px 8px',
            borderRadius: '4px'
          }}
        >
          {selectedActivity ? 'Procedure Scope' : 'Encounter Scope'}
        </span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner-ring" style={{ width: '28px', height: '20px' }}>
            Loading...
          </div>
        </div>
      ) : filteredObservations.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '20px',
            textAlign: 'center'
          }}
        >
          {selectedActivity
            ? 'No observations are currently associated with this procedure code.'
            : 'No observations recorded yet. Select a procedure to begin composer.'}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '320px'
          }}
        >
          {filteredObservations.map((obs) => {
            const typeObj = obsTypes.find((t) => t.id === obs.observation_type)
            const isFile = obs.observation_type === 3

            return (
              <div
                key={obs.obsvid}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  transition: 'all 0.15s ease',
                  gap: '12px'
                }}
                className="hover-row"
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span
                      style={{
                        background: isFile ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: isFile ? '#ef4444' : '#60a5fa',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}
                    >
                      {typeObj?.name || 'Observation'}
                    </span>
                    {obs.observation_code && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                        Code: {obs.observation_code}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#fff',
                      marginBottom: '2px',
                      wordBreak: 'break-word'
                    }}
                  >
                    {obs.observation_value}
                  </div>

                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-word' }}>
                    {obs.observation_desc}
                  </div>

                  {obs.observation_code_value && (
                    <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                      UOM: {obs.observation_code_value}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {isFile && obs.obsvid && (
                    <Tooltip label="View / Download Attached PDF Document" position="top" withArrow>
                      <button
                        onClick={() => handleDownloadFile(obs.obsvid!, obs.observation_value || 'attachment.pdf')}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: 'none',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px'
                        }}
                        aria-label="View / Download Attached PDF Document"
                      >
                        👁️
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip label="Edit Details" position="top" withArrow>
                    <button
                      onClick={() => handleEdit(obs)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px'
                      }}
                      aria-label="Edit Details"
                    >
                      ✏️
                    </button>
                  </Tooltip>
                  <Tooltip label="Deactivate / Soft-Delete" position="top" withArrow>
                    <button
                      onClick={() => handleDelete(obs.obsvid!)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px'
                      }}
                      aria-label="Deactivate / Soft-Delete"
                    >
                      ❌
                    </button>
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
