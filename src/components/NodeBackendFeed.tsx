import React from 'react'

interface NodeBackendFeedProps {
  logs: any[]
  logsLoading: boolean
  terminalBodyRef: React.RefObject<HTMLDivElement | null>
  onTerminalScroll: () => void
  autoScroll: boolean
  onToggleAutoScroll: (val: boolean) => void
}

export const NodeBackendFeed: React.FC<NodeBackendFeedProps> = ({
  logs,
  logsLoading,
  terminalBodyRef,
  onTerminalScroll,
  autoScroll,
  onToggleAutoScroll
}) => {
  return (
    <section className="terminal-container" style={{ position: 'relative' }}>
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
        </div>
        <div className="terminal-title">🖥️ NODE.JS BACKEND FEED</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600 }}>
            {logsLoading ? 'STREAMING...' : `LIVE FEED (${logs.length} logs)`}
          </span>
        </div>
      </div>
      <div className="terminal-body" ref={terminalBodyRef} onScroll={onTerminalScroll}>
        {logs.length === 0 ? (
          <div className="terminal-line" style={{ color: '#8b949e', textAlign: 'center', marginTop: '40px' }}>
            No server logs available yet. Action triggers on the portal will stream logs in real time.
          </div>
        ) : (
          logs.map((row, idx) => (
            <div key={idx} className="terminal-line">
              <span className="timestamp">[{row.timestamp.replace('T', ' ').substring(0, 19)}]</span>
              <span className={`level-${row.type}`}>[{row.type.toUpperCase()}]</span>
              {row.message}
            </div>
          ))
        )}
      </div>
      {!autoScroll && (
        <button
          onClick={() => {
            onToggleAutoScroll(true)
            if (terminalBodyRef.current) {
              terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
            }
          }}
          type="button"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'rgba(56, 139, 253, 0.25)',
            border: '1.5px solid var(--accent)',
            color: 'var(--accent)',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            outline: 'none',
            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          ⬇️ Resume Auto-scroll
        </button>
      )}
    </section>
  )
}
