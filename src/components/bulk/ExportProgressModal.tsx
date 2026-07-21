import React from 'react'

interface ExportProgress {
  total: number
  processed: number
  status: string
}

interface ExportProgressModalProps {
  isOpen: boolean
  progress: ExportProgress | null
}

export function ExportProgressModal({ isOpen, progress }: ExportProgressModalProps) {
  if (!isOpen || !progress) return null

  const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--panel, #ffffff)',
          border: '1px solid var(--line, #e2e8f0)',
          borderRadius: 'var(--border-radius, 8px)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          width: '420px',
          textAlign: 'center'
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink, #1a202c)' }}>
          Exporting CSV Template
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'var(--muted, #4a5568)' }}>
          {progress.status === 'completed'
            ? 'Generation completed! Initiating download...'
            : `Processing encounters: ${progress.processed} / ${progress.total}`}
        </p>

        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--line, #edf2f7)',
            borderRadius: '999px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              backgroundColor: 'var(--accent, #3182ce)',
              height: '100%',
              transition: 'width 0.3s ease',
              borderRadius: '999px'
            }}
          />
        </div>

        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent, #3182ce)' }}>
          {percentage}% Complete
        </div>
      </div>
    </div>
  )
}
