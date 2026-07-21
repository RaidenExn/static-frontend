import { useState, useEffect, useMemo, useCallback } from 'react'
import { RcmResult, RcmActivity } from '../types'
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

interface UseObservationsProps {
  active: boolean
  rcmResult: RcmResult | null
  encounterInput: string
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
}

export function useObservations({ active, rcmResult, encounterInput, showToast }: UseObservationsProps) {
  // Extract context
  const encounterId = useMemo(() => {
    const encId = rcmResult?.rcm?.flattened?.activity?.[0]?._encounter
    if (encId) return Number(encId)
    if (/^\d+$/.test(encounterInput)) return Number(encounterInput)
    return null
  }, [rcmResult, encounterInput])

  const patId = useMemo(() => {
    return 1001 // Mock patient ID or default
  }, [])

  const physicianId = useMemo(() => {
    return 1 // Default physicianId
  }, [])

  // UI States
  const [selectedActivity, setSelectedActivity] = useState<RcmActivity | null>(null)
  const [observations, setObservations] = useState<Observation[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Master Data
  const [obsTypes, setObsTypes] = useState<ObsType[]>([
    { id: 1, name: 'Result Value (LOINC)' },
    { id: 2, name: 'Text Evidence / Clinical Note' },
    { id: 3, name: 'File Attachment (PDF)' },
    { id: 8, name: 'Evidence Code' }
  ])
  const [obsCodes, setObsCodes] = useState<ObsCode[]>([
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
  const [editingObsvid, setEditingObsvid] = useState<number | undefined>(undefined)
  const [obsType, setObsType] = useState<number>(2) // Default to Text Evidence
  const [obsValue, setObsValue] = useState<string>('')
  const [obsDesc, setObsDesc] = useState<string>('')
  const [obsCode, setObsCode] = useState<number>(1001)
  const [obsCodeValue, setObsCodeValue] = useState<string>('')
  const [obsValueType, setObsValueType] = useState<number>(1)

  // File Upload
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [uploadedFileExt, setUploadedFileExt] = useState<string | null>(null)
  const [fileNameDisplay, setFileNameDisplay] = useState<string>('')

  const fetchObservations = useCallback(async () => {
    if (!encounterId) return
    setLoading(true)
    try {
      const res = await fetch('/api/patient/observation/order/details/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterId })
      })
      if (res.ok) {
        const data = await res.json()
        setObservations(data.observations || [])
      }
    } catch (err: any) {
      console.error('Failed to load observations:', err)
      showToast('Failed to fetch patient observations.', 'error')
    } finally {
      setLoading(false)
    }
  }, [encounterId, showToast])

  // Fetch Master Data & Observations
  useEffect(() => {
    if (!active || !encounterId) return

    fetch('/api/master/observation/type/get')
      .then((r) => r.json())
      .then((data) => {
        if (data.types) setObsTypes(data.types)
      })
      .catch((err) => console.warn('Failed to load master types:', err))

    fetch('/api/master/observation/code/get', { method: 'POST', body: JSON.stringify({}) })
      .then((r) => r.json())
      .then((data) => {
        if (data.codes) setObsCodes(data.codes)
      })
      .catch((err) => console.warn('Failed to load master codes:', err))

    fetchObservations()
  }, [active, encounterId, fetchObservations])

  // List of active procedures
  const activities = useMemo(() => {
    return rcmResult?.rcm?.flattened?.activity || []
  }, [rcmResult])

  // Count of observations per procedure
  const observationCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    observations.forEach((obs) => {
      if (obs.isActive === 1) {
        counts[obs.orderId] = (counts[obs.orderId] || 0) + 1
      }
    })
    return counts
  }, [observations])

  // Observations filtered by currently selected procedure (or show all if none selected)
  const filteredObservations = useMemo(() => {
    if (!selectedActivity) return observations
    const authId = Number(selectedActivity.order_authorization_id)
    return observations.filter((obs) => obs.orderId === authId)
  }, [observations, selectedActivity])

  // Reset form fields
  const resetForm = useCallback(() => {
    setEditingObsvid(undefined)
    setObsValue('')
    setObsDesc('')
    setObsCode(obsCodes[0]?.code || 1001)
    setObsCodeValue('')
    setObsValueType(1)
    setUploadedFilePath(null)
    setUploadedFileExt(null)
    setFileNameDisplay('')
  }, [obsCodes])

  // Edit observation (loads into form)
  const handleEdit = useCallback(
    (obs: Observation) => {
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

      const act = activities.find((a) => Number(a.order_authorization_id) === obs.orderId)
      if (act) {
        setSelectedActivity(act)
      }
    },
    [activities, obsCodes]
  )

  // Soft Delete
  const handleDelete = useCallback(
    async (obsvid: number) => {
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
    },
    [observations, fetchObservations, editingObsvid, resetForm, showToast]
  )

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const processFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Only PDF file attachments are supported.', 'error')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit.', 'error')
        return
      }

      setUploading(true)
      setFileNameDisplay(file.name)

      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(',')[1]
          const res = await fetch('/api/patient/observation/file/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encounterId,
              fileName: file.name,
              base64: base64Content
            })
          })

          if (res.ok) {
            const data = await res.json()
            setUploadedFilePath(data.filePath)
            setUploadedFileExt(data.file_ext)
            setObsValue(file.name) // Set value to filename
            showToast('PDF attachment processed successfully.', 'ok')
          } else {
            throw new Error()
          }
        } catch (err) {
          showToast('Failed to upload PDF attachment.', 'error')
          setFileNameDisplay('')
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    },
    [encounterId, showToast]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0])
      }
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0])
      }
    },
    [processFile]
  )

  // Submit Form
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedActivity) {
        showToast('Please select a procedure code from the grid above.', 'warning')
        return
      }

      const orderId = Number(selectedActivity.order_authorization_id)
      if (!orderId) return

      setSaving(true)
      try {
        showToast(editingObsvid ? 'Updating observation...' : 'Saving observation...', 'loading')

        // Set defaults based on type
        let finalValue = obsValue
        let finalDesc = obsDesc
        let finalCode: number | null = null
        let finalCodeVal = null

        if (obsType === 1) {
          const selectedCodeObj = obsCodes.find((c) => c.code === obsCode)
          finalValue = selectedCodeObj ? selectedCodeObj.name : 'LOINC'
          finalDesc = obsDesc // result numeric value
          finalCode = obsCode
          finalCodeVal = obsCodeValue // units of measure
        } else if (obsType === 2) {
          finalValue = obsValue || 'Clinical Note'
          finalDesc = obsDesc
        } else if (obsType === 3) {
          if (!uploadedFilePath) {
            showToast('Please drag & drop or select a PDF file first.', 'warning')
            setSaving(false)
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
          patId,
          encounterId: encounterId!,
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
          physicianId
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
        setSaving(false)
      }
    },
    [
      editingObsvid,
      encounterId,
      obsCode,
      obsCodes,
      obsCodeValue,
      obsDesc,
      obsType,
      obsValue,
      obsValueType,
      patId,
      physicianId,
      selectedActivity,
      showToast,
      uploadedFileExt,
      uploadedFilePath,
      fileNameDisplay,
      resetForm,
      fetchObservations
    ]
  )

  const handleDownloadFile = useCallback(
    (obsvid: number, filename: string) => {
      showToast('Downloading attachment...', 'info')
      const link = document.createElement('a')
      link.href = `/api/patient/observation/file/download?obsvid=${obsvid}`
      link.target = '_blank'
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [showToast]
  )

  return {
    encounterId,
    patId,
    physicianId,
    selectedActivity,
    setSelectedActivity,
    observations,
    loading,
    saving,
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
    uploading,
    dragActive,
    uploadedFilePath,
    uploadedFileExt,
    fileNameDisplay,
    fetchObservations,
    resetForm,
    handleEdit,
    handleDelete,
    handleDrag,
    handleDrop,
    handleFileChange,
    handleSubmit,
    handleDownloadFile,
    activities,
    observationCounts,
    filteredObservations
  }
}
