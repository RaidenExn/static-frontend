import { useEffect, useRef } from 'react'

import { resolveWsUrl } from '../config/backend'

interface UseEncounterSyncProps {
  encounterNumber: string | undefined
  onUpdate: () => void
}

export function useEncounterSync({ encounterNumber, onUpdate }: UseEncounterSyncProps) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!encounterNumber) return

    const cleanEnc = String(encounterNumber).trim().toUpperCase()
    let ws: WebSocket | null = null
    let reconnectTimeout: any = null
    let isDisposed = false

    const connectWS = () => {
      if (isDisposed) return

      try {
        const wsUrl = resolveWsUrl('/ws')
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          if (isDisposed) {
            ws?.close()
            return
          }
          console.log(`[WS Sync] Connected. Subscribing to encounter:${cleanEnc}...`)
          ws?.send(JSON.stringify({ type: 'subscribe', encounter: cleanEnc }))
        }

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data)
            if (payload?.type === 'encounter_updated' && payload?.encounter === cleanEnc) {
              console.log(`[WS Sync] Received encounter_updated for ${cleanEnc}! Triggering soft refresh...`)
              onUpdateRef.current()
            }
          } catch (e) {
            console.error('[WS Sync] Error parsing event message:', e)
          }
        }

        ws.onclose = () => {
          if (!isDisposed) {
            console.log('[WS Sync] Connection closed. Reconnecting in 3s...')
            reconnectTimeout = setTimeout(connectWS, 3000)
          }
        }

        ws.onerror = (err) => {
          console.error('[WS Sync] Socket error:', err)
          ws?.close()
        }
      } catch (err) {
        console.error('[WS Sync] Failed to create socket connection:', err)
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connectWS, 3000)
        }
      }
    }

    connectWS()

    return () => {
      isDisposed = true
      clearTimeout(reconnectTimeout)
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'unsubscribe', encounter: cleanEnc }))
        } catch (e) {}
        ws.close()
      }
    }
  }, [encounterNumber])
}
