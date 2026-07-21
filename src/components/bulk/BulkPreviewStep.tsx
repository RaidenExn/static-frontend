import React from 'react'
import { RowData, ParseError } from './hooks/useBulkResubmission'

interface BulkPreviewStepProps {
  rows: RowData[]
  errors: ParseError[]
  setStep: (step: 1 | 2 | 3) => void
  handleStartProcessing: () => void
}

export function BulkPreviewStep({ rows, errors, setStep, handleStartProcessing }: BulkPreviewStepProps) {
  // Compute live visual summary statistics
  const totalBilled = rows.reduce((sum, r) => sum + (r.billedAmount || 0), 0)
  const totalDenied = rows.reduce((sum, r) => sum + (r.deniedAmount || 0), 0)
  const resubmitCount = rows.filter((r) => r.action === 'Resubmit').length
  const writeoffCount = rows.filter((r) => r.action === 'Write-off').length
  const closeCount = rows.filter((r) => r.action === 'Close').length

  const hasErrors = errors.some((e) => e.issues.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 600 }}>Visual Verification Preview</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
            These are the parsed writeback actions extracted from your CSV file. Encounter-level remarks are
            automatically cascaded.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem',
              transition: 'all 0.15s ease'
            }}
          >
            Back to Input
          </button>
          <button
            type="button"
            onClick={handleStartProcessing}
            disabled={hasErrors || rows.length === 0}
            style={{
              padding: '10px 22px',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              cursor: hasErrors || rows.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(var(--accent-rgb, 59, 130, 246), 0.25)',
              transition: 'all 0.15s ease',
              opacity: hasErrors || rows.length === 0 ? 0.5 : 1
            }}
          >
            🚀 Start Writeback Process
          </button>
        </div>
      </div>

      {/* Premium Live Statistics Card Deck */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div className="stat-card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted)',
              fontWeight: 600,
              marginBottom: '6px'
            }}
          >
            Total Records
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--ink)' }}>{rows.length}</div>
        </div>
        <div className="stat-card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted)',
              fontWeight: 600,
              marginBottom: '6px'
            }}
          >
            Billed Amount
          </div>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: 'var(--ink)',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="stat-card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted)',
              fontWeight: 600,
              marginBottom: '6px'
            }}
          >
            Denied Amount
          </div>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: 'var(--bad)',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            {totalDenied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="stat-card">
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted)',
              fontWeight: 600,
              marginBottom: '6px'
            }}
          >
            Reconcile actions
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {resubmitCount > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontWeight: 600
                }}
              >
                {resubmitCount} Resubmit
              </span>
            )}
            {writeoffCount > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(168, 85, 247, 0.08)',
                  color: '#a855f7',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  fontWeight: 600
                }}
              >
                {writeoffCount} Write-off
              </span>
            )}
            {closeCount > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(34, 197, 94, 0.08)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  fontWeight: 600
                }}
              >
                {closeCount} Close
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error messages if any */}
      {errors.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--border-radius)',
            padding: '16px',
            color: '#ef4444'
          }}
        >
          <h4
            style={{
              margin: '0 0 10px',
              fontSize: '0.92rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ⚠️ Validation Warnings / Errors Detected
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', lineHeight: '1.5' }}>
            {errors.map((err, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>
                Row <strong>{err.row}</strong> ({err.encounterNumber || 'Unknown'}): {err.issues.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Grid Preview */}
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: 'var(--border-radius)',
          overflow: 'hidden',
          backgroundColor: 'var(--panel)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.015)'
        }}
      >
        <div style={{ overflowX: 'auto' }} className="sleek-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--panel-soft)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--muted)' }}>Encounter Number</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--muted)' }}>Denied Code</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--muted)', textAlign: 'right' }}>
                  Billed Amount
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--muted)', textAlign: 'right' }}>
                  Denied Amount
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--muted)' }}>Resubmission Comment</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--muted)' }}>RA Comment</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--muted)' }}>Reconciliation Type</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--muted)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="preview-table-row"
                  style={{ borderBottom: '1px solid var(--line)', transition: 'all 0.15s ease-in-out' }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>
                    {row.encounterNumber}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--panel-soft)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        border: '1px solid var(--line)'
                      }}
                    >
                      {row.deniedCode}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 500
                    }}
                  >
                    {row.billedAmount.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'var(--bad)',
                      fontWeight: 500
                    }}
                  >
                    {row.deniedAmount.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--ink)'
                    }}
                    title={row.resubmissionComment}
                  >
                    {row.resubmissionComment}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={row.raComment}
                  >
                    {row.raComment || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>N/A</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--panel-soft)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--line)',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    >
                      {row.reconciliationType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        backgroundColor:
                          row.action === 'Resubmit'
                            ? 'rgba(3, 169, 244, 0.08)'
                            : row.action === 'Write-off'
                              ? 'rgba(124, 58, 237, 0.08)'
                              : 'rgba(16, 185, 129, 0.08)',
                        color:
                          row.action === 'Resubmit' ? '#0288d1' : row.action === 'Write-off' ? '#7c3aed' : '#10b981',
                        border: `1px solid ${row.action === 'Resubmit' ? 'rgba(3, 169, 244, 0.25)' : row.action === 'Write-off' ? 'rgba(124, 58, 237, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {row.action}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                    No preview rows loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
