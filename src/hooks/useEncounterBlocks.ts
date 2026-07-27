import { useState, useEffect, useCallback } from 'react'
import { customFetch as fetch } from '../config/backend'

export interface EncounterBlockDef {
  id: string
  label: string
}

export const ENCOUNTER_BLOCKS: EncounterBlockDef[] = [
  { id: 'patient_profile', label: 'Patient Profile' },
  { id: 'patient_complaints', label: 'Patient Complaints' },
  { id: 'history_of_present_illness', label: 'History of Present Illness' },
  { id: 'diagnosed_problems', label: 'Diagnosed Problems' },
  { id: 'examination_notes', label: 'Examination Notes' },
  { id: 'lab_orders', label: 'Lab Orders' },
  { id: 'radiology_orders', label: 'Radiology Orders' },
  { id: 'procedure_orders', label: 'Procedure Orders' },
  { id: 'medication_orders', label: 'Medication Orders' },
  { id: 'known_allergies', label: 'Known Allergies' },
  { id: 'procedure_notes', label: 'Procedure Notes' },
  { id: 'plan_notes', label: 'Plan Notes' },
]

export function useEncounterBlocks() {
  const [enabledIds, setEnabledIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prompt/encounter-blocks')
      if (res.ok) {
        const data = await res.json()
        setEnabledIds(data.enabledIds || [])
      }
    } catch {
      // Blocks fetch may fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (ids: string[]) => {
    setSaving(true)
    try {
      await fetch('/api/prompt/encounter-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledIds: ids })
      })
    } finally {
      setSaving(false)
    }
  }, [])

  const toggle = useCallback((id: string) => {
    setEnabledIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      save(next)
      return next
    })
  }, [save])

  return { blocks: ENCOUNTER_BLOCKS, enabledIds, loading, saving, toggle }
}
