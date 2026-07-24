import { useState, useEffect, useCallback } from 'react'
import { customFetch as fetch } from '../config/backend'

export function useSystemInstructions() {
  const [systemInstructions, setSystemInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prompt/system-instructions')
      if (res.ok) {
        const data = await res.json()
        setSystemInstructions(data.systemInstructions || '')
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('/api/prompt/system-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstructions })
      })
    } finally {
      setSaving(false)
    }
  }, [systemInstructions])

  return { systemInstructions, setSystemInstructions, loading, saving, save, reload: load }
}
