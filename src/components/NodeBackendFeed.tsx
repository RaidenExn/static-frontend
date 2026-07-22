import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  Group,
  Text,
  TextInput,
  ActionIcon,
  Tooltip,
  Box
} from '@mantine/core'
import { Search, Trash2, Terminal, ArrowDown, Activity } from 'lucide-react'

interface NodeBackendFeedProps {
  logs: any[]
  logsLoading: boolean
  terminalBodyRef: React.RefObject<HTMLDivElement | null>
  onTerminalScroll: () => void
  autoScroll: boolean
  onToggleAutoScroll: (val: boolean) => void
}

// Convert ANSI escape codes into colored React spans for native pino-pretty rendering
function renderAnsiString(text: string) {
  if (!text) return null

  // Strip or parse ANSI escape sequences
  const parts = text.split(/\u001b\[([0-9;]*)m/)
  let currentColor = ''
  let isBold = false

  const elements: React.ReactNode[] = []

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // Code part
      const code = parts[i]
      if (code === '0' || code === '') {
        currentColor = ''
        isBold = false
      } else if (code === '1') {
        isBold = true
      } else if (code === '90' || code === '30') {
        currentColor = '#808080' // Dimmed / Grey
      } else if (code === '31' || code === '91') {
        currentColor = '#ff6b6b' // Red
      } else if (code === '32' || code === '92') {
        currentColor = '#51cf66' // Green
      } else if (code === '33' || code === '93') {
        currentColor = '#fcc419' // Yellow
      } else if (code === '34' || code === '94') {
        currentColor = '#339af0' // Blue
      } else if (code === '35' || code === '95') {
        currentColor = '#cc5de8' // Magenta
      } else if (code === '36' || code === '96') {
        currentColor = '#20c997' // Cyan
      } else if (code === '37' || code === '97') {
        currentColor = '#f8f9fa' // White
      }
    } else {
      // Text content part
      const content = parts[i]
      if (content) {
        elements.push(
          <span
            key={i}
            style={{
              color: currentColor || 'inherit',
              fontWeight: isBold ? 'bold' : 'normal'
            }}
          >
            {content}
          </span>
        )
      }
    }
  }

  return elements
}

export const NodeBackendFeed: React.FC<NodeBackendFeedProps> = ({
  logs,
  logsLoading,
  terminalBodyRef,
  onTerminalScroll,
  autoScroll,
  onToggleAutoScroll
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCleared, setIsCleared] = useState(false)

  const activeLogs = useMemo(() => {
    if (isCleared) return []
    return logs
  }, [logs, isCleared])

  // Extract raw log string messages for native rendering
  const logStrings = useMemo(() => {
    return activeLogs.map((log) => {
      if (typeof log === 'string') return log
      if (log.message) return String(log.message)
      if (log.data) return typeof log.data === 'string' ? log.data : JSON.stringify(log.data)
      return JSON.stringify(log)
    })
  }, [activeLogs])

  // Filter logs based on search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logStrings
    const q = searchQuery.toLowerCase()
    return logStrings.filter((msg) => msg.toLowerCase().includes(q))
  }, [logStrings, searchQuery])

  // Auto-scroll logic locked to real-time additions
  useEffect(() => {
    if (autoScroll && terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll, terminalBodyRef])

  return (
    <Card
      padding="0"
      radius="sm"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 170px)',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Control Header */}
      <Box
        p="xs"
        style={{
          borderBottom: '1px solid var(--line)',
          backgroundColor: 'var(--bg-translucent)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs">
            <Terminal size={16} style={{ color: 'var(--accent)' }} />
            <Text size="sm" fw={700} style={{ color: 'var(--text-primary)' }}>
              Native Pino Stream Inspector
            </Text>
            <Activity
              size={14}
              style={{
                color: logsLoading ? 'var(--mantine-color-yellow-5)' : 'var(--mantine-color-green-5)'
              }}
            />
          </Group>

          <Group gap="xs" wrap="nowrap">
            <TextInput
              placeholder="Filter logs..."
              size="xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<Search size={12} />}
              styles={{
                input: {
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  fontSize: '11px',
                  height: '28px'
                }
              }}
            />

            <Tooltip label="Clear local terminal buffer" openDelay={0} closeDelay={0}>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => setIsCleared(true)}
              >
                <Trash2 size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* Terminal Output Area */}
      <Box
        style={{
          flex: 1,
          backgroundColor: '#0d1117',
          color: '#c9d1d9',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          ref={terminalBodyRef}
          onScroll={onTerminalScroll}
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '12px',
            fontFamily: 'var(--mantine-font-family-monospace)',
            fontSize: '11px',
            lineHeight: '1.5'
          }}
        >
          {filteredLogs.length === 0 ? (
            <div
              style={{
                color: '#8b949e',
                textAlign: 'center',
                paddingTop: '60px',
                fontWeight: 600
              }}
            >
              No matching system logs available. Native pino stream will output here.
            </div>
          ) : (
            filteredLogs.map((line, idx) => (
              <div
                key={idx}
                style={{
                  fontFamily: 'var(--mantine-font-family-monospace)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  padding: '1px 0'
                }}
              >
                {renderAnsiString(line)}
              </div>
            ))
          )}
        </div>
      </Box>

      {/* Auto-scroll overlay button */}
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
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'var(--bg-translucent)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid var(--accent)',
            color: 'var(--accent)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowDown size={12} />
          Resume Auto-scroll
        </button>
      )}
    </Card>
  )
}
