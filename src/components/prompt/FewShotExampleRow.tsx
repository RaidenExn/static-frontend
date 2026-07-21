import React, { useState } from 'react'
import { FewShotExample } from '../../types'

interface FewShotRowProps {
  index: number
  example: FewShotExample
  omitDiagnoses: boolean
  onChange: (index: number, field: keyof FewShotExample, value: string) => void
  onDelete: (index: number) => void
}

interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
}

import { useRef, useEffect } from 'react'

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
        ...style
      }}
      {...props}
    />
  )
}

export function FewShotExampleRow({ index, example, omitDiagnoses, onChange, onDelete }: FewShotRowProps) {
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'var(--panel-soft)',
        marginBottom: '8px'
      }}
    >
      {/* Accordion Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.015)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: expanded ? '1px solid var(--line)' : 'none'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>
          Example {index + 1}:{' '}
          <code
            style={{
              fontSize: '10.5px',
              color: 'var(--text-secondary)',
              background: 'rgba(0,0,0,0.04)',
              padding: '2px 4px',
              borderRadius: '3px'
            }}
          >
            {example.input || 'empty input'}
          </code>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(index)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--bad)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0 4px',
              margin: 0
            }}
            title="Delete Example"
          >
            Delete
          </button>
          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Accordion Body */}
      {expanded && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}
              >
                Input Block Trigger
              </label>
              <input
                type="text"
                value={example.input}
                onChange={(e) => onChange(index, 'input', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px'
                }}
                placeholder="re- cbc..."
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}
              >
                Demographics Pattern
              </label>
              <input
                type="text"
                value={example.demographics}
                onChange={(e) => onChange(index, 'demographics', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px'
                }}
                placeholder="Age: [age], Gender: [gender]..."
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}
              >
                Complaints
              </label>
              <input
                type="text"
                value={example.complaints}
                onChange={(e) => onChange(index, 'complaints', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px'
                }}
                placeholder="cough, fever..."
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}
              >
                HPI
              </label>
              <input
                type="text"
                value={example.hpi}
                onChange={(e) => onChange(index, 'hpi', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px'
                }}
                placeholder="dry cough for 3 days..."
              />
            </div>
          </div>

          {!omitDiagnoses && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}
              >
                Diagnosed Problems
              </label>
              <input
                type="text"
                value={example.diagnoses || ''}
                onChange={(e) => onChange(index, 'diagnoses', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px'
                }}
                placeholder="Acute Nasopharyngitis..."
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '9px',
                fontWeight: 700,
                color: 'var(--muted)',
                marginBottom: '4px',
                textTransform: 'uppercase'
              }}
            >
              Expected Model Output
            </label>
            <AutoResizingTextarea
              rows={2}
              value={example.output}
              onChange={(e) => onChange(index, 'output', e.target.value)}
              style={{
                width: '100%',
                fontSize: '11px',
                padding: '6px 8px',
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '4px'
              }}
              placeholder="Output clinical summary..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
