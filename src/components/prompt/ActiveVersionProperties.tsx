import React, { useState } from 'react'
import { AutosizeTextArea } from './AutosizeTextArea'

interface SmartInclusionCondition {
  type: 'numeric_range' | 'keyword_in_summary' | 'keyword_in_section' | 'keyword_in_rejected_tests'
  min?: number
  max?: number
  unit?: 'C' | 'F'
  keyword?: string
  targetSection?: string
}

interface SmartInclusion {
  enabled?: boolean
  operator?: 'AND' | 'OR'
  conditions?: SmartInclusionCondition[]
}

type UpgradedInclusionValue = boolean | SmartInclusion

interface ConditionalRule {
  id: string
  name: string
  sources: Array<
    | 'full_summary'
    | 'rejected_tests'
    | 'complaints'
    | 'hpi'
    | 'diagnoses'
    | 'examinationNotes'
    | 'labOrders'
    | 'radiologyOrders'
    | 'procedureOrders'
    | 'medicationOrders'
    | 'allergies'
  >
  triggerValue: string
  excludeKeywords?: string
  action: 'replace_generic' | 'append_generic' | 'replace_custom' | 'append_custom'
  targetRuleField:
    | 'systemInstructions'
    | 'inputRules'
    | 'outputRules'
    | 'clinicalNecessityIndicators'
    | 'clinicalLogicChains'
    | 'regulatoryCompliance'
    | 'acronymGlossary'
    | 'negativeConstraints'
    | 'styleToneGuard'
  ruleText: string
}

interface ActiveVersionPropertiesProps {
  activeVersionData: {
    version: string
    name?: string
    description?: string
    omitDiagnoses?: boolean
    cleanClinicalText?: boolean
    ageFormatVersion?: string
    cleanSettings?: {
      lowercaseOnly?: boolean
      stripBullets?: boolean
      stripDisclaimers?: boolean
      deduplicate?: boolean
    }
    inclusions?: Record<string, UpgradedInclusionValue>
    bannedWords?: string[]
    conditionalRules?: ConditionalRule[]
  }
  updateVersionField: (field: string, val: any) => void
}

export function ActiveVersionProperties({ activeVersionData, updateVersionField }: ActiveVersionPropertiesProps) {
  const cleanSettings = activeVersionData.cleanSettings || {}
  const inclusions = activeVersionData.inclusions || {}
  const bannedWords = activeVersionData.bannedWords || []
  const conditionalRules = activeVersionData.conditionalRules || []

  // Track expanded inclusions for condition editors
  const [expandedInclusionField, setExpandedInclusionField] = useState<string | null>(null)

  const handleCleanSettingsChange = (key: string, val: boolean) => {
    updateVersionField('cleanSettings', {
      ...cleanSettings,
      [key]: val
    })
  }

  const handleInclusionsChange = (key: string, val: UpgradedInclusionValue) => {
    updateVersionField('inclusions', {
      ...inclusions,
      [key]: val
    })
  }

  const handleBannedWordsChange = (value: string) => {
    const list = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    updateVersionField('bannedWords', list)
  }

  // Live Conflict Checker running in real-time
  const getConflicts = (): Array<{ ruleId: string; type: 'warning' | 'info' | 'redundancy'; message: string }> => {
    const conflictsList: Array<{ ruleId: string; type: 'warning' | 'info' | 'redundancy'; message: string }> = []
    const targetFieldActionMap: Record<string, Array<{ rule: ConditionalRule; idx: number }>> = {}

    conditionalRules.forEach((rule, idx) => {
      if (!rule.targetRuleField) return
      const field = rule.targetRuleField
      if (!targetFieldActionMap[field]) {
        targetFieldActionMap[field] = []
      }
      targetFieldActionMap[field].push({ rule, idx })
    })

    Object.entries(targetFieldActionMap).forEach(([field, triggers]) => {
      const replaces = triggers.filter((t) => t.rule.action?.startsWith('replace_'))
      const appends = triggers.filter((t) => t.rule.action?.startsWith('append_'))

      if (replaces.length > 1) {
        replaces.sort((a, b) => a.idx - b.idx)
        const winner = replaces[replaces.length - 1]
        replaces.forEach((t) => {
          if (t.idx !== winner.idx) {
            conflictsList.push({
              ruleId: t.rule.id,
              type: 'warning',
              message: `⚠️ Multiple replaces on '${field}'. Overridden by '${winner.rule.name || `Rule #${winner.idx + 1}`}' because it has higher list priority.`
            })
          }
        })
      }

      if (replaces.length > 0 && appends.length > 0) {
        const winningReplace = replaces.find((t) => !conflictsList.some((c) => c.ruleId === t.rule.id))
        if (winningReplace) {
          triggers.forEach((t) => {
            if (t.rule.action.startsWith('append_')) {
              conflictsList.push({
                ruleId: t.rule.id,
                type: 'info',
                message: `ℹ️ Field '${field}' has both Replace ('${winningReplace.rule.name}') and Append rules active. Replace executes first.`
              })
            }
          })
        }
      }

      // Check Category B: Redundancy
      const seen = new Set<string>()
      triggers.forEach((t) => {
        const key = `${t.rule.triggerValue}::${t.rule.action}::${t.rule.ruleText}`
        if (seen.has(key)) {
          conflictsList.push({
            ruleId: t.rule.id,
            type: 'redundancy',
            message: `⚠️ Redundant trigger matched: identical action/keyword text as an existing rule. This rule is skipped.`
          })
        } else {
          seen.add(key)
        }
      })
    })

    return conflictsList
  }

  const conflicts = getConflicts()

  // Helper to resolve helper strings/values of UpgradedInclusionValue
  const getInclusionState = (field: string) => {
    const val = inclusions[field]
    if (val === undefined) {
      return { checked: true, mode: 'always' as const, isSmart: false, smartData: null }
    }
    if (typeof val === 'boolean') {
      return { checked: val, mode: 'always' as const, isSmart: false, smartData: null }
    }
    return {
      checked: val.enabled !== false,
      mode: 'conditional' as const,
      isSmart: true,
      smartData: val
    }
  }

  const handleInclusionCheckboxChange = (field: string, checked: boolean) => {
    const state = getInclusionState(field)
    if (state.isSmart) {
      handleInclusionsChange(field, {
        ...state.smartData,
        enabled: checked
      })
    } else {
      handleInclusionsChange(field, checked)
    }
  }

  const handleInclusionModeChange = (field: string, mode: 'always' | 'conditional') => {
    const state = getInclusionState(field)
    if (mode === 'always') {
      handleInclusionsChange(field, state.checked)
    } else {
      handleInclusionsChange(field, {
        enabled: state.checked,
        operator: 'OR',
        conditions: [{ type: 'keyword_in_summary', keyword: 'fever' }]
      })
    }
  }

  const handleAddInclusionCondition = (field: string) => {
    const state = getInclusionState(field)
    if (state.isSmart && state.smartData) {
      const currentConditions = state.smartData.conditions || []
      handleInclusionsChange(field, {
        ...state.smartData,
        conditions: [...currentConditions, { type: 'keyword_in_summary', keyword: '' }]
      })
    }
  }

  const handleRemoveInclusionCondition = (field: string, idx: number) => {
    const state = getInclusionState(field)
    if (state.isSmart && state.smartData) {
      const currentConditions = [...(state.smartData.conditions || [])]
      currentConditions.splice(idx, 1)
      handleInclusionsChange(field, {
        ...state.smartData,
        conditions: currentConditions
      })
    }
  }

  const handleInclusionConditionFieldChange = (
    field: string,
    idx: number,
    key: keyof SmartInclusionCondition,
    val: any
  ) => {
    const state = getInclusionState(field)
    if (state.isSmart && state.smartData) {
      const currentConditions = [...(state.smartData.conditions || [])]
      currentConditions[idx] = {
        ...currentConditions[idx],
        [key]: val
      }
      handleInclusionsChange(field, {
        ...state.smartData,
        conditions: currentConditions
      })
    }
  }

  // Conditional rules handlers
  const handleAddConditionalRule = () => {
    const newRule: ConditionalRule = {
      id: Math.random().toString(36).substring(7),
      name: `New Custom Rule #${conditionalRules.length + 1}`,
      sources: ['full_summary'],
      triggerValue: '',
      excludeKeywords: '',
      action: 'append_generic',
      targetRuleField: 'systemInstructions',
      ruleText: ''
    }
    updateVersionField('conditionalRules', [...conditionalRules, newRule])
  }

  const handleRemoveConditionalRule = (id: string) => {
    const list = conditionalRules.filter((r) => r.id !== id)
    updateVersionField('conditionalRules', list)
  }

  const handleConditionalRuleChange = (id: string, key: keyof ConditionalRule, val: any) => {
    const list = conditionalRules.map((r) => {
      if (r.id === id) {
        return { ...r, [key]: val }
      }
      return r
    })
    updateVersionField('conditionalRules', list)
  }

  const handleToggleSourceInRule = (rule: ConditionalRule, source: string) => {
    const current = rule.sources || []
    let next: any[]
    if (current.includes(source as any)) {
      next = current.filter((s) => s !== source)
    } else {
      next = [...current, source]
    }
    handleConditionalRuleChange(rule.id, 'sources', next)
  }

  const availableInclusions = [
    { key: 'includeName', label: 'Patient Name' },
    { key: 'includeGender', label: 'Patient Gender' },
    { key: 'includeAge', label: 'Patient Age' },
    { key: 'includeTemperature', label: 'Temperature' },
    { key: 'includeBp', label: 'Blood Pressure' },
    { key: 'includePulse', label: 'Pulse' },
    { key: 'includeWeight', label: 'Weight' },
    { key: 'includeBmi', label: 'BMI' },
    { key: 'includeComplaints', label: 'Complaints' },
    { key: 'includeHpi', label: 'HPI' },
    { key: 'includeDiagnoses', label: 'Diagnoses' },
    { key: 'includeLabOrders', label: 'Lab Orders' },
    { key: 'includeRadiologyOrders', label: 'Radiology Orders' },
    { key: 'includeProcedureOrders', label: 'Procedure Orders' },
    { key: 'includeMedicationOrders', label: 'Medication Orders' },
    { key: 'includeExaminationNotes', label: 'Examination Notes' },
    { key: 'includeAllergies', label: 'Allergies' }
  ]

  const sourceOptions = [
    { value: 'full_summary', label: 'Full Summary (EMR)' },
    { value: 'rejected_tests', label: 'Rejected Tests List' },
    { value: 'complaints', label: 'Complaints Notes' },
    { value: 'hpi', label: 'HPI Section' },
    { value: 'diagnoses', label: 'Diagnoses Block' },
    { value: 'examinationNotes', label: 'Examination Notes' },
    { value: 'labOrders', label: 'Lab Orders' },
    { value: 'radiologyOrders', label: 'Radiology Orders' },
    { value: 'procedureOrders', label: 'Procedure Orders' },
    { value: 'medicationOrders', label: 'Medication Orders' },
    { value: 'allergies', label: 'Allergies List' }
  ]

  return (
    <div
      className="preload-card"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--border-radius)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      <div>
        <h3
          style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--accent)',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ⚙️ Active Version Properties
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '4px'
              }}
            >
              Version ID
            </label>
            <input
              type="text"
              value={activeVersionData.version}
              disabled={true}
              style={{
                width: '100%',
                fontSize: '12px',
                padding: '8px 10px',
                background: 'var(--panel-soft)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                cursor: 'not-allowed',
                color: 'var(--muted)'
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '4px'
              }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={activeVersionData.name || ''}
              onChange={(e) => updateVersionField('name', e.target.value)}
              style={{
                width: '100%',
                fontSize: '12px',
                padding: '8px 10px',
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                color: 'var(--ink)'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '4px'
            }}
          >
            Description
          </label>
          <AutosizeTextArea
            rows={2}
            value={activeVersionData.description || ''}
            onChange={(e) => updateVersionField('description', e.target.value)}
            style={{
              width: '100%',
              fontSize: '12px',
              padding: '8px 10px',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              color: 'var(--ink)'
            }}
            placeholder="Brief version description..."
          />
        </div>
      </div>

      {/* Clean clinical text sub-options */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
        <h4
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--ink)',
            margin: '0 0 12px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🧹 Clean Clinical Text Controls
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={activeVersionData.cleanClinicalText || false}
              onChange={(e) => updateVersionField('cleanClinicalText', e.target.checked)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ fontWeight: 600 }}>Enable Clinical Text Cleaning</span>
          </label>

          {activeVersionData.cleanClinicalText && (
            <div
              style={{
                paddingLeft: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                borderLeft: '2px solid var(--line)',
                marginLeft: '6px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
                <input
                  type="checkbox"
                  checked={cleanSettings.lowercaseOnly ?? false}
                  onChange={(e) => handleCleanSettingsChange('lowercaseOnly', e.target.checked)}
                  style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                />
                <span>Convert all text to lowercase</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
                <input
                  type="checkbox"
                  checked={cleanSettings.stripBullets ?? true}
                  onChange={(e) => handleCleanSettingsChange('stripBullets', e.target.checked)}
                  style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                />
                <span>Strip list bullets</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
                <input
                  type="checkbox"
                  checked={cleanSettings.stripDisclaimers ?? true}
                  onChange={(e) => handleCleanSettingsChange('stripDisclaimers', e.target.checked)}
                  style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                />
                <span>Strip emergency/disclaimer text</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
                <input
                  type="checkbox"
                  checked={cleanSettings.deduplicate ?? true}
                  onChange={(e) => handleCleanSettingsChange('deduplicate', e.target.checked)}
                  style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                />
                <span>Deduplicate consecutive spaces</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Upgraded Inclusions controls */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
        <h4
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--ink)',
            margin: '0 0 12px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🧠 Smart Input Context Inclusions
        </h4>
        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '-8px 0 16px 0' }}>
          Set which variables are sent to the AI, with optional conditional rule ranges (e.g. Temperature between 38 and
          50).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {availableInclusions.map((inc) => {
            const { checked, mode, isSmart, smartData } = getInclusionState(inc.key)
            const isExpanded = expandedInclusionField === inc.key

            return (
              <div
                key={inc.key}
                style={{
                  background: isExpanded ? 'var(--panel-soft)' : 'transparent',
                  border: isExpanded ? '1px solid var(--line)' : '1px dashed transparent',
                  borderRadius: '6px',
                  padding: isExpanded ? '12px' : '4px 0'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 600
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleInclusionCheckboxChange(inc.key, e.target.checked)}
                      style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                    />
                    <span>{inc.label}</span>
                  </label>

                  {checked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        value={mode}
                        onChange={(e) => handleInclusionModeChange(inc.key, e.target.value as any)}
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--line)',
                          background: 'var(--panel)',
                          color: 'var(--ink)'
                        }}
                      >
                        <option value="always">Always Include</option>
                        <option value="conditional">⚡ Conditional check</option>
                      </select>

                      {isSmart && (
                        <button
                          type="button"
                          onClick={() => setExpandedInclusionField(isExpanded ? null : inc.key)}
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 8px',
                            background: 'transparent',
                            border: '1px solid var(--accent)',
                            color: 'var(--accent)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          {isExpanded ? 'Hide Conditions ▲' : 'Edit Conditions ▼'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && isSmart && smartData && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingLeft: '22px',
                      borderLeft: '2px solid var(--accent)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                      <span>Operator:</span>
                      <select
                        value={smartData.operator || 'OR'}
                        onChange={(e) =>
                          handleInclusionsChange(inc.key, { ...smartData, operator: e.target.value as 'AND' | 'OR' })
                        }
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--line)',
                          background: 'var(--panel)',
                          color: 'var(--ink)'
                        }}
                      >
                        <option value="OR">OR (any condition matches)</option>
                        <option value="AND">AND (all conditions match)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(smartData.conditions || []).map((cond, cIdx) => (
                        <div
                          key={cIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            padding: '8px',
                            background: 'var(--panel)',
                            border: '1px solid var(--line)',
                            borderRadius: '4px'
                          }}
                        >
                          <select
                            value={cond.type}
                            onChange={(e) => handleInclusionConditionFieldChange(inc.key, cIdx, 'type', e.target.value)}
                            style={{
                              fontSize: '11px',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)'
                            }}
                          >
                            <option value="numeric_range">Numeric Range</option>
                            <option value="keyword_in_summary">Keyword in Full Summary</option>
                            <option value="keyword_in_section">Keyword in Specific Section</option>
                            <option value="keyword_in_rejected_tests">Keyword in Rejected Tests</option>
                          </select>

                          {cond.type === 'numeric_range' && (
                            <>
                              <input
                                type="number"
                                placeholder="Min"
                                value={cond.min ?? ''}
                                onChange={(e) =>
                                  handleInclusionConditionFieldChange(
                                    inc.key,
                                    cIdx,
                                    'min',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                                style={{
                                  width: '60px',
                                  fontSize: '11px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--line)'
                                }}
                              />
                              <span>to</span>
                              <input
                                type="number"
                                placeholder="Max"
                                value={cond.max ?? ''}
                                onChange={(e) =>
                                  handleInclusionConditionFieldChange(
                                    inc.key,
                                    cIdx,
                                    'max',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                                style={{
                                  width: '60px',
                                  fontSize: '11px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--line)'
                                }}
                              />
                              <select
                                value={cond.unit || 'C'}
                                onChange={(e) =>
                                  handleInclusionConditionFieldChange(inc.key, cIdx, 'unit', e.target.value)
                                }
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--line)'
                                }}
                              >
                                <option value="C">°C</option>
                                <option value="F">°F</option>
                              </select>
                            </>
                          )}

                          {cond.type === 'keyword_in_section' && (
                            <input
                              type="text"
                              placeholder="Section (e.g. hpi)"
                              value={cond.targetSection || ''}
                              onChange={(e) =>
                                handleInclusionConditionFieldChange(inc.key, cIdx, 'targetSection', e.target.value)
                              }
                              style={{
                                width: '120px',
                                fontSize: '11px',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                border: '1px solid var(--line)'
                              }}
                            />
                          )}

                          {cond.type !== 'numeric_range' && (
                            <input
                              type="text"
                              placeholder="Keyword/phrase"
                              value={cond.keyword || ''}
                              onChange={(e) =>
                                handleInclusionConditionFieldChange(inc.key, cIdx, 'keyword', e.target.value)
                              }
                              style={{
                                width: '120px',
                                fontSize: '11px',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                border: '1px solid var(--line)'
                              }}
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveInclusionCondition(inc.key, cIdx)}
                            style={{
                              padding: '2px 6px',
                              background: 'var(--panel)',
                              border: '1px solid var(--bad)',
                              color: 'var(--bad)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '10px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddInclusionCondition(inc.key)}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '4px 10px',
                          border: '1px dashed var(--accent)',
                          background: 'transparent',
                          color: 'var(--accent)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        + Add Condition
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Multi-Source Conditional Rules Engine with live conflict tracker */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🌌 Conditional Override Rules Manager
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
              Define customized clinical rules triggered when keywords appear in EMR sections or rejected tests list.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddConditionalRule}
            style={{
              fontSize: '11px',
              padding: '6px 12px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            + Add Override Rule
          </button>
        </div>

        {conditionalRules.length === 0 ? (
          <div
            style={{
              border: '1px dashed var(--line)',
              padding: '20px',
              textAlign: 'center',
              borderRadius: '6px',
              color: 'var(--muted)',
              fontSize: '12px'
            }}
          >
            No conditional override rules defined for this version. Click the button above to add one!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {conditionalRules.map((rule, idx) => {
              const ruleConflicts = conflicts.filter((c) => c.ruleId === rule.id)

              return (
                <div
                  key={rule.id}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '16px',
                    background: 'var(--panel-soft)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--line)',
                      paddingBottom: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>Rule #{idx + 1}</span>
                      <input
                        type="text"
                        placeholder="Rule Name (e.g. Sepsis Protocol)"
                        value={rule.name || ''}
                        onChange={(e) => handleConditionalRuleChange(rule.id, 'name', e.target.value)}
                        style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          flex: 1,
                          maxWidth: '240px',
                          fontWeight: 600,
                          background: 'var(--panel)',
                          color: 'var(--ink)'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveConditionalRule(rule.id)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--bad)',
                        background: 'transparent',
                        color: 'var(--bad)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      Delete Rule
                    </button>
                  </div>

                  {/* Conflict Messages */}
                  {ruleConflicts.map((conflictMsg, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background:
                          conflictMsg.type === 'warning' ? 'rgba(197, 34, 31, 0.08)' : 'rgba(26, 115, 232, 0.08)',
                        border: `1px solid ${conflictMsg.type === 'warning' ? 'rgba(197, 34, 31, 0.2)' : 'rgba(26, 115, 232, 0.2)'}`,
                        color: conflictMsg.type === 'warning' ? 'var(--bad)' : 'var(--accent)'
                      }}
                    >
                      {conflictMsg.message}
                    </div>
                  ))}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          marginBottom: '4px'
                        }}
                      >
                        Keyword / Phrase Trigger
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. sepsis, fever, hydration"
                        value={rule.triggerValue || ''}
                        onChange={(e) => handleConditionalRuleChange(rule.id, 'triggerValue', e.target.value)}
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          padding: '6px 10px',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          background: 'var(--panel)',
                          color: 'var(--ink)'
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          marginBottom: '4px'
                        }}
                      >
                        Exclude Keywords (Negative)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. chronic, history"
                        value={rule.excludeKeywords || ''}
                        onChange={(e) => handleConditionalRuleChange(rule.id, 'excludeKeywords', e.target.value)}
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          padding: '6px 10px',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          background: 'var(--panel)',
                          color: 'var(--ink)'
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          marginBottom: '4px'
                        }}
                      >
                        Target AI Ruleset Field
                      </label>
                      <select
                        value={rule.targetRuleField}
                        onChange={(e) => handleConditionalRuleChange(rule.id, 'targetRuleField', e.target.value)}
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          padding: '6px 10px',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          background: 'var(--panel)',
                          color: 'var(--ink)'
                        }}
                      >
                        <option value="systemInstructions">Task & System Instructions</option>
                        <option value="inputRules">Input Rules & Clinical Filtering</option>
                        <option value="outputRules">Output Format & Grammar Constraints</option>
                        <option value="clinicalNecessityIndicators">Clinical Necessity Indicators</option>
                        <option value="clinicalLogicChains">Clinical Logic Chains</option>
                        <option value="regulatoryCompliance">Regulatory Compliance</option>
                        <option value="acronymGlossary">Acronym Glossary mappings</option>
                        <option value="negativeConstraints">Negative Constraints</option>
                        <option value="styleToneGuard">Style & Tone Guard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                        marginBottom: '4px'
                      }}
                    >
                      Action Mode
                    </label>
                    <select
                      value={rule.action}
                      onChange={(e) => handleConditionalRuleChange(rule.id, 'action', e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: '12px',
                        padding: '6px 10px',
                        border: '1px solid var(--line)',
                        borderRadius: '4px',
                        background: 'var(--panel)',
                        color: 'var(--ink)'
                      }}
                    >
                      <option value="replace_generic">Replace standard preset rule text completely</option>
                      <option value="append_generic">Append to the bottom of standard preset rules</option>
                      <option value="replace_custom">Replace custom override rules completely</option>
                      <option value="append_custom">Append to the bottom of custom override rules</option>
                    </select>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                        marginBottom: '4px'
                      }}
                    >
                      Triggers on matches in sources:
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px 12px',
                        background: 'var(--panel)',
                        padding: '10px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px'
                      }}
                    >
                      {sourceOptions.map((opt) => {
                        const hasSource = (rule.sources || []).includes(opt.value as any)
                        return (
                          <label
                            key={opt.value}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={hasSource}
                              onChange={() => handleToggleSourceInRule(rule, opt.value)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        marginBottom: '4px'
                      }}
                    >
                      Injected Rule Text
                    </label>
                    <AutosizeTextArea
                      rows={2}
                      value={rule.ruleText || ''}
                      onChange={(e) => handleConditionalRuleChange(rule.id, 'ruleText', e.target.value)}
                      placeholder="Enter the specific guidelines or instructions to inject when this rule matches..."
                      style={{
                        width: '100%',
                        fontSize: '12px',
                        padding: '8px 10px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        background: 'var(--panel)',
                        color: 'var(--ink)'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Banned Words */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
        <h4
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--ink)',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🚫 Prohibited & Banned Words
        </h4>
        <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
          Comma-separated list of terms the AI is strictly prohibited from generating (e.g., possibly, guess, check).
        </span>
        <input
          type="text"
          value={bannedWords.join(', ')}
          onChange={(e) => handleBannedWordsChange(e.target.value)}
          placeholder="e.g. possibly, guess, or, check"
          style={{
            width: '100%',
            fontSize: '12px',
            padding: '8px 10px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            color: 'var(--ink)'
          }}
        />
      </div>

      {/* Legacy Audit features */}
      <div
        style={{
          borderTop: '1px solid var(--line)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={activeVersionData.omitDiagnoses || false}
            onChange={(e) => updateVersionField('omitDiagnoses', e.target.checked)}
            style={{ cursor: 'pointer', width: '14px', height: '14px' }}
          />
          <span style={{ fontWeight: 600 }}>Omit Diagnoses Block (Globally)</span>
        </label>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '4px'
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Age Format Rule</span>
          </div>
          <select
            value={activeVersionData.ageFormatVersion || 'v1.1'}
            onChange={(e) => updateVersionField('ageFormatVersion', e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'var(--panel)',
              color: 'var(--ink)'
            }}
          >
            <option value="v1">Legacy (35y, 8m)</option>
            <option value="v1.1">Modern (35 yr, 8 months)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
