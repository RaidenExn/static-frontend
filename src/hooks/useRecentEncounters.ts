import { useState, useEffect } from 'react'
import { customFetch as fetch } from '../config/backend'

export function useRecentEncounters() {
  const [recentEncounters, setRecentEncounters] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/encounters/recent')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const list = data
            .map((val) => String(val).trim().toUpperCase())
            .filter((val) => val.length >= 5 && val.length <= 35)
          setRecentEncounters(list.slice(0, 8))
        }
      })
      .catch(() => {})
  }, [])

  const addRecentEncounter = (enc: string) => {
    const cleanEnc = enc.trim().toUpperCase()
    if (!cleanEnc || cleanEnc.length < 5 || cleanEnc.length > 35) return

    setRecentEncounters((prev) => {
      const filtered = prev.filter((item) => item !== cleanEnc)
      return [cleanEnc, ...filtered].slice(0, 8)
    })

    fetch('/api/encounters/recent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounter: cleanEnc })
    }).catch(() => {})
  }

  const clearRecentEncounters = () => {
    setRecentEncounters([])
    fetch('/api/encounters/recent', { method: 'DELETE' }).catch(() => {})
  }

  return { recentEncounters, addRecentEncounter, clearRecentEncounters }
}
