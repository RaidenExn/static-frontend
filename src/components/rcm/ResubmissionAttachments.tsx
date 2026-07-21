import React from 'react'

interface ServerAttachment {
  id: number
  fileName: string
  fileSize?: number
}

interface ResubmissionAttachmentsProps {
  serverAttachments: ServerAttachment[]
  onDeleteServerAttachment: (id: number) => void
}

export default function ResubmissionAttachments({
  serverAttachments,
  onDeleteServerAttachment
}: ResubmissionAttachmentsProps) {
  return (
    <div style={{ marginTop: '10px', borderTop: '1px solid var(--line)', paddingTop: '6px' }}>
      <h3
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--ink)',
          margin: '0 0 4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>📁</span> Sandboxed Server Attachments ({serverAttachments.length})
      </h3>
      {serverAttachments.length === 0 ? (
        <div style={{ fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }}>
          No clinical attachments uploaded to the server for this encounter yet.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxHeight: '120px',
            overflowY: 'auto',
            paddingRight: '2px'
          }}
        >
          {serverAttachments.map((att) => (
            <div
              key={att.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3px 6px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--border-radius)',
                fontSize: '10px',
                gap: '8px'
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: 'var(--ink)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}
                title={att.fileName}
              >
                📄 {att.fileName}
              </span>
              <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : '0 KB'}
              </span>
              <button
                type="button"
                onClick={() => onDeleteServerAttachment(att.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--bad)',
                  cursor: 'pointer',
                  padding: '1px 4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 0,
                  transition: 'opacity 0.15s ease'
                }}
                title="Delete from server portfolio"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
