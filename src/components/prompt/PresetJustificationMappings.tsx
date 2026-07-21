import React from 'react'

interface PresetMapping {
  keys: string[]
  display: string
}

interface PresetJustificationMappingsProps {
  presetMappings?: PresetMapping[]
  handleAddMapping: () => void
  handleRemoveMapping: (idx: number) => void
  handleMappingChange: (idx: number, field: 'keys' | 'display', val: string) => void
}

export function PresetJustificationMappings({
  presetMappings,
  handleAddMapping,
  handleRemoveMapping,
  handleMappingChange
}: PresetJustificationMappingsProps) {
  return (
    <div
      className="preload-card"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--border-radius)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
            🎯 Preset Justification Mappings (Level 2)
          </label>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Matching rules are dynamically packed into prompt templates.
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddMapping}
          style={{
            backgroundColor: 'var(--good)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            margin: 0
          }}
        >
          ➕ Add Rule
        </button>
      </div>

      <div
        style={{
          overflowY: 'auto',
          maxHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '4px'
        }}
      >
        {presetMappings?.map((mapping, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(0,0,0,0.01)',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => handleRemoveMapping(idx)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--bad)',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '90%' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Matching Keys (Comma Separated)
              </span>
              <input
                type="text"
                value={mapping.keys.join(', ')}
                onChange={(e) => handleMappingChange(idx, 'keys', e.target.value)}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)'
                }}
                placeholder="cbc, complete blood count..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Prompt Display Rule
              </span>
              <input
                type="text"
                value={mapping.display}
                onChange={(e) => handleMappingChange(idx, 'display', e.target.value)}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)'
                }}
                placeholder="- cbc -> rule out infection..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
