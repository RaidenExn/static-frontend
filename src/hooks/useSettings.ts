import { useState, useEffect } from 'react'
import { useForm } from '@mantine/form'
import { resolveWsUrl, customFetch as fetch } from '../config/backend'

interface UseSettingsProps {
  active: boolean
  showToast: (_text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
}

export function useSettings({ active, showToast }: UseSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [employees, setEmployees] = useState<any[]>([])

  // Initialize Mantine's form controller to manage all values and validation rules natively
  const form = useForm({
    initialValues: {
      hospital: {
        defaultUserId: 1089,
        defaultUserName: '',
        roleId: '',
        vendorId: '',
        insuranceMappingId: '',
        receiverIdFallback: '',
        icdDefaults: {
          isChronic: 0,
          isCoded: 0,
          isSymptom: 0,
          prodId: 0
        },
        downloadUrl: '',
        hospitalUrl: '',
        customerId: '',
        siteIds: [] as any,
        searchMonths: '',
        resultMonths: '',
        cacheTtlMs: '',
        remoteTimeoutMs: '',
        batchEncounterConcurrency: '',
        upstreamConcurrency: '',
        patientFileTypes: [] as any
      },
      legacyPrompt: {
        deniedHeader: '',
        demographicsHeader: ''
      }
    }
  })

  // Fetch settings on mount/active change
  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/config/settings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // Initialize form values and clear any dirty/touched history cleanly
      form.initialize(data)

      const empRes = await fetch('/api/config/employees')
      if (empRes.ok) {
        const empData = await empRes.json()
        setEmployees(empData)
      }
    } catch (err: any) {
      console.error('[Settings] Load failed:', err)
      showToast('Failed to load system configurations.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (active) {
      fetchSettings()
    }
  }, [active])

  // Track websocket connection state
  useEffect(() => {
    if (!active) return

    let socket: WebSocket | null = null
    const connect = () => {
      setWsStatus('connecting')
      const wsUrl = resolveWsUrl('/')

      try {
        socket = new WebSocket(wsUrl)
        socket.onopen = () => setWsStatus('connected')
        socket.onclose = () => {
          setWsStatus('disconnected')
          setTimeout(connect, 5000) // Auto-reconnect
        }
        socket.onerror = () => setWsStatus('disconnected')
      } catch {
        setWsStatus('disconnected')
      }
    }

    connect()
    return () => {
      if (socket) {
        socket.onclose = null
        socket.close()
      }
    }
  }, [active])

  // Expose a helper to let nested selectors update inner form nodes cleanly
  const updateNestedSetting = (keyPath: string[], value: any) => {
    const fieldPath = keyPath.join('.')
    form.setFieldValue(fieldPath, value)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = JSON.parse(JSON.stringify(form.values))

      if (payload.hospital.defaultUserId !== undefined) {
        payload.hospital.defaultUserId = parseInt(payload.hospital.defaultUserId, 10)
      }

      const res = await fetch('/api/config/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.message || 'Server Save Error')
      }

      showToast('Configurations successfully synced.', 'ok')
      form.clearErrors()
    } catch (err: any) {
      console.error('[Settings] Save failed:', err)
      showToast(`Save failed: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = async () => {
    if (
      !confirm(
        'Are you sure you want to reset configuration settings back to default baseline? This cannot be undone.'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/config/seed-prompts')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast('System settings restored to baseline default models.', 'ok')
      await fetchSettings()
    } catch (err: any) {
      console.error('[Settings] Reset failed:', err)
      showToast('Failed to reset defaults.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return {
    settings: form.values,
    form,
    loading,
    saving,
    wsStatus,
    validationErrors: form.errors,
    employees,
    updateNestedSetting,
    handleSave,
    handleResetDefaults
  }
}
