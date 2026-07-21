import { useState, useEffect } from 'react'
import { useForm } from '@mantine/form'
import { ensureNotificationPermission } from '../utils'
import { resolveWsUrl, customFetch as fetch } from '../config/backend'

interface UseSettingsProps {
  active: boolean
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
}

export function useSettings({ active, showToast }: UseSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fixingPermissions, setFixingPermissions] = useState(false)
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [employees, setEmployees] = useState<any[]>([])
  const [permissionStatus, setPermissionStatus] = useState<{ clipboard: string; notifications: string }>({
    clipboard: 'unknown',
    notifications: 'unknown'
  })

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
    },
    validate: {
      hospital: {
        roleId: (val) => (isNaN(Number(val)) || !Number.isInteger(Number(val)) ? 'Role ID must be an integer.' : null),
        vendorId: (val) =>
          isNaN(Number(val)) || !Number.isInteger(Number(val)) ? 'Vendor ID must be an integer.' : null,
        insuranceMappingId: (val) =>
          isNaN(Number(val)) || !Number.isInteger(Number(val)) ? 'Insurance Mapping ID must be an integer.' : null,
        receiverIdFallback: (val) => (!val?.toString().trim() ? 'Fallback receiver ID cannot be empty.' : null),
        customerId: (val) => (val !== undefined && isNaN(Number(val)) ? 'Customer ID must be an integer.' : null),
        searchMonths: (val) =>
          isNaN(Number(val)) || Number(val) < 1 ? 'Search months must be a positive integer.' : null,
        resultMonths: (val) =>
          isNaN(Number(val)) || Number(val) < 1 ? 'Result months must be a positive integer.' : null,
        cacheTtlMs: (val) =>
          isNaN(Number(val)) || Number(val) < 0 ? 'Cache TTL must be a non-negative integer.' : null,
        batchEncounterConcurrency: (val) =>
          isNaN(Number(val)) || Number(val) < 1 ? 'Concurrency must be at least 1.' : null,
        upstreamConcurrency: (val) =>
          isNaN(Number(val)) || Number(val) < 1 ? 'Upstream concurrency must be at least 1.' : null,
        remoteTimeoutMs: (val) =>
          isNaN(Number(val)) || Number(val) < 1000 ? 'Timeout must be at least 1000ms.' : null,
        downloadUrl: (val) => (!val?.toString().trim() ? 'Download URL cannot be empty.' : null),
        hospitalUrl: (val) => (!val?.toString().trim() ? 'Hospital services URL cannot be empty.' : null)
      },
      legacyPrompt: {
        deniedHeader: (val) => (!val?.toString().trim() ? 'Denied header template cannot be empty.' : null),
        demographicsHeader: (val) => (!val?.toString().trim() ? 'Demographics header template cannot be empty.' : null)
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

  const probePermissionStatus = async () => {
    const clipboard = await (async () => {
      if (!navigator.permissions?.query) return 'unsupported'
      try {
        const status = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName })
        return status.state
      } catch {
        return 'unsupported'
      }
    })()

    const notifications = 'Notification' in window ? Notification.permission : 'unsupported'
    setPermissionStatus({
      clipboard,
      notifications
    })

    return { clipboard, notifications }
  }

  const requestClipboardPermission = async () => {
    if (!navigator.clipboard?.writeText) {
      return false
    }

    const probeText = `Portal clipboard permission probe ${new Date().toISOString()}`
    try {
      await navigator.clipboard.writeText(probeText)
      return true
    } catch (err) {
      console.warn('[Settings] Clipboard write probe failed:', err)
      return false
    }
  }

  const handleFixPermissions = async () => {
    setFixingPermissions(true)
    try {
      const before = await probePermissionStatus()
      const results: string[] = []

      if (before.notifications !== 'granted') {
        const granted = await ensureNotificationPermission()
        results.push(granted ? 'Notifications granted' : 'Notifications not granted')
      } else {
        results.push('Notifications already granted')
      }

      const clipboardGranted = before.clipboard === 'granted' ? true : await requestClipboardPermission()

      if (clipboardGranted) {
        results.push('Clipboard access available')
      } else if (before.clipboard === 'unsupported') {
        results.push('Clipboard permissions unsupported by this browser')
      } else {
        results.push('Clipboard access still blocked')
      }

      await probePermissionStatus()

      showToast(results.join(' • '), clipboardGranted ? 'ok' : 'warning')
    } catch (err: any) {
      console.error('[Settings] Permission fix failed:', err)
      showToast(`Failed to update permissions: ${err.message}`, 'error')
    } finally {
      setFixingPermissions(false)
    }
  }

  useEffect(() => {
    if (active) {
      fetchSettings()
      void probePermissionStatus()
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
    // Validate form natively using `@mantine/form`
    const validation = form.validate()
    if (validation.hasErrors) {
      showToast('Validation errors detected. Please review highlighted cards.', 'warning')
      return
    }

    setSaving(true)
    try {
      // Cast fields to correct types before dispatching to backend
      const payload = JSON.parse(JSON.stringify(form.values))

      payload.hospital.roleId = parseInt(payload.hospital.roleId, 10)
      payload.hospital.vendorId = parseInt(payload.hospital.vendorId, 10)
      payload.hospital.insuranceMappingId = parseInt(payload.hospital.insuranceMappingId, 10)

      if (payload.hospital.defaultUserId !== undefined) {
        payload.hospital.defaultUserId = parseInt(payload.hospital.defaultUserId, 10)
      }

      Object.keys(payload.hospital.icdDefaults).forEach((k) => {
        payload.hospital.icdDefaults[k] = parseInt(payload.hospital.icdDefaults[k], 10)
      })

      payload.hospital.customerId = parseInt(payload.hospital.customerId, 10)
      payload.hospital.searchMonths = parseInt(payload.hospital.searchMonths, 10)
      payload.hospital.resultMonths = parseInt(payload.hospital.resultMonths, 10)
      payload.hospital.cacheTtlMs = parseInt(payload.hospital.cacheTtlMs, 10)
      payload.hospital.batchEncounterConcurrency = parseInt(payload.hospital.batchEncounterConcurrency, 10)
      payload.hospital.upstreamConcurrency = parseInt(payload.hospital.upstreamConcurrency, 10)
      payload.hospital.remoteTimeoutMs = parseInt(payload.hospital.remoteTimeoutMs, 10)

      // Handle array parsing from string inputs
      if (typeof payload.hospital.siteIds === 'string') {
        payload.hospital.siteIds = payload.hospital.siteIds
          .split(',')
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id: number) => !isNaN(id))
      }
      if (typeof payload.hospital.patientFileTypes === 'string') {
        payload.hospital.patientFileTypes = payload.hospital.patientFileTypes
          .split(',')
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id: number) => !isNaN(id))
      }

      const res = await fetch('/api/config/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const resData = await res.json()
      if (!res.ok) {
        if (resData.error === 'validation_error') {
          // Map backend errors back into the form fields natively
          const errs: Record<string, string> = {}
          resData.details?.forEach((err: any) => {
            errs[err.path.join('.')] = err.message
          })
          form.setErrors(errs)
          throw new Error(resData.message)
        }
        throw new Error(resData.message || 'Server Save Error')
      }

      showToast('Configurations successfully synced and written to YAML files.', 'ok')
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
        'Are you sure you want to reset all prompt and hospital configurations back to seed baseline defaults? This cannot be undone.'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/config/seed-prompts')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast('System settings and templates restored to baseline default models.', 'ok')
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
    fixingPermissions,
    wsStatus,
    permissionStatus,
    validationErrors: form.errors, // Map to form.errors for total backward compatibility
    employees,
    updateNestedSetting,
    handleSave,
    handleResetDefaults,
    handleFixPermissions
  }
}
