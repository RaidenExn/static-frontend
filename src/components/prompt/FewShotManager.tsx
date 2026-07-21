import React, { useState, useRef, useEffect } from 'react'
import { FewShotExample } from '../../types'

interface FewShotManagerProps {
  examples: FewShotExample[]
  omitDiagnoses: boolean
  onAdd: () => void
  onDelete: (index: number) => void
  onChange: (index: number, field: keyof FewShotExample, value: any) => void
}

interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
}

function AutoResizingTextarea({ value, style, onChange, ...props }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const el = ref.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight + 4}px`
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      style={{
        resize: 'none',
        overflowY: 'hidden',
        width: '100%',
        backgroundColor: '#1e1e1e',
        color: '#e0e0e0',
        border: '1px solid #333',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '12px',
        fontFamily: 'Consolas, Monaco, monospace',
        lineHeight: '1.5',
        ...style
      }}
      {...props}
    />
  )
}

export function FewShotManager({ examples, omitDiagnoses, onAdd, onDelete, onChange }: FewShotManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(examples.length > 0 ? 0 : null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  // Live Compiled Preview renderer
  const getCompiledPreview = (ex: FewShotExample, index: number) => {
    const lines: string[] = []
    lines.push(`Example ${index + 1}:`)
    lines.push(`Denied Services Description: ${ex.deniedCodesDescription || 'OP Initial consultation code rejected'}`)
    lines.push(
      `Demographics: ${String(ex.demographics || 'Age: [age], Gender: [gender]')
        .replace(/\[age\]/gi, '45 Yrs')
        .replace(/\[gender\]/gi, 'Female')}`
    )
    lines.push(`Complaints: ${ex.complaints || 'None'}`)
    lines.push(`HPI: ${ex.hpi || 'None'}`)
    if (!omitDiagnoses) {
      lines.push(`Problems: ${ex.diagnoses || 'None'}`)
    }
    lines.push('Output:')
    lines.push(
      `  ${String(ex.output || '')
        .replace(/\[age\]/gi, '45 yrs')
        .replace(/\[gender\]/gi, 'female')}`
    )
    return lines.join('\n')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with modern premium title and Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚡ Few-Shot In-Context Training Examples</span>
            <span
              style={{
                fontSize: '10px',
                background: 'rgba(26, 115, 232, 0.1)',
                color: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              {examples.filter((e) => e.enabled !== false).length} Active
            </span>
          </h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Provide clinical scenarios to enforce structured next-gen clinical reasoning formats.
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(26,115,232,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          ➕ Add Example
        </button>
      </div>

      {examples.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--line)',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '12px'
          }}
        >
          No training examples configured. Click "Add Example" to create your first next-gen scenario.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {examples.map((example, idx) => {
            const isExpanded = expandedIndex === idx
            const isEnabled = example.enabled !== false

            return (
              <div
                key={idx}
                style={{
                  border: isExpanded ? '1px solid var(--accent)' : '1px solid var(--line)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: isEnabled ? 'var(--panel)' : 'rgba(0, 0, 0, 0.02)',
                  opacity: isEnabled ? 1 : 0.75,
                  boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Card Header */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  style={{
                    padding: '12px 16px',
                    background: isExpanded ? 'rgba(26, 115, 232, 0.02)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isExpanded ? '1px solid var(--line)' : 'none'
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modern Slide Toggle */}
                    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => onChange(idx, 'enabled', e.target.checked)}
                        style={{ display: 'none' }}
                      />
                      <span
                        style={{
                          width: '32px',
                          height: '18px',
                          backgroundColor: isEnabled ? 'var(--success)' : '#ccc',
                          borderRadius: '9px',
                          position: 'relative',
                          display: 'inline-block',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            backgroundColor: '#fff',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: isEnabled ? '16px' : '2px',
                            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        />
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isEnabled ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        {isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </label>

                    <div style={{ height: '14px', width: '1px', backgroundColor: 'var(--line)' }} />

                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Example {idx + 1}
                    </span>

                    {example.deniedCodesDescription && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--accent)',
                          backgroundColor: 'rgba(26, 115, 232, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 500,
                          maxWidth: '240px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={example.deniedCodesDescription}
                      >
                        {example.deniedCodesDescription}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewIndex(previewIndex === idx ? null : idx)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: previewIndex === idx ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: previewIndex === idx ? 'rgba(26, 115, 232, 0.08)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      👁️ Preview Compilation
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(idx)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(217, 48, 37, 0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Delete
                    </button>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Live Compilation Block (Separate Overlay/Drawer inside item) */}
                {previewIndex === idx && (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#121212',
                      borderBottom: '1px solid var(--line)',
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: '11px',
                      color: '#a9b7c6',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '12px',
                        fontSize: '10px',
                        color: 'var(--accent)',
                        background: 'rgba(26, 115, 232, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      LIVE COMPILED PREVIEW (Patient vars replaced)
                    </div>
                    {getCompiledPreview(example, idx)}
                  </div>
                )}

                {/* Card Content */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    {/* Row 1: Denied Service Description */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Denied Services Description (e.g. CBC rejected, Repeat Consultation limit)
                      </label>
                      <input
                        type="text"
                        value={example.deniedCodesDescription || ''}
                        onChange={(e) => onChange(idx, 'deniedCodesDescription', e.target.value)}
                        placeholder="OP Initial consultation code for the same condition cannot be paid if billed within 28 days."
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          background: 'var(--panel)',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Row 2: Demographics & Complaints */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Demographics (Template supports [age] and [gender])
                        </label>
                        <input
                          type="text"
                          value={example.demographics || ''}
                          onChange={(e) => onChange(idx, 'demographics', e.target.value)}
                          placeholder="Age: [age], Gender: [gender]"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            background: 'var(--panel)',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Complaints
                        </label>
                        <input
                          type="text"
                          value={example.complaints || ''}
                          onChange={(e) => onChange(idx, 'complaints', e.target.value)}
                          placeholder="Cough, fever for 3 days"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            background: 'var(--panel)',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Row 3: HPI & Diagnoses */}
                    <div
                      style={{ display: 'grid', gridTemplateColumns: omitDiagnoses ? '1fr' : '1fr 1fr', gap: '16px' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          History of Present Illness (HPI)
                        </label>
                        <input
                          type="text"
                          value={example.hpi || ''}
                          onChange={(e) => onChange(idx, 'hpi', e.target.value)}
                          placeholder="Patient complains of dry cough and mild body aches."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            background: 'var(--panel)',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {!omitDiagnoses && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            Problems / Diagnoses
                          </label>
                          <input
                            type="text"
                            value={example.diagnoses || ''}
                            onChange={(e) => onChange(idx, 'diagnoses', e.target.value)}
                            placeholder="Acute bronchitis, J40"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--line)',
                              fontSize: '12px',
                              color: 'var(--text-primary)',
                              background: 'var(--panel)',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Row 4: Expected Output */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Expected Prompt Output
                      </label>
                      <AutoResizingTextarea
                        value={example.output || ''}
                        onChange={(e) => onChange(idx, 'output', e.target.value)}
                        placeholder="The patient is a [age] [gender] who presented with..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
