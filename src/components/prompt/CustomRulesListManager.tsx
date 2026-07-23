import React, { useState, useEffect } from 'react'
import { Tooltip } from '@mantine/core'
import { AutosizeTextArea } from './AutosizeTextArea'

interface CustomRuleItem {
  id: string
  text: string
  enabled: boolean
}

interface CustomRulesListManagerProps {
  field: string
  value: string
  onChange: (newVal: string) => void
  disabled?: boolean
}

// Predefined Clinical Guidelines suggestion templates
const SUGGESTIONS_LIBRARY: Record<string, string[]> = {
  systemInstructions: [
    'Ensure justifications are structured logically with clear diagnostic links.',
    'Act as a senior clinical claims director with forensic medical audit precision.',
    'Prioritize justifying emergency laboratory and diagnostic services.',
    'Maintain high-density clinical evidence with zero filler statements.'
  ],
  inputRules: [
    'Highlight abnormal temperature levels as primary diagnostic indicators.',
    'Cross-reference subjective patient complaints directly with objective findings.',
    'Ignore routine administrative checkup statements during parsing.',
    'Strictly filter out normal clinical observations unless they rule out severe pathways.'
  ],
  outputRules: [
    'Limit clinical justification paragraphs to a maximum of 3 direct sentences.',
    'Enforce strict paragraph structures; do not output list points.',
    'Verify that no forbidden or subjective phrases are generated.',
    'Ensure all medical terms use their standard shorthand synonyms.'
  ],
  demographicsFormat: [
    'Always start the introduction with patient age, gender, and chronic history.',
    'Incorporate major chronic conditions (e.g., DM, HTN) directly in profile headers.',
    'Omit specific patient names to maximize clinical anonymity.'
  ],
  normalizationDictionaries: [
    "Map 'urinary tract infection' to 'UTI'.",
    "Map 'gastroesophageal reflux disease' to 'GERD'.",
    "Map 'diabetes mellitus' to 'DM'.",
    "Map 'chronic kidney disease' to 'CKD'."
  ],
  clinicalNecessityIndicators: [
    'Anchor ordered radiology procedures directly to matching physical exam notes.',
    'Highlight vital sign thresholds (e.g. Temp > 38°C) as clinical necessity triggers.',
    'Explicitly justify laboratory screenings using presenting diagnostic symptoms.'
  ],
  clinicalLogicChains: [
    'Establish sequential reasoning chains: Symptom -> Objective finding -> Ordered test.',
    'Chronologically trace complaints from initial consultation to clinical orders.'
  ],
  regulatoryCompliance: [
    'Align all medical justification terminology with regional coding standards.',
    'Incorporate compliance directives for preventative health coverage.'
  ],
  acronymGlossary: [
    "Abbreviate 'complete blood count' as 'CBC'.",
    "Abbreviate 'electrocardiogram' as 'ECG'.",
    "Abbreviate 'renal function test' as 'RFT'."
  ],
  negativeConstraints: [
    'Never mention routine screening, preventative checks, or administrative visits.',
    'Exclude code names or proprietary internal clinical system codes.'
  ],
  styleToneGuard: [
    'Use formal, objective, third-person clinical passive voice.',
    'Avoid words expressing uncertainty (e.g., perhaps, maybe, possibly).'
  ]
}

export function CustomRulesListManager({ field, value, onChange, disabled = false }: CustomRulesListManagerProps) {
  const [items, setItems] = useState<CustomRuleItem[]>([])
  const [newRuleInput, setNewRuleInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [lastSerialized, setLastSerialized] = useState<string | null>(null)

  // Parse incoming raw newline-separated string on load / value changes
  useEffect(() => {
    // If the value matches our last serialized version, don't re-parse to avoid resetting IDs or checkboxes
    if (lastSerialized !== null && value.trim() === lastSerialized.trim()) {
      return
    }

    const lines = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const parsedItems = lines.map((line, idx) => {
      // Strip leading bullet markers like "-", "*", "1.", etc.
      const cleanedText = line.replace(/^[-*•\d.]+\s*/, '')
      return {
        id: `${idx}-${cleanedText.substring(0, 10)}`,
        text: cleanedText,
        enabled: true
      }
    })

    setItems(parsedItems)
    setLastSerialized(value)
  }, [value, field]) // Re-run when the active field card or value changes

  // Synchronize state array changes back to serialized customRule string
  const serializeAndTriggerChange = (updatedItems: CustomRuleItem[]) => {
    const joined = updatedItems
      .filter((item) => item.enabled && item.text.trim())
      .map((item) => `- ${item.text.trim()}`)
      .join('\n')
    setLastSerialized(joined)
    onChange(joined)
  }

  const handleAddRule = (textToAdd: string) => {
    const trimmed = textToAdd.trim()
    if (!trimmed) return

    // Prevent duplicates
    if (items.some((item) => item.text.toLowerCase() === trimmed.toLowerCase())) return

    const newItem: CustomRuleItem = {
      id: Math.random().toString(36).substring(7),
      text: trimmed,
      enabled: true
    }
    const updated = [...items, newItem]
    setItems(updated)
    serializeAndTriggerChange(updated)
    setNewRuleInput('')
  }

  const handleToggleItem = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, enabled: !item.enabled }
      }
      return item
    })
    setItems(updated)
    serializeAndTriggerChange(updated)
  }

  const handleItemTextChange = (id: string, newText: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, text: newText }
      }
      return item
    })
    setItems(updated)
    serializeAndTriggerChange(updated)
  }

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    serializeAndTriggerChange(updated)
  }

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return
    const updated = [...items]
    const temp = updated[idx]
    updated[idx] = updated[idx - 1]
    updated[idx - 1] = temp
    setItems(updated)
    serializeAndTriggerChange(updated)
  }

  const handleMoveDown = (idx: number) => {
    if (idx === items.length - 1) return
    const updated = [...items]
    const temp = updated[idx]
    updated[idx] = updated[idx + 1]
    updated[idx + 1] = temp
    setItems(updated)
    serializeAndTriggerChange(updated)
  }

  const suggestions = SUGGESTIONS_LIBRARY[field] || []

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
    >
      {/* Rule Add Input block */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Type custom rule bullet point..."
          value={newRuleInput}
          onChange={(e) => setNewRuleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddRule(newRuleInput)
            }
          }}
          style={{
            flex: 1,
            fontSize: '11.5px',
            padding: '6px 10px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            color: 'var(--ink)'
          }}
        />
        <button
          type="button"
          onClick={() => handleAddRule(newRuleInput)}
          style={{
            fontSize: '11.5px',
            padding: '6px 12px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          ➕ Add
        </button>
      </div>

      {/* Clinical Suggestions Library */}
      {suggestions.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            style={{
              fontSize: '10.5px',
              padding: '2px 8px',
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: '4px',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            💡 {showSuggestions ? 'Hide Preset Snippets ▲' : 'Browse Pre-approved Clinical Guidelines ▼'}
          </button>

          {showSuggestions && (
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: 0,
                right: 0,
                zIndex: 10,
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '180px',
                overflowY: 'auto'
              }}
            >
              {suggestions.map((sug, sIdx) => (
                <div
                  key={sIdx}
                  onClick={() => {
                    handleAddRule(sug)
                    setShowSuggestions(false)
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: 'var(--panel-soft)',
                    border: '1px solid transparent',
                    color: 'var(--ink)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.background = 'var(--panel)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.background = 'var(--panel-soft)'
                  }}
                >
                  ➕ {sug}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rules list builder */}
      {items.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--line)',
            padding: '16px',
            textAlign: 'center',
            borderRadius: '6px',
            color: 'var(--muted)',
            fontSize: '11px'
          }}
        >
          No custom rules points added yet. Use the input above or browse preset snippets!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: item.enabled ? 'var(--panel)' : 'var(--panel-soft)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '6px 10px',
                opacity: item.enabled ? 1 : 0.6
              }}
            >
              {/* Enable / Disable toggle */}
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => handleToggleItem(item.id)}
                style={{ cursor: 'pointer', width: '13px', height: '14px' }}
                title={item.enabled ? 'Disable rule point' : 'Enable rule point'}
              />

              {/* Rule input box */}
              <input
                type="text"
                value={item.text}
                onChange={(e) => handleItemTextChange(item.id, e.target.value)}
                disabled={!item.enabled}
                style={{
                  flex: 1,
                  fontSize: '11.5px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink)',
                  outline: 'none',
                  textDecoration: item.enabled ? 'none' : 'line-through'
                }}
              />

              {/* Control arrows and delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Tooltip label="Move instruction priority up" openDelay={0} closeDelay={0} withinPortal zIndex={3000}>
                  <button
                    type="button"
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: idx === 0 ? 'var(--line)' : 'var(--accent)',
                      cursor: idx === 0 ? 'default' : 'pointer',
                      fontSize: '10px',
                      padding: '2px'
                    }}
                  >
                    ▲
                  </button>
                </Tooltip>
                <Tooltip label="Move instruction priority down" openDelay={0} closeDelay={0} withinPortal zIndex={3000}>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === items.length - 1}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: idx === items.length - 1 ? 'var(--line)' : 'var(--accent)',
                      cursor: idx === items.length - 1 ? 'default' : 'pointer',
                      fontSize: '10px',
                      padding: '2px'
                    }}
                  >
                    ▼
                  </button>
                </Tooltip>
                <Tooltip label="Delete rule point" openDelay={0} closeDelay={0} withinPortal zIndex={3000}>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--bad)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px',
                      marginLeft: '4px'
                    }}
                  >
                    ✕
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
