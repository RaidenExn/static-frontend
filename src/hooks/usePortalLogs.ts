import { useState, useEffect } from 'react'
import { resolveWsUrl, customFetch as fetch } from '../config/backend'

export function usePortalLogs() {
  const [logs, setLogs] = useState<Array<{ timestamp: string; type: string; message: string }>>([])
  const [logsLoading, setLogsLoading] = useState<boolean>(false)

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const response = await fetch('/api/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (e) {
      console.error('Failed to fetch system logs:', e)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: any = null

    const connectWS = () => {
      try {
        const wsUrl = resolveWsUrl('/ws/logs')
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('[WS] Live log broadcast channel connected.')
        }

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data)
            if (payload.type === 'history') {
              setLogs(payload.data)
            } else if (payload.type === 'log') {
              setLogs((prev) => {
                const updated = [...prev, payload.data]
                return updated.slice(-1000)
              })
            } else if (payload.type === 'trigger-transfer-prompt') {
              console.log('[WS] Received trigger-transfer-prompt event')
              const btn = document.getElementById('autoPromptButton')
              if (btn) {
                btn.click()
              } else {
                console.warn('[WS] autoPromptButton element not found in DOM')
              }
            }
          } catch (e) {
            console.error('[WS] Error parsing live log message:', e)
          }
        }

        ws.onclose = () => {
          console.warn('[WS] Connection lost. Reconnecting in 3 seconds...')
          reconnectTimeout = setTimeout(connectWS, 3000)
        }

        ws.onerror = (err) => {
          console.error('[WS] Connection error:', err)
          ws?.close()
        }
      } catch (e) {
        console.error('[WS] Initial socket error:', e)
        reconnectTimeout = setTimeout(connectWS, 3000)
      }
    }

    connectWS()

    return () => {
      if (ws) {
        ws.onclose = null
        ws.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [])

  return {
    logs,
    logsLoading,
    fetchLogs
  }
}
