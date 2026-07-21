import React from 'react'
import { RcmActivity, RcmRemark, RcmResubmission } from '../types'
import { activityRaStatus, priorAuthCode, getShortcode } from '../utils'
import { usePortal } from '../context/PortalContext'
import { customFetch as fetch } from '../config/backend'

export interface Observation {
  obsvid?: number
  patId: number
  encounterId: number
  orderId: number
  observation_type: number
  observation_value?: string | null
  observation_desc?: string | null
  observation_code?: number | null
  observation_code_value?: string | null
  observation_value_type?: number | null
  file_ext?: string | null
  filePath?: string | null
  isActive: number
  createdBy: number
  physicianId: number
  createdDate?: string
}

export interface ObsType {
  id: number
  name: string
}

export interface ObsCode {
  code: number
  name: string
}

interface UseActivityStateProps {
  activityRows: RcmActivity[]
  remarksRows: RcmRemark[]
  resubmissionsRows: RcmResubmission[]
  rowActions: Record<number, 're-sub' | 'w-off' | 'close'>
  setRowActions: React.Dispatch<React.SetStateAction<Record<number, 're-sub' | 'w-off' | 'close'>>>
  canSaveRaRemarks: boolean
  encounter: string
  encounterStartDate: string
  encounterEndDate: string
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
  shortcodes?: Record<string, string | string[]>
}

export function useActivityState({
  activityRows,
  rowActions,
  setRowActions,
  canSaveRaRemarks,
  encounter,
  encounterStartDate,
  encounterEndDate,
  showToast,
  shortcodes = {}
}: UseActivityStateProps) {
  const { setResubmitType } = usePortal()
  const [denialCodesMap, setDenialCodesMap] = React.useState<Record<string, string>>({})

  const [encStartInput, setEncStartInput] = React.useState('')
  const [encEndInput, setEncEndInput] = React.useState('')
  const [isSavingEncDates, setIsSavingEncDates] = React.useState(false)

  const [editingAuthId, setEditingAuthId] = React.useState<number | null>(null)
  const [tempAuthCode, setTempAuthCode] = React.useState<string>('')
  const [tempAuthStartDate, setTempAuthStartDate] = React.useState<string>('')
  const [tempAuthExpiryDate, setTempAuthExpiryDate] = React.useState<string>('')
  const [isSavingAuth, setIsSavingAuth] = React.useState(false)

  // Batch Auth Dates States
  const [batchAuthStartInput, setBatchAuthStartInput] = React.useState('')
  const [batchAuthExpiryInput, setBatchAuthExpiryInput] = React.useState('')
  const [batchActivityStartInput, setBatchActivityStartInput] = React.useState('')
  const [isSavingBatchAuthDates, setIsSavingBatchAuthDates] = React.useState(false)

  // Double-Click Inline Editing and Highlighting States
  const [editingCell, setEditingCell] = React.useState<{
    authId: number
    field: 'code' | 'start' | 'expiry' | 'activityStart'
  } | null>(null)
  const [editValue, setEditValue] = React.useState<string>('')
  const [modifiedCells, setModifiedCells] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    setEncStartInput(encounterStartDate || '')
    setEncEndInput(encounterEndDate || '')
  }, [encounterStartDate, encounterEndDate])

  // Observations states
  const [selectedActivityForObs, setSelectedActivityForObs] = React.useState<RcmActivity | null>(null)
  const [isObsModalOpen, setIsObsModalOpen] = React.useState(false)
  const [observations, setObservations] = React.useState<Observation[]>([])
  const [loadingObs, setLoadingObs] = React.useState(false)
  const [savingObs, setSavingObs] = React.useState(false)

  // Master Data
  const [obsTypes, setObsTypes] = React.useState<ObsType[]>([
    { id: 1, name: 'Result Value (LOINC)' },
    { id: 2, name: 'Text Evidence / Clinical Note' },
    { id: 3, name: 'File Attachment (PDF)' },
    { id: 8, name: 'Evidence Code' }
  ])
  const [obsCodes, setObsCodes] = React.useState<ObsCode[]>([
    { code: 1001, name: 'LOINC 8310-5: Body temperature' },
    { code: 1002, name: 'LOINC 8867-4: Heart rate' },
    { code: 1003, name: 'LOINC 9279-1: Respiratory rate' },
    { code: 1004, name: 'LOINC 8480-6: Systolic blood pressure' },
    { code: 1005, name: 'LOINC 8462-4: Diastolic blood pressure' },
    { code: 1006, name: 'LOINC 29463-7: Body weight' },
    { code: 1007, name: 'LOINC 3141-9: Body height' },
    { code: 1008, name: 'LOINC 777-3: Platelets in Blood' },
    { code: 1009, name: 'LOINC 718-7: Hemoglobin in Blood' }
  ])

  // Form Fields
  const [editingObsvid, setEditingObsvid] = React.useState<number | undefined>(undefined)
  const [obsType, setObsType] = React.useState<number>(2) // Default to Text Evidence
  const [obsValue, setObsValue] = React.useState<string>('')
  const [obsDesc, setObsDesc] = React.useState<string>('')
  const [obsCode, setObsCode] = React.useState<number>(1001)
  const [obsCodeValue, setObsCodeValue] = React.useState<string>('')
  const [obsValueType, setObsValueType] = React.useState<number>(1)

  // File Upload
  const [uploadingObs, setUploadingObs] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const [uploadedFilePath, setUploadedFilePath] = React.useState<string | null>(null)
  const [uploadedFileExt, setUploadedFileExt] = React.useState<string | null>(null)
  const [fileNameDisplay, setFileNameDisplay] = React.useState<string>('')

  // Load types, codes and observations on encounter change
  React.useEffect(() => {
    const encId = Number(encounter)
    if (!encounter || encounter === '-' || isNaN(encId)) {
      setObservations([])
      return
    }

    // Load master types
    fetch('/api/master/observation/type/get')
      .then((r) => r.json())
      .then((data) => {
        if (data.types) setObsTypes(data.types)
      })
      .catch((err) => console.warn('Failed to load master types:', err))

    // Load master codes
    fetch('/api/master/observation/code/get', { method: 'POST', body: JSON.stringify({}) })
      .then((r) => r.json())
      .then((data) => {
        if (data.codes) setObsCodes(data.codes)
      })
      .catch((err) => console.warn('Failed to load master codes:', err))

    fetchObservations()
  }, [encounter])

  const fetchObservations = async () => {
    const encId = Number(encounter)
    if (!encounter || encounter === '-' || isNaN(encId)) return
    setLoadingObs(true)
    try {
      const res = await fetch('/api/patient/observation/order/details/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterId: encId })
      })
      if (res.ok) {
        const data = await res.json()
        setObservations(data.observations || [])
      }
    } catch (err) {
      console.error('Failed to load observations:', err)
    } finally {
      setLoadingObs(false)
    }
  }

  // Count of active observations per order/activity
  const observationCounts = React.useMemo(() => {
    const counts: Record<number, number> = {}
    observations.forEach((obs) => {
      if (obs.isActive === 1) {
        counts[obs.orderId] = (counts[obs.orderId] || 0) + 1
      }
    })
    return counts
  }, [observations])

  // Observations filtered by currently selected activity for observations
  const filteredObservations = React.useMemo(() => {
    if (!selectedActivityForObs) return []
    const authId = Number(selectedActivityForObs.order_authorization_id)
    return observations.filter((obs) => obs.orderId === authId && obs.isActive === 1)
  }, [observations, selectedActivityForObs])

  const resetForm = () => {
    setEditingObsvid(undefined)
    setObsValue('')
    setObsDesc('')
    setObsCode(obsCodes[0]?.code || 1001)
    setObsCodeValue('')
    setObsValueType(1)
    setUploadedFilePath(null)
    setUploadedFileExt(null)
    setFileNameDisplay('')
  }

  const handleEditObs = (obs: Observation) => {
    setEditingObsvid(obs.obsvid)
    setObsType(obs.observation_type)
    setObsValue(obs.observation_value || '')
    setObsDesc(obs.observation_desc || '')
    setObsCode(obs.observation_code || obsCodes[0]?.code || 1001)
    setObsCodeValue(obs.observation_code_value || '')
    setObsValueType(obs.observation_value_type || 1)
    setUploadedFilePath(obs.filePath || null)
    setUploadedFileExt(obs.file_ext || null)
    setFileNameDisplay(obs.filePath ? obs.observation_value || 'Attachment' : '')
  }

  const handleDeleteObs = async (obsvid: number) => {
    if (!confirm('Are you sure you want to deactivate this observation?')) return
    try {
      showToast('Deactivating observation...', 'loading')
      const obs = observations.find((o) => o.obsvid === obsvid)
      if (!obs) return

      const res = await fetch('/api/patient/observation/details/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...obs,
          isActive: 0
        })
      })

      if (res.ok) {
        showToast('Observation deactivated successfully.', 'ok')
        fetchObservations()
        if (editingObsvid === obsvid) {
          resetForm()
        }
      } else {
        throw new Error()
      }
    } catch (err) {
      showToast('Failed to delete observation.', 'error')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Only PDF file attachments are supported.', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds 5MB limit.', 'error')
      return
    }

    setUploadingObs(true)
    setFileNameDisplay(file.name)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64Content = (reader.result as string).split(',')[1]
        const res = await fetch('/api/patient/observation/file/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            encounterId: Number(encounter),
            fileName: file.name,
            base64: base64Content
          })
        })

        if (res.ok) {
          const data = await res.json()
          setUploadedFilePath(data.filePath)
          setUploadedFileExt(data.file_ext)
          setObsValue(file.name)
          showToast('PDF attachment processed successfully.', 'ok')
        } else {
          throw new Error()
        }
      } catch (err) {
        showToast('Failed to upload PDF attachment.', 'error')
        setFileNameDisplay('')
      } finally {
        setUploadingObs(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitObs = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedActivityForObs) {
      showToast('No procedure selected.', 'warning')
      return
    }

    const orderId = Number(selectedActivityForObs.order_authorization_id)
    if (!orderId) return

    setSavingObs(true)
    try {
      showToast(editingObsvid ? 'Updating observation...' : 'Saving observation...', 'loading')

      let finalValue = obsValue
      let finalDesc = obsDesc
      let finalCode: number | null = null
      let finalCodeVal = null

      if (obsType === 1) {
        const selectedCodeObj = obsCodes.find((c) => c.code === obsCode)
        finalValue = selectedCodeObj ? selectedCodeObj.name : 'LOINC'
        finalDesc = obsDesc
        finalCode = obsCode
        finalCodeVal = obsCodeValue
      } else if (obsType === 2) {
        finalValue = obsValue || 'Clinical Note'
        finalDesc = obsDesc
      } else if (obsType === 3) {
        if (!uploadedFilePath) {
          showToast('Please drag & drop or select a PDF file first.', 'warning')
          setSavingObs(false)
          return
        }
        finalValue = fileNameDisplay
        finalDesc = obsDesc || 'Attached clinical evidence document.'
      } else if (obsType === 8) {
        finalValue = obsValue || 'Evidence Code Reference'
        finalDesc = obsDesc
      }

      const payload: Observation = {
        obsvid: editingObsvid,
        patId: 1001,
        encounterId: Number(encounter),
        orderId,
        observation_type: obsType,
        observation_value: finalValue,
        observation_desc: finalDesc,
        observation_code: finalCode,
        observation_code_value: finalCodeVal,
        observation_value_type: obsValueType,
        file_ext: obsType === 3 ? uploadedFileExt || 'pdf' : null,
        filePath: obsType === 3 ? uploadedFilePath : null,
        isActive: 1,
        createdBy: 1,
        physicianId: 1
      }

      const res = await fetch('/api/patient/observation/details/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        showToast(editingObsvid ? 'Observation updated.' : 'Observation saved.', 'ok')
        resetForm()
        fetchObservations()
      } else {
        throw new Error()
      }
    } catch (err) {
      showToast('Failed to save observation.', 'error')
    } finally {
      setSavingObs(false)
    }
  }

  const handleDownloadObsFile = (obsvid: number, filename: string) => {
    showToast('Downloading attachment...', 'info')
    const link = document.createElement('a')
    link.href = `/api/patient/observation/file/download?obsvid=${obsvid}`
    link.target = '_blank'
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenObservationsModal = (row: RcmActivity) => {
    setSelectedActivityForObs(row)
    setIsObsModalOpen(true)
    resetForm()
  }

  const parseDateTime = (str: string): Date | null => {
    if (!str) return null
    const regex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/
    const match = str.trim().match(regex)
    if (!match) return null
    const [_, day, month, year, hour, minute] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day) ||
      date.getHours() !== Number(hour) ||
      date.getMinutes() !== Number(minute)
    ) {
      return null
    }
    return date
  }

  const handleSaveEncounterDates = async () => {
    if (!encounter || encounter === '-') {
      alert('No encounter loaded.')
      return
    }

    const startDt = parseDateTime(encStartInput)
    const endDt = parseDateTime(encEndInput)

    if (!startDt || !endDt) {
      alert('Error: Please enter encounter start and end dates in valid "DD/MM/YYYY HH:MM" format.')
      return
    }

    // Check same day constraint
    const isSameDay =
      startDt.getDate() === endDt.getDate() &&
      startDt.getMonth() === endDt.getMonth() &&
      startDt.getFullYear() === endDt.getFullYear()
    if (!isSameDay) {
      alert('Error: Encounter Start Date and End Date must reside on the same calendar day.')
      return
    }

    if (startDt > endDt) {
      alert('Error: Encounter Start Date/Time must be less than or equal to End Date/Time.')
      return
    }

    setIsSavingEncDates(true)
    try {
      const res = await fetch('/api/encounter/dates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounter,
          startDate: encStartInput,
          endDate: encEndInput
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update encounter dates')
      }
      setResubmitType('1')
      alert('Encounter dates updated successfully!')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setIsSavingEncDates(false)
    }
  }

  const handleSavePriorAuth = async (authId: number, code: string, startDate?: string, expiryDate?: string) => {
    setIsSavingAuth(true)
    try {
      const payload: any = {
        encounter,
        orderAuthorizationId: authId,
        priorAuthCode: code
      }
      if (startDate !== undefined) payload.priorAuthDate = startDate
      if (expiryDate !== undefined) payload.authExpiryDate = expiryDate

      const res = await fetch('/api/rcm/prior-auth/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save prior auth')
      }
      setResubmitType('1')
      alert('Prior Authorization updated successfully!')
      setEditingAuthId(null)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setIsSavingAuth(false)
    }
  }

  const handleSaveCell = async (
    authId: number,
    field: 'code' | 'start' | 'expiry' | 'activityStart',
    value: string
  ) => {
    try {
      const row = activityRows.find((r: any) => Number(r.order_authorization_id) === authId)
      let oldValue = ''
      if (row) {
        if (field === 'code') oldValue = priorAuthCode(row)
        else if (field === 'start') oldValue = row.prior_auth_date_time || row.auth_item_date || ''
        else if (field === 'expiry') oldValue = (row as any).auth_expiry_date || ''
        else if (field === 'activityStart') oldValue = (row as any).activity_start_date_time || ''
      }
      if (value.trim() === oldValue.trim()) {
        setEditingCell(null)
        return
      }

      showToast('Saving...', 'loading')
      const payload: any = {
        encounter,
        orderAuthorizationId: authId
      }
      if (field === 'code') payload.priorAuthCode = value
      if (field === 'start') payload.priorAuthDate = value
      if (field === 'expiry') payload.authExpiryDate = value
      if (field === 'activityStart') payload.activityStartDate = value

      const res = await fetch('/api/rcm/prior-auth/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save cell')
      }
      setResubmitType('1')
      setModifiedCells((prev) => ({ ...prev, [`${authId}_${field}`]: true }))
      showToast('Field updated successfully!', 'ok')
      setEditingCell(null)
    } catch (err: any) {
      console.error(err)
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  const handleBatchSaveField = async (field: 'start' | 'expiry' | 'activityStart', value: string) => {
    if (!encounter || encounter === '-') {
      showToast('No encounter loaded.', 'error')
      return
    }
    if (!value.trim()) {
      showToast('Please enter a value to batch update.', 'error')
      return
    }
    showToast('Updating batch dates...', 'loading')
    try {
      const payload: any = { encounter: encounter.trim() }
      if (field === 'start') payload.startDate = value.trim()
      if (field === 'expiry') payload.expiryDate = value.trim()
      if (field === 'activityStart') payload.activityStartDate = value.trim()

      const response = await fetch('/api/rcm/prior-auth/batch-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const txt = await response.text()
        throw new Error(txt || `HTTP ${response.status}`)
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to batch update dates')
      }
      setResubmitType('1')

      const updatedKeys: Record<string, boolean> = {}
      activityRows.forEach((row) => {
        const authId = Number(row.order_authorization_id)
        if (authId) {
          if (field === 'start' && priorAuthCode(row)) {
            updatedKeys[`${authId}_start`] = true
          }
          if (field === 'expiry' && priorAuthCode(row)) {
            updatedKeys[`${authId}_expiry`] = true
          }
          if (field === 'activityStart') {
            updatedKeys[`${authId}_activityStart`] = true
          }
        }
      })
      setModifiedCells((prev) => ({ ...prev, ...updatedKeys }))

      showToast('Batch update completed successfully!', 'ok')
    } catch (e: any) {
      console.error(e)
      showToast(`Error: ${e.message}`, 'error')
    }
  }

  React.useEffect(() => {
    const fetchDenialCodes = async () => {
      try {
        const res = await fetch('/api/denial-codes/map')
        if (res.ok) {
          const data = await res.json()
          setDenialCodesMap(data || {})
        }
      } catch (err) {
        console.error('Failed to fetch denial codes map:', err)
      }
    }
    fetchDenialCodes()
  }, [])

  const handleToggleAllActions = React.useCallback(() => {
    // 1. Filter actionable rows
    const actionableRows = activityRows.filter((row: any) => {
      const raStatus = activityRaStatus(row)
      return raStatus === 'Denied' || raStatus === 'Partial Remittance'
    })

    if (actionableRows.length === 0) return

    // 2. Check if at least one actionable row is set to 're-sub'
    const hasAnyResub = actionableRows.some((row: any) => {
      const authId = Number(row.order_authorization_id)
      return authId && rowActions[authId] === 're-sub'
    })

    // 3. Determine target action (if any resub is present, write off all; otherwise resub all)
    const targetAction = hasAnyResub ? 'w-off' : 're-sub'

    // 4. Update row actions state in a single batch
    const nextActions = { ...rowActions }
    actionableRows.forEach((row: any) => {
      const authId = Number(row.order_authorization_id)
      if (authId) {
        nextActions[authId] = targetAction
      }
    })

    setRowActions(nextActions)
    showToast(`All actionable activities set to ${targetAction === 're-sub' ? 'Re-sub' : 'Write-off'}`, 'info')
  }, [activityRows, rowActions, setRowActions, showToast])

  const sortedRows = React.useMemo(() => {
    const getStatusRank = (status: string) => {
      if (status === 'Denied') return 3
      if (status === 'Partial Remittance') return 2
      return 1
    }
    return [...activityRows].sort((a, b) => {
      const statusA = activityRaStatus(a)
      const statusB = activityRaStatus(b)
      return getStatusRank(statusA) - getStatusRank(statusB)
    })
  }, [activityRows])

  const getDenialDescription = React.useCallback(
    (code: string) => {
      if (!code) return ''
      const cleanCode = code.trim().toUpperCase()
      if (denialCodesMap[cleanCode]) return denialCodesMap[cleanCode]

      const alphaNumCode = cleanCode.replace(/[^A-Z0-9]/g, '')
      for (const key of Object.keys(denialCodesMap)) {
        const cleanKey = key
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
        if (cleanKey === alphaNumCode) {
          return denialCodesMap[key]
        }
      }
      return ''
    },
    [denialCodesMap]
  )

  return {
    denialCodesMap,
    encStartInput,
    setEncStartInput,
    encEndInput,
    setEncEndInput,
    isSavingEncDates,
    editingAuthId,
    setEditingAuthId,
    tempAuthCode,
    setTempAuthCode,
    tempAuthStartDate,
    setTempAuthStartDate,
    tempAuthExpiryDate,
    setTempAuthExpiryDate,
    isSavingAuth,
    batchAuthStartInput,
    setBatchAuthStartInput,
    batchAuthExpiryInput,
    setBatchAuthExpiryInput,
    batchActivityStartInput,
    setBatchActivityStartInput,
    isSavingBatchAuthDates,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue,
    modifiedCells,
    setModifiedCells,
    selectedActivityForObs,
    isObsModalOpen,
    setIsObsModalOpen,
    observations,
    loadingObs,
    savingObs,
    obsTypes,
    obsCodes,
    editingObsvid,
    obsType,
    setObsType,
    obsValue,
    setObsValue,
    obsDesc,
    setObsDesc,
    obsCode,
    setObsCode,
    obsCodeValue,
    setObsCodeValue,
    obsValueType,
    setObsValueType,
    uploadingObs,
    dragActive,
    setDragActive,
    uploadedFilePath,
    uploadedFileExt,
    fileNameDisplay,
    observationCounts,
    filteredObservations,
    resetForm,
    handleEditObs,
    handleDeleteObs,
    handleDrag,
    handleDrop,
    handleFileChange,
    handleSubmitObs,
    handleDownloadObsFile,
    handleOpenObservationsModal,
    handleSaveEncounterDates,
    handleSavePriorAuth,
    handleSaveCell,
    handleBatchSaveField,
    handleToggleAllActions,
    sortedRows,
    getDenialDescription
  }
}
