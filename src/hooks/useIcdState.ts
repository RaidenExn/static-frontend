import { useState, useEffect } from 'react'
import { usePortal } from '../context/PortalContext'
import { customFetch as fetch } from '../config/backend'

export interface Diagnosis {
  patient_diseases_id: any
  icd_code: string
  disease_desc: string
  disease_addendum_status_id?: any
  creatinguserId?: any
  is_primary?: any
  is_chronic?: any
  is_coded?: any
}

interface UseIcdStateProps {
  encounter: string
  active: boolean
  showToast: (text: string, tone: 'ok' | 'error' | 'loading' | 'info' | 'warning', durationMs?: number) => void
}

export function useIcdState({ encounter, active, showToast }: UseIcdStateProps) {
  const { setResubmitType } = usePortal()
  const [loading, setLoading] = useState(false)
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [patientId, setPatientId] = useState<number | null>(null)
  const [encounterId, setEncounterId] = useState<number | null>(null)
  const [siteId, setSiteId] = useState<number | null>(null)
  const [physicianId, setPhysicianId] = useState<number | null>(null)
  const [physicianName, setPhysicianName] = useState<string>('')

  // Addendum Management State
  const [addendumId, setAddendumId] = useState<number | null>(null)
  const [addendumRemark, setAddendumRemark] = useState('')
  const [addendumCreatedBy, setAddendumCreatedBy] = useState('1089')
  const [addendumStatusText, setAddendumStatusText] = useState('Closed / None')

  // Configuration
  const [currentOperatorId, setCurrentOperatorId] = useState<string>('1089')
  const [creatingUserId, setCreatingUserId] = useState('1089')
  const [isBypassMode, setIsBypassMode] = useState(false) // Direct write vs addendum standard
  const [commentInput, setCommentInput] = useState('')

  const fetchDiagnoses = async () => {
    if (!encounter) return
    setLoading(true)
    try {
      const res = await fetch(`/api/encounter/diagnoses?encounter=${encodeURIComponent(encounter)}`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data.success) {
        setDiagnoses(data.diagnoses || [])
        setPatientId(data.patientId)
        setEncounterId(data.encounterId)
        setSiteId(data.siteId)
        if (data.physicianId) {
          setPhysicianId(data.physicianId)
          setPhysicianName(data.physicianName || '')
        }
      } else {
        throw new Error(data.message || 'Failed to fetch diagnoses')
      }
    } catch (err: any) {
      console.error(err)
      showToast(`Failed to load diagnoses: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load configured user ID on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/config/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.hospital && data.hospital.defaultUserId) {
            const defaultId = String(data.hospital.defaultUserId)
            setCurrentOperatorId(defaultId)
            setAddendumCreatedBy(defaultId)
            setCreatingUserId(defaultId)
          }
        }
      } catch (err) {
        console.error('Failed to load user settings in IcdEditsPanel:', err)
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    if (encounter) {
      fetchDiagnoses()
    }
  }, [encounter])

  // Open Addendum
  const handleOpenAddendum = async () => {
    if (!encounterId) {
      showToast('No active encounter context loaded.', 'error')
      return
    }
    const remark = addendumRemark.trim() || 'Opening addendum for diagnosis correction'
    const userId = Number(addendumCreatedBy) || 1089

    showToast('Opening clinical addendum...', 'loading')
    try {
      const res = await fetch('/api/encounter/addendum/remarks/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterId,
          addendumRemark: remark,
          addendumStatusId: 1, // 1 = Open
          addendumRemarkId: 0,
          createdBy: userId
        })
      })
      const data = await res.json()
      if (data.success && data.data?.[0]) {
        const id = Number(data.data[0].addendum_id)
        setAddendumId(id)
        setAddendumStatusText(`Open (ID: ${id})`)
        showToast('Clinical addendum successfully opened!', 'ok')
      } else {
        throw new Error(data.message || 'Server rejected request')
      }
    } catch (err: any) {
      showToast(`Failed to open addendum: ${err.message}`, 'error')
    }
  }

  // Close Addendum
  const handleCloseAddendum = async () => {
    if (!addendumId) return
    showToast('Closing clinical addendum...', 'loading')
    try {
      const res = await fetch('/api/encounter/addendum/remarks/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterId,
          addendumRemark: addendumRemark.trim() || 'Closing addendum',
          addendumStatusId: 2, // 2 = Closed
          addendumRemarkId: addendumId,
          createdBy: Number(addendumCreatedBy) || 1089
        })
      })
      const data = await res.json()
      if (data.success) {
        setAddendumId(null)
        setAddendumStatusText('Closed / None')
        showToast('Clinical addendum successfully closed and finalized.', 'ok')
      } else {
        throw new Error(data.message || 'Server rejected close request')
      }
    } catch (err: any) {
      showToast(`Failed to close addendum: ${err.message}`, 'error')
    }
  }

  // Add Diagnosis
  const handleAddDiagnosis = async (icdCode: string, disDesc: string, isPrimary: boolean, onSaved: () => void) => {
    if (!encounterId || !patientId || !siteId) {
      showToast('Encounter metadata not fully loaded.', 'error')
      return
    }
    if (!icdCode) {
      showToast('Please select a diagnosis from search results.', 'warning')
      return
    }

    const payload = {
      encounter,
      encounterId,
      patientId,
      siteId,
      isAddendum: isBypassMode ? 0 : 1, // bypass lock
      creatinguserId: Number(creatingUserId) || 1089, // anonymous/spoof vs standard
      icdCode: icdCode.trim(),
      icd_code: icdCode.trim(),
      disDesc: disDesc.trim() || 'Diagnosed via local portal',
      disease_desc: disDesc.trim() || 'Diagnosed via local portal',
      isPrimary: isPrimary ? 1 : 0, // mark as primary
      is_primary: isPrimary ? 1 : 0,
      comment: commentInput || '',
      addendumId: isBypassMode ? null : addendumId
    }

    if (!isBypassMode && !addendumId) {
      showToast('Cannot add: Standard mode requires an open Addendum. Open one first or toggle Bypass Lock.', 'warning')
      return
    }

    showToast(`Committing diagnosis ${payload.icdCode}...`, 'loading')
    try {
      const res = await fetch('/api/encounter/diagnoses/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Successfully saved diagnosis ${payload.icdCode}!`, 'ok')
        setResubmitType('1')
        onSaved()
        fetchDiagnoses()
      } else {
        throw new Error(data.message || 'Server rejected save')
      }
    } catch (err: any) {
      showToast(`Failed to save: ${err.message}`, 'error')
    }
  }

  // Toggle Primary vs Secondary Status
  const handleTogglePrimary = async (diag: Diagnosis, targetIsPrimary: boolean) => {
    if (!encounterId || !patientId || !siteId) {
      showToast('Encounter metadata not fully loaded.', 'error')
      return
    }

    const payload = {
      encounter,
      encounterId,
      patientId,
      siteId,
      isAddendum: isBypassMode ? 0 : 1,
      creatinguserId: Number(creatingUserId) || 1089,
      icdCode: diag.icd_code,
      icd_code: diag.icd_code,
      disDesc: diag.disease_desc,
      disease_desc: diag.disease_desc,
      isPrimary: targetIsPrimary ? 1 : 0,
      is_primary: targetIsPrimary ? 1 : 0,
      comment: commentInput || `Changed status of ${diag.icd_code} to ${targetIsPrimary ? 'Primary' : 'Secondary'}`,
      patdiseaseId: diag.patient_diseases_id,
      addendumId: isBypassMode ? null : addendumId
    }

    if (!isBypassMode && !addendumId) {
      showToast('Cannot change status: Standard mode requires an open Addendum.', 'warning')
      return
    }

    showToast(`Setting ${diag.icd_code} as ${targetIsPrimary ? 'Primary' : 'Secondary'}...`, 'loading')
    try {
      const res = await fetch('/api/encounter/diagnoses/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Successfully set ${diag.icd_code} as ${targetIsPrimary ? 'Primary' : 'Secondary'}!`, 'ok')
        setResubmitType('1')
        fetchDiagnoses()
      } else {
        throw new Error(data.message || 'Server rejected status update')
      }
    } catch (err: any) {
      showToast(`Status update failure: ${err.message}`, 'error')
    }
  }

  // Soft Delete Diagnosis
  const handleDeleteDiagnosis = async (diag: Diagnosis) => {
    if (!encounterId || !patientId || !siteId) {
      showToast('Encounter metadata not fully loaded.', 'error')
      return
    }

    const payload = {
      encounter,
      encounterId,
      patientId,
      siteId,
      isAddendum: isBypassMode ? 0 : 1,
      creatinguserId: Number(creatingUserId) || 1089,
      icdCode: diag.icd_code,
      icd_code: diag.icd_code,
      disDesc: diag.disease_desc,
      disease_desc: diag.disease_desc,
      isPrimary: diag.is_primary,
      is_primary: diag.is_primary,
      disease_addendum_status_id: 2, // 2 = Deleted/Inactive
      diseaseAddendumStatusId: 2, // support both casing models
      comment: commentInput || 'Deleted via local portal',
      patdiseaseId: diag.patient_diseases_id,
      addendumId: isBypassMode ? null : addendumId
    }

    if (!isBypassMode && !addendumId) {
      showToast('Cannot delete: Standard mode requires an open Addendum.', 'error')
      return
    }

    showToast(`Soft-deleting diagnosis ${diag.icd_code}...`, 'loading')
    try {
      const res = await fetch('/api/encounter/diagnoses/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Successfully soft-deleted diagnosis ${diag.icd_code}!`, 'ok')
        setResubmitType('1')
        fetchDiagnoses()
      } else {
        throw new Error(data.message || 'Server rejected deletion')
      }
    } catch (err: any) {
      showToast(`Deletion failure: ${err.message}`, 'error')
    }
  }

  return {
    loading,
    diagnoses,
    patientId,
    encounterId,
    siteId,
    physicianId,
    physicianName,
    addendumId,
    addendumRemark,
    setAddendumRemark,
    addendumCreatedBy,
    setAddendumCreatedBy,
    addendumStatusText,
    creatingUserId,
    setCreatingUserId,
    currentOperatorId,
    isBypassMode,
    setIsBypassMode,
    commentInput,
    setCommentInput,
    fetchDiagnoses,
    handleOpenAddendum,
    handleCloseAddendum,
    handleAddDiagnosis,
    handleTogglePrimary,
    handleDeleteDiagnosis
  }
}
