import React from 'react'

interface ProgressState {
  status: string
  total_rows: number
  processed_rows: number
  success_count: number
  failure_count: number
}

interface BulkQueueConsoleProps {
  progress: ProgressState
  processLogs: string[]
  isProcessing: boolean
  logTerminalEndRef: React.RefObject<HTMLDivElement | null>
  resetState: () => void
}

export function BulkQueueConsole({
  progress,
  processLogs,
  isProcessing,
  logTerminalEndRef,
  resetState
}: BulkQueueConsoleProps) {
  const completedPct = progress.total_rows > 0 ? Math.round((progress.processed_rows / progress.total_rows) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          backgroundColor: 'var(--panel-soft)',
          padding: '24px',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--line)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.01)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="pulse-waiting"
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor:
                  progress.status === 'completed'
                    ? 'var(--good)'
                    : progress.status === 'failed'
                      ? 'var(--bad)'
                      : 'var(--accent)'
              }}
            />
            Status:{' '}
            <span
              style={{
                color:
                  progress.status === 'completed'
                    ? 'var(--good)'
                    : progress.status === 'failed'
                      ? 'var(--bad)'
                      : 'var(--accent)',
                textTransform: 'uppercase',
                fontWeight: 700
              }}
            >
              {progress.status}
            </span>
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>
            {progress.processed_rows} of {progress.total_rows} records completed
          </span>
        </div>

        {/* Premium Animated Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}
        >
          <div
            className="shimmer-progress"
            style={{
              width: `${completedPct}%`,
              height: '100%',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </div>

        {/* Glowing micro counters */}
        <div style={{ display: 'flex', gap: '24px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="pulse-waiting"
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--good)',
                boxShadow: '0 0 8px var(--good)'
              }}
            />
            <span>
              Success: <strong style={{ color: 'var(--good)' }}>{progress.success_count}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="pulse-waiting"
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--bad)',
                boxShadow: '0 0 8px var(--bad)'
              }}
            />
            <span>
              Failed: <strong style={{ color: 'var(--bad)' }}>{progress.failure_count}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--muted)'
              }}
            />
            <span>
              Pending: <strong>{progress.total_rows - progress.processed_rows}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SSE Live Log Terminal Console */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted)' }}>
            Streaming Writeback Log
          </h4>
          <span
            style={{
              fontSize: '0.75rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--muted)',
              background: 'var(--panel-soft)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid var(--line)'
            }}
          >
            SSE Stream Active
          </span>
        </div>

        {/* Custom Terminal Window Emulator */}
        <div
          style={{
            borderRadius: 'var(--border-radius)',
            border: '1px solid #2d2d30',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Unix Window Title bar */}
          <div
            style={{
              background: '#1c1c1e',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #2d2d30'
            }}
          >
            <div style={{ display: 'flex', gap: '6px', marginRight: '16px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ff5f56'
                }}
              ></span>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ffbd2e'
                }}
              ></span>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#27c93f'
                }}
              ></span>
            </div>
            <div
              style={{
                color: '#8e8e93',
                fontSize: '0.75rem',
                fontFamily: 'JetBrains Mono, monospace',
                flex: 1,
                textAlign: 'center',
                marginLeft: '-48px'
              }}
            >
              system-worker@bulk-resubmission:~
            </div>
          </div>

          {/* Console Body */}
          <div
            className="sleek-scroll"
            style={{
              backgroundColor: '#121214',
              color: '#e4e4e7',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.82rem',
              padding: '18px',
              height: '280px',
              overflowY: 'auto',
              lineHeight: '1.6'
            }}
          >
            {processLogs.map((log, idx) => {
              let logColor = '#abe9b3' // default green-tint
              if (log.includes('ERROR') || log.includes('FAILED')) {
                logColor = '#f87171' // clean red
              } else if (log.includes('COMPLETED SUCCESSFULLY')) {
                logColor = '#34d399' // intense green
              } else if (log.includes('Initiating') || log.includes('queue')) {
                logColor = '#60a5fa' // modern blue
              }

              return (
                <div key={idx} style={{ marginBottom: '6px', whiteSpace: 'pre-wrap', color: logColor }}>
                  {log}
                </div>
              )
            })}

            {isProcessing && (
              <div
                className="pulse-waiting"
                style={{
                  color: 'var(--accent)',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 500
                }}
              >
                ⚡ Waiting for next record stream packet...
              </div>
            )}
            <div ref={logTerminalEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Action buttons on Complete */}
      {!isProcessing && (
        <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-end', marginTop: '10px' }}>
          <button
            type="button"
            onClick={resetState}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(var(--accent-rgb, 59, 130, 246), 0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            🔄 Start Another Bulk Run
          </button>
        </div>
      )}
    </div>
  )
}
