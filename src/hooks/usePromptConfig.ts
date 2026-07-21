import { useState, useEffect } from 'react'
import { customFetch as fetch } from '../config/backend'

export interface CustomPromptBlock {
  id: string
  title: string
  content: string
  enabled: boolean
  order: number
}

export interface VitalThresholds {
  tempMinC?: number
  bpSystolicMax?: number
  bpDiastolicMax?: number
  pulseMax?: number
}

export interface ProfileFields {
  name: boolean
  age: boolean
  gender: boolean
  temperature: boolean
  bp: boolean
  pulse: boolean
  bmi: boolean
}

export interface EncounterPromptBlock {
  id: string
  title: string
  xmlTag: string
  enabled: boolean
  order: number
  thresholds?: VitalThresholds
  profileFields?: Partial<ProfileFields>
}

export interface VersionSnapshot {
  filename: string
  name: string
  mtime: number
}

interface UsePromptConfigProps {
  active: boolean
  showToast?: (msg: string, tone: 'ok' | 'error' | 'warning' | 'loading') => void
}

export function usePromptConfig({ active, showToast }: UsePromptConfigProps) {
  const [blocks, setBlocks] = useState<CustomPromptBlock[]>([])
  const [encounterBlocks, setEncounterBlocks] = useState<EncounterPromptBlock[]>([])
  const [versions, setVersions] = useState<VersionSnapshot[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('')

  // Metadata states
  const [name, setName] = useState<string>('Standard Clinical Claims Auditor')
  const [description, setDescription] = useState<string>(
    'Optimized prompt settings for clinical claim audit resubmission justifications. Supports custom XML tag customization and inline formatting rules.'
  )
  const [aiModel, setAiModel] = useState<string>('claude-3-5-sonnet-20241022')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch prompt configuration and versions list on active
  useEffect(() => {
    if (active) {
      const savedConfig = localStorage.getItem('lt_selected_prompt_config')
      if (savedConfig) {
        handleLoadVersion(savedConfig)
      } else {
        fetchConfig()
      }
      fetchVersions()
    }
  }, [active])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/prompt-config')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()

      const sortedBlocks = (data.blocks || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      const sortedEncounter = (data.encounterBlocks || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

      setBlocks(sortedBlocks)
      setEncounterBlocks(sortedEncounter)
      setName(data.name || 'Standard Clinical Claims Auditor')
      setDescription(
        data.description ||
          'Optimized prompt settings for clinical claim audit resubmission justifications. Supports custom XML tag customization and inline formatting rules.'
      )
      setAiModel(data.aiModel || 'claude-3-5-sonnet-20241022')
    } catch (err: any) {
      console.error('Failed to load prompt config:', err)
      showToast?.('Failed to load prompt configuration.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchVersions = async () => {
    try {
      const response = await fetch('/api/prompt-config/versions')
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (err) {
      console.error('Failed to fetch versions list:', err)
    }
  }

  const handleSave = async (
    customBlocks = blocks,
    customEncounter = encounterBlocks,
    customName = name,
    customDesc = description,
    customModel = aiModel
  ) => {
    setSaving(true)
    showToast?.('Saving active configuration...', 'loading')
    try {
      const response = await fetch('/api/prompt-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName,
          description: customDesc,
          aiModel: customModel,
          blocks: customBlocks,
          encounterBlocks: customEncounter
        })
      })
      if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status} saving config`)

      if (selectedVersion) {
        const fileVerName = selectedVersion.replace(/\.(yaml|json|yml)$/i, '')
        await fetch('/api/prompt-config/versions/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fileVerName,
            config: {
              name: customName,
              description: customDesc,
              aiModel: customModel,
              blocks: customBlocks,
              encounterBlocks: customEncounter
            }
          })
        })
        await fetchVersions()
      }

      showToast?.('Active configuration saved successfully.', 'ok')

      const sortedBlocks = [...customBlocks].sort((a, b) => a.order - b.order)
      const sortedEncounter = [...customEncounter].sort((a, b) => a.order - b.order)

      setBlocks(sortedBlocks)
      setEncounterBlocks(sortedEncounter)
    } catch (err: any) {
      console.error('Failed to save active config:', err)
      showToast?.(err.message || 'Failed to save prompt configuration.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAsNew = async (newConfigName: string) => {
    if (!newConfigName.trim()) {
      showToast?.('Configuration name cannot be empty', 'error')
      return
    }
    showToast?.('Saving as new configuration...', 'loading')
    try {
      const response = await fetch('/api/prompt-config/versions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newConfigName.trim(),
          config: {
            name: newConfigName.trim(),
            description,
            aiModel,
            blocks,
            encounterBlocks
          }
        })
      })
      if (!response.ok) throw new Error((await response.text()) || 'Failed to save config')
      showToast?.(`New configuration version "${newConfigName}" saved.`, 'ok')

      const sanitized = newConfigName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '')
      const newFilename = `${sanitized}.yaml`
      setSelectedVersion(newFilename)
      localStorage.setItem('lt_selected_prompt_config', newFilename)

      await fetchVersions()
    } catch (err: any) {
      console.error('Save as new failed:', err)
      showToast?.(`Failed to save configuration: ${err.message}`, 'error')
    }
  }

  const handleLoadVersion = async (filename: string) => {
    if (!filename) return
    showToast?.('Loading configuration...', 'loading')
    try {
      const response = await fetch('/api/prompt-config/versions/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      })
      if (!response.ok) throw new Error((await response.text()) || 'Failed to load config')
      const data = await response.json()

      const sortedBlocks = (data.blocks || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      const sortedEncounter = (data.encounterBlocks || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

      setBlocks(sortedBlocks)
      setEncounterBlocks(sortedEncounter)
      setName(data.name || 'Standard Clinical Claims Auditor')
      setDescription(
        data.description ||
          'Optimized prompt settings for clinical claim audit resubmission justifications. Supports custom XML tag customization and inline formatting rules.'
      )
      setAiModel(data.aiModel || 'claude-3-5-sonnet-20241022')
      setSelectedVersion(filename)
      localStorage.setItem('lt_selected_prompt_config', filename)
      showToast?.('Configuration loaded successfully.', 'ok')
    } catch (err: any) {
      console.error('Load configuration failed:', err)
      showToast?.(`Failed to load configuration: ${err.message}`, 'error')
    }
  }

  const handleDeleteVersion = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this configuration version?')) return
    showToast?.('Deleting configuration version...', 'loading')
    try {
      const response = await fetch('/api/prompt-config/versions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      })
      if (!response.ok) throw new Error((await response.text()) || 'Failed to delete config')
      showToast?.('Configuration version deleted.', 'ok')
      if (selectedVersion === filename) {
        setSelectedVersion('')
        localStorage.removeItem('lt_selected_prompt_config')
        await fetchConfig()
      }
      await fetchVersions()
    } catch (err: any) {
      console.error('Delete configuration failed:', err)
      showToast?.(`Failed to delete configuration: ${err.message}`, 'error')
    }
  }

  // System instructions blocks controls
  const handleAddBlock = () => {
    const newId = `block_${Date.now()}`
    const newBlock: CustomPromptBlock = {
      id: newId,
      title: 'NEW SECTION',
      content: '- Guideline instruction point here.',
      enabled: true,
      order: blocks.length > 0 ? Math.max(...blocks.map((b) => b.order)) + 1 : 1
    }
    setBlocks([...blocks, newBlock])
    showToast?.('Added new system instructions section.', 'ok')
  }

  const handleDeleteBlock = (id: string) => {
    if (!confirm('Are you sure you want to delete this custom section?')) return
    const updated = blocks.filter((b) => b.id !== id)
    setBlocks(updated)
    showToast?.('Section removed. Remember to click Save Active.', 'warning')
  }

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === blocks.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[targetIndex]
    newBlocks[targetIndex] = temp

    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }))
    setBlocks(updated)
  }

  const handleBlockChange = (index: number, field: keyof CustomPromptBlock, value: any) => {
    const updated = blocks.map((b, idx) => (idx === index ? { ...b, [field]: value } : b))
    setBlocks(updated)
  }

  // Encounter data blocks controls
  const handleAddEncounterBlock = () => {
    const newId = `enc_${Date.now()}`
    const newBlock: EncounterPromptBlock = {
      id: newId,
      title: 'CUSTOM CLINICAL PART',
      xmlTag: 'custom_part',
      enabled: true,
      order: encounterBlocks.length > 0 ? Math.max(...encounterBlocks.map((b) => b.order)) + 1 : 1
    }
    setEncounterBlocks([...encounterBlocks, newBlock])
    showToast?.('Added custom Encounter Data XML tag.', 'ok')
  }

  const handleDeleteEncounterBlock = (id: string) => {
    if (!confirm('Are you sure you want to delete this Encounter Data section?')) return
    const updated = encounterBlocks.filter((b) => b.id !== id)
    setEncounterBlocks(updated)
    showToast?.('Encounter section removed. Remember to click Save Active.', 'warning')
  }

  const handleMoveEncounterBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === encounterBlocks.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newBlocks = [...encounterBlocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[targetIndex]
    newBlocks[targetIndex] = temp

    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }))
    setEncounterBlocks(updated)
  }

  const handleEncounterBlockChange = (index: number, field: keyof EncounterPromptBlock, value: any) => {
    const updated = encounterBlocks.map((b, idx) => (idx === index ? { ...b, [field]: value } : b))
    setEncounterBlocks(updated)
  }

  const handleEncounterThresholdChange = (index: number, field: keyof VitalThresholds, value: any) => {
    const updated = encounterBlocks.map((b, idx) => {
      if (idx === index) {
        const thresholds = { ...(b.thresholds || {}), [field]: value === '' ? undefined : Number(value) }
        return { ...b, thresholds }
      }
      return b
    })
    setEncounterBlocks(updated)
  }

  const handleEncounterProfileFieldsChange = (index: number, field: keyof ProfileFields, value: boolean) => {
    const updated = encounterBlocks.map((b, idx) => {
      if (idx === index) {
        const profileFields = {
          name: true,
          age: true,
          gender: true,
          temperature: true,
          bp: true,
          pulse: true,
          bmi: true,
          ...(b.profileFields || {}),
          [field]: value
        }
        return { ...b, profileFields }
      }
      return b
    })
    setEncounterBlocks(updated)
  }

  const handleExport = () => {
    window.location.href = '/api/prompt-config/version/export'
    showToast?.('Exporting unified configuration file...', 'ok')
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const rawContent = event.target?.result as string
      if (!rawContent) return

      showToast?.('Importing unified config...', 'loading')
      try {
        const response = await fetch('/api/prompt-config/version/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawContent, filename: file.name })
        })

        if (!response.ok) throw new Error((await response.text()) || 'Failed to import file')

        const data = await response.json()
        showToast?.('Unified configuration imported successfully!', 'ok')
        e.target.value = ''
        await fetchConfig()
        await fetchVersions()
        if (data.snapshotName) {
          const loadedFilename = `${data.snapshotName}.yaml`
          setSelectedVersion(loadedFilename)
          localStorage.setItem('lt_selected_prompt_config', loadedFilename)
        }
      } catch (err: any) {
        console.error('Import failed:', err)
        showToast?.(`Import failed: ${err.message || err}`, 'error')
      }
    }
    reader.readAsText(file)
  }

  return {
    blocks,
    encounterBlocks,
    versions,
    selectedVersion,
    name,
    setName,
    description,
    setDescription,
    aiModel,
    setAiModel,
    loading,
    saving,
    fetchConfig,
    handleSave,
    handleSaveAsNew,
    handleLoadVersion,
    handleDeleteVersion,
    handleAddBlock,
    handleDeleteBlock,
    handleMoveBlock,
    handleBlockChange,
    handleAddEncounterBlock,
    handleDeleteEncounterBlock,
    handleMoveEncounterBlock,
    handleEncounterBlockChange,
    handleEncounterThresholdChange,
    handleEncounterProfileFieldsChange,
    handleExport,
    handleImportFile
  }
}
