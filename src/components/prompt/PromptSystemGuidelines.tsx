import React from 'react'
import { AutosizeTextArea } from './AutosizeTextArea'
import { CustomRulesListManager } from './CustomRulesListManager'

interface Ruleset {
  genericRule?: string
  customRule?: string
  genericEnabled?: boolean
  customEnabled?: boolean
}

type RulesetOrString = string | Ruleset

interface PromptSystemGuidelinesProps {
  activeVersion: string
  activeVersionData: {
    systemInstructions?: RulesetOrString
    inputRules?: RulesetOrString
    outputRules?: RulesetOrString
    demographicsFormat?: RulesetOrString
    normalizationDictionaries?: RulesetOrString
    clinicalNecessityIndicators?: RulesetOrString
    clinicalLogicChains?: RulesetOrString
    regulatoryCompliance?: RulesetOrString
    acronymGlossary?: RulesetOrString
    negativeConstraints?: RulesetOrString
    styleToneGuard?: RulesetOrString
  }
  updateVersionField: (field: string, val: any) => void
}

export function PromptSystemGuidelines({
  activeVersion,
  activeVersionData,
  updateVersionField
}: PromptSystemGuidelinesProps) {
  // Helper to safely parse a field that might be string or Ruleset object
  const getRuleset = (fieldVal: RulesetOrString | undefined): Ruleset => {
    if (!fieldVal) return { genericRule: '', customRule: '', genericEnabled: true, customEnabled: true }
    if (typeof fieldVal === 'string') {
      return { genericRule: fieldVal, customRule: '', genericEnabled: true, customEnabled: true }
    }
    return {
      genericRule: fieldVal.genericRule || '',
      customRule: fieldVal.customRule || '',
      genericEnabled: fieldVal.genericEnabled ?? true,
      customEnabled: fieldVal.customEnabled ?? true
    }
  }

  const handleRulesetChange = (
    field: string,
    subField: 'genericRule' | 'customRule' | 'genericEnabled' | 'customEnabled',
    newVal: any
  ) => {
    const current = getRuleset((activeVersionData as any)[field])
    updateVersionField(field, {
      ...current,
      [subField]: newVal
    })
  }

  // Helper component to render a single ruleset card with generic and custom textareas
  const renderRulesetCard = (
    field: string,
    title: string,
    icon: string,
    description: string,
    placeholderGeneric = 'Standard preset rules...',
    placeholderCustom = 'Add your custom overrides or specific instructions here...'
  ) => {
    const { genericRule, customRule, genericEnabled, customEnabled } = getRuleset((activeVersionData as any)[field])
    const isGenericActive = genericEnabled !== false
    const isCustomActive = customEnabled !== false

    return (
      <div
        className="preload-card"
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--border-radius)',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--ink)'
            }}
          >
            <span>{icon}</span> {title}
          </label>
          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
            {description}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ opacity: isGenericActive ? 1 : 0.65, transition: 'all 0.2s ease' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: isGenericActive ? 'var(--muted)' : '#888'
                }}
              >
                🛡️ Standard Rule {isGenericActive ? '' : '(Disabled)'}
              </span>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: isGenericActive ? 'var(--accent)' : 'var(--muted)'
                }}
              >
                <input
                  type="checkbox"
                  checked={isGenericActive}
                  onChange={(e) => handleRulesetChange(field, 'genericEnabled', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Enabled
              </label>
            </div>
            <AutosizeTextArea
              rows={4}
              value={genericRule || ''}
              onChange={(e) => handleRulesetChange(field, 'genericRule', e.target.value)}
              disabled={!isGenericActive}
              style={{
                width: '100%',
                fontSize: '11.5px',
                padding: '8px 10px',
                background: isGenericActive ? 'var(--panel-soft)' : '#f1f3f4',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                fontFamily: 'monospace',
                color: isGenericActive ? 'var(--ink)' : 'var(--muted)',
                cursor: isGenericActive ? 'text' : 'not-allowed'
              }}
              placeholder={placeholderGeneric}
            />
          </div>
          <div style={{ transition: 'all 0.2s ease' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: isCustomActive ? 'var(--accent)' : '#888'
                }}
              >
                ✏️ Custom Override {isCustomActive ? '' : '(Disabled)'}
              </span>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: isCustomActive ? 'var(--accent)' : 'var(--muted)'
                }}
              >
                <input
                  type="checkbox"
                  checked={isCustomActive}
                  onChange={(e) => handleRulesetChange(field, 'customEnabled', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Enabled
              </label>
            </div>
            <CustomRulesListManager
              field={field}
              value={customRule || ''}
              onChange={(newVal) => handleRulesetChange(field, 'customRule', newVal)}
              disabled={!isCustomActive}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          padding: '4px 12px',
          background: 'rgba(26, 115, 232, 0.08)',
          border: '1px solid rgba(26, 115, 232, 0.2)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--accent)',
          fontWeight: 600
        }}
      >
        💡 <strong>Rules Engine:</strong> Each section can have standard rules and customized overrides to adapt to
        specific audits.
      </div>

      {renderRulesetCard(
        'systemInstructions',
        'Task & System Instructions',
        '🤖',
        'Defines the core persona and overall synthesis task of the artificial intelligence.'
      )}

      {renderRulesetCard(
        'inputRules',
        'Input Rules & Clinical Filtering',
        '📥',
        'Controls how incoming encounter logs are filtered, evaluated, and structured before compilation.'
      )}

      {renderRulesetCard(
        'outputRules',
        'Output Format & Grammar Constraints',
        '📤',
        'Specifies constraints on sentence length, word cases, past/present tense, and forbidden phrases.'
      )}

      {renderRulesetCard(
        'demographicsFormat',
        'Patient Demographics Pattern',
        '👥',
        'Pre-formatted template string used to output patient gender, age, and chronic medical history.'
      )}

      {renderRulesetCard(
        'normalizationDictionaries',
        'Vocabulary Normalizations & Symptom Compressions',
        '📖',
        'Maps verbose medical terms (e.g. "shortness of breath") directly to shorthand/concise terms (e.g. "dyspnea").'
      )}

      {renderRulesetCard(
        'clinicalNecessityIndicators',
        'Clinical Necessity Indicators',
        '📈',
        'Instructs the AI to highlight vital signs and measurement thresholds as evidence for specific tests.'
      )}

      {renderRulesetCard(
        'clinicalLogicChains',
        'Clinical Logic Chains',
        '🔗',
        'Directs the model to structure medical evidence chronologically (Symptom -> Objective Finding -> Plan).'
      )}

      {renderRulesetCard(
        'regulatoryCompliance',
        'Regulatory & Regional Compliance',
        '⚖️',
        'Enforces regional billing guidelines, coding protocols, and clinical standards.'
      )}

      {renderRulesetCard(
        'acronymGlossary',
        'Acronym Glossary mappings',
        '📚',
        'Defines custom clinical abbreviations and medical abbreviations utilized during justification.'
      )}

      {renderRulesetCard(
        'negativeConstraints',
        'Negative Constraints',
        '🛑',
        'Specifies what the AI must NOT mention (e.g., administrative routine, checkup indicators, billing status).'
      )}

      {renderRulesetCard(
        'styleToneGuard',
        'Style & Tone Guard',
        '🎙️',
        'Controls stylistic parameters such as third-person narrative, passive voice, and formal clinical tone.'
      )}
    </div>
  )
}
