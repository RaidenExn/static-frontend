import React from 'react'
import { RcmActivity } from '../../types'
import { ObsType, ObsCode } from '../../hooks/useObservations'

interface ObservationFormProps {
  selectedActivity: RcmActivity | null
  editingObsvid: number | undefined
  obsType: number
  setObsType: (type: number) => void
  obsTypes: ObsType[]
  obsCodes: ObsCode[]
  obsCode: number
  setObsCode: (code: number) => void
  obsDesc: string
  setObsDesc: (desc: string) => void
  obsCodeValue: string
  setObsCodeValue: (val: string) => void
  obsValue: string
  setObsValue: (val: string) => void
  uploading: boolean
  dragActive: boolean
  fileNameDisplay: string
  saving: boolean
  handleDrag: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  resetForm: () => void
}

export function ObservationForm({
  selectedActivity,
  editingObsvid,
  obsType,
  setObsType,
  obsTypes,
  obsCodes,
  obsCode,
  setObsCode,
  obsDesc,
  setObsDesc,
  obsCodeValue,
  setObsCodeValue,
  obsValue,
  setObsValue,
  uploading,
  dragActive,
  fileNameDisplay,
  saving,
  handleDrag,
  handleDrop,
  handleFileChange,
  handleSubmit,
  resetForm
}: ObservationFormProps) {
  return (
    <section className="panel-block" style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
      <div
        className="panel-head"
        style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h2 style={{ fontSize: '14px', fontWeight: 600 }}>
          {editingObsvid ? '✏️ Edit Observation Details' : '➕ Add Activity Observation'}
        </h2>
        {selectedActivity && (
          <span
            style={{
              fontSize: '11px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            CPT: {selectedActivity.code}
          </span>
        )}
      </div>

      {!selectedActivity ? (
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
          Please select a procedure code from the grid above to activate the observation composer.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Observation Class</label>
            <select
              value={obsType}
              onChange={(e) => {
                setObsType(Number(e.target.value))
                resetForm()
              }}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
                padding: '6px',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              {obsTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* LOINC Outcome Form Fields */}
          {obsType === 1 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'rgba(0,0,0,0.15)',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>LOINC Code Reference</label>
                <select
                  value={obsCode}
                  onChange={(e) => setObsCode(Number(e.target.value))}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    padding: '6px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  {obsCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Result Outcome Value</label>
                  <input
                    type="text"
                    placeholder="e.g. 98.6, 72"
                    value={obsDesc}
                    onChange={(e) => setObsDesc(e.target.value)}
                    required
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px',
                      padding: '6px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Unit of Measure (UOM)</label>
                  <input
                    type="text"
                    placeholder="e.g. °F, bpm, mg/dL"
                    value={obsCodeValue}
                    onChange={(e) => setObsCodeValue(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px',
                      padding: '6px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Note / Description Form Fields */}
          {(obsType === 2 || obsType === 8) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  {obsType === 8 ? 'Evidence Code Value' : 'Evidence Reference Brief / Short Title'}
                </label>
                <input
                  type="text"
                  placeholder={obsType === 8 ? 'e.g. EVIDENCE-101' : 'e.g. Laboratory result note, X-Ray report brief'}
                  value={obsValue}
                  onChange={(e) => setObsValue(e.target.value)}
                  required
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    padding: '6px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  Clinical Notes & Observations Details
                </label>
                <textarea
                  placeholder="Type details or clinical evidence findings here..."
                  value={obsDesc}
                  onChange={(e) => setObsDesc(e.target.value)}
                  required
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    padding: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    resize: 'none',
                    minHeight: '100px',
                    flex: 1
                  }}
                />
              </div>
            </div>
          )}

          {/* File Upload / Attachment Fields */}
          {obsType === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: dragActive ? '2px dashed #3b82f6' : '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0,0,0,0.15)',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '120px'
                }}
                onClick={() => document.getElementById('obs-file-input')?.click()}
              >
                <input
                  id="obs-file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {uploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div
                      className="spinner-ring"
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '3px solid rgba(255,255,255,0.2)',
                        borderTopColor: '#38bdf8',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}
                    ></div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Processing PDF...</span>
                  </div>
                ) : fileNameDisplay ? (
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>📄</div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#38bdf8',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {fileNameDisplay}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                      Click or drop to replace
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>📤</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                      Drag & Drop clinical PDF here
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                      or click to browse files (Max 5MB)
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  Attachment Caption / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab results attachment, doctor certified evidence"
                  value={obsDesc}
                  onChange={(e) => setObsDesc(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    padding: '6px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Form Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: 'auto',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <button
              type="submit"
              disabled={saving || uploading}
              className="compact-btn"
              style={{ flex: 1, margin: 0, justifyContent: 'center' }}
            >
              {saving ? 'Saving...' : editingObsvid ? '💾 Update Observation' : '➕ Save Observation'}
            </button>
            {editingObsvid && (
              <button
                type="button"
                onClick={resetForm}
                className="compact-btn secondary-btn"
                style={{ margin: 0, background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
