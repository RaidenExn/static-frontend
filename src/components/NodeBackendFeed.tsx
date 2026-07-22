import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  Group,
  Text,
  TextInput,
  SegmentedControl,
  Badge,
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

interface ParsedLog {
  timestamp: string
  originalType: string
  category: string
  color: string
  message: string
  cleanMessage: string
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
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isCleared, setIsCleared] = useState(false)

  const activeLogs = useMemo(() => {
    if (isCleared) return []
    return logs
  }, [logs, isCleared])

  // Parse logs into structured metadata categories
  const parsedLogs = useMemo<ParsedLog[]>(() => {
    return activeLogs.map((log) => {
      const msg = log.message || ''
      let category = 'INFO'
      let color = 'gray'
      let cleanMessage = msg

      if (msg.startsWith('[HTTP]')) {
        category = 'HTTP'
        color = 'grape'
        cleanMessage = msg.replace('[HTTP]', '').trim()
      } else if (msg.startsWith('[HTTP/Fallback]')) {
        category = 'HTTP'
        color = 'grape'
        cleanMessage = msg.replace('[HTTP/Fallback]', '').trim()
      } else if (msg.startsWith('[WS]')) {
        category = 'WS'
        color = 'teal'
        cleanMessage = msg.replace('[WS]', '').trim()
      } else if (msg.startsWith('[PDF-DAEMON]')) {
        category = 'PDF'
        color = 'indigo'
        cleanMessage = msg.replace('[PDF-DAEMON]', '').trim()
      } else if (msg.startsWith('[Download]')) {
        category = 'PDF'
        color = 'indigo'
        cleanMessage = msg.replace('[Download]', '').trim()
      } else if (log.type === 'error' || msg.toLowerCase().includes('error')) {
        category = 'ERROR'
        color = 'red'
      } else if (log.type === 'warn' || msg.toLowerCase().includes('warn')) {
        category = 'WARN'
        color = 'yellow'
      } else if (log.type === 'info') {
        category = 'INFO'
        color = 'blue'
      }

      return {
        timestamp: log.timestamp || '',
        originalType: log.type || 'info',
        category,
        color,
        message: msg,
        cleanMessage
      }
    })
  }, [activeLogs])

  // Filter parsed logs based on Category Segment and Search bar Query
  const filteredLogs = useMemo(() => {
    return parsedLogs.filter((log) => {
      // Filter by category
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'HTTP' && log.category !== 'HTTP') return false
        if (selectedCategory === 'WS' && log.category !== 'WS') return false
        if (selectedCategory === 'Info' && log.category !== 'INFO') return false
        if (selectedCategory === 'Warn' && log.category !== 'WARN') return false
        if (selectedCategory === 'Error' && log.category !== 'ERROR') return false
      }

      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        return (
          log.message.toLowerCase().includes(query) ||
          log.timestamp.toLowerCase().includes(query) ||
          log.category.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [parsedLogs, selectedCategory, searchQuery])

  // Auto-scroll logic locked to real-time additions
  useEffect(() => {
    if (autoScroll && terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll, terminalBodyRef])

  const formatTimestamp = (ts: string) => {
    if (!ts) return ''
    const match = ts.match(/T(\d{2}:\d{2}:\d{2}\.\d{3})/)
    return match ? match[1] : ts.replace('T', ' ').substring(0, 19)
  }

  return (
    <Card
      withBorder
      radius="sm"
      p="md"
      style={{
        height: 'calc(100vh - 170px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--panel)',
        borderColor: 'var(--line)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Premium Header Row */}
      <Group justify="space-between" align="center" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '12px' }}>
        <Group gap="xs">
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--panel-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Terminal size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <Text size="sm" fw={800} style={{ letterSpacing: '0.5px' }}>
              🖥️ BACKEND SYSTEM LOGS
            </Text>
            <Text size="10px" c="dimmed" fw={600}>
              REAL-TIME EVENT BROADCAST & TRACING
            </Text>
          </div>
        </Group>

        <Group gap="xs">
          <span className="pulse-dot" style={{ backgroundColor: logsLoading ? 'var(--accent)' : '#8b949e' }} />
          <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '0.2px' }}>
            {logsLoading ? 'STREAMING...' : `CONNECTED (${filteredLogs.length}/${activeLogs.length} logs)`}
          </Text>
        </Group>
      </Group>

      {/* Control Bar: Search, Category Filter, and Actions */}
      <Group gap="xs" style={{ marginBottom: '12px' }} wrap="wrap">
        <TextInput
          size="xs"
          placeholder="Search log trace..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<Search size={12} />}
          style={{ flex: 1, minWidth: '180px' }}
        />

        <SegmentedControl
          size="xs"
          value={selectedCategory}
          onChange={setSelectedCategory}
          data={[
            { label: 'All', value: 'All' },
            { label: 'Info', value: 'Info' },
            { label: 'Warn', value: 'Warn' },
            { label: 'Error', value: 'Error' },
            { label: 'HTTP', value: 'HTTP' },
            { label: 'WS', value: 'WS' }
          ]}
        />

        <Tooltip label="Clear Session Logs" openDelay={0} closeDelay={0}>
          <ActionIcon
            variant="light"
            color="red"
            size="md"
            onClick={() => setIsCleared(true)}
            disabled={activeLogs.length === 0}
          >
            <Trash2 size={14} />
          </ActionIcon>
        </Tooltip>

        {isCleared && (
          <Tooltip label="Restore Session Logs" openDelay={0} closeDelay={0}>
            <ActionIcon
              variant="light"
              color="blue"
              size="md"
              onClick={() => setIsCleared(false)}
            >
              <Activity size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* High-density Log Streaming Panel */}
      <Box
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--border-radius)',
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
            padding: '10px',
            fontFamily: 'var(--mantine-font-family-monospace)',
            fontSize: '11px',
            lineHeight: '1.5'
          }}
        >
          {filteredLogs.length === 0 ? (
            <div
              style={{
                color: 'var(--muted)',
                textAlign: 'center',
                paddingTop: '60px',
                fontWeight: 600
              }}
            >
              No matching system logs available. Action triggers will stream here.
            </div>
          ) : (
            filteredLogs.map((row, idx) => (
              <Group
                key={idx}
                gap="xs"
                align="flex-start"
                wrap="nowrap"
                style={{
                  padding: '2px 4px',
                  borderRadius: '2px',
                  backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                  minHeight: '20px'
                }}
              >
                <Text
                  size="10px"
                  span
                  c="dimmed"
                  style={{
                    fontFamily: 'var(--mantine-font-family-monospace)',
                    whiteSpace: 'nowrap',
                    opacity: 0.7,
                    marginTop: '2px'
                  }}
                >
                  [{formatTimestamp(row.timestamp)}]
                </Text>

                <Badge
                  color={row.color}
                  size="10px"
                  radius="xs"
                  variant="light"
                  style={{
                    minWidth: '55px',
                    textAlign: 'center',
                    padding: '0 4px',
                    height: '16px',
                    lineHeight: '16px',
                    fontWeight: 800,
                    fontSize: '9px',
                    marginTop: '2px'
                  }}
                >
                  {row.category}
                </Badge>

                <Text
                  span
                  size="xs"
                  style={{
                    fontFamily: 'var(--mantine-font-family-monospace)',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    color: row.originalType === 'error' ? 'var(--mantine-color-red-4)' : 'var(--text-primary)'
                  }}
                >
                  {row.cleanMessage}
                </Text>
              </Group>
            ))
          )}
        </div>
      </Box>

      {/* Auto-scroll overlay banner if scrolled away from bottom */}
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
