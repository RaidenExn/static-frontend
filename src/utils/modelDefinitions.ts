export interface ModelPreset {
  value: string
  label: string // The full label used in settings/API dashboard, e.g. "Gemini 2.5 Flash (google/gemini-2.5-flash)"
  shortLabel: string // The short label used in the Action Bar, e.g. "Gemini 2.5 Flash"
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    value: 'openrouter/auto',
    label: 'Auto (Recommended - openrouter/auto)',
    shortLabel: 'Auto (Recommended)'
  },
  {
    value: 'openai/gpt-4o-mini',
    label: 'GPT-4o Mini (openai/gpt-4o-mini)',
    shortLabel: 'GPT-4o Mini'
  }
]

export const GEMINI_MODEL_PRESETS: ModelPreset[] = [
  {
    value: 'models/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash (models/gemini-2.5-flash)',
    shortLabel: 'Gemini 2.5 Flash'
  },
  {
    value: 'models/gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash-Lite (models/gemini-2.0-flash-lite)',
    shortLabel: 'Gemini 2.0 Lite'
  },
  {
    value: 'models/gemini-2.5-pro',
    label: 'Gemini 2.5 Pro (models/gemini-2.5-pro)',
    shortLabel: 'Gemini 2.5 Pro'
  },
  {
    value: 'models/gemini-1.5-flash',
    label: 'Gemini 1.5 Flash (models/gemini-1.5-flash)',
    shortLabel: 'Gemini 1.5 Flash'
  }
]

export const APPLE_MODEL_PRESETS: ModelPreset[] = [
  {
    value: 'apple/system-core',
    label: 'Apple Intelligence (On-Device Core Model)',
    shortLabel: 'Apple On-Device'
  }
]

export const VALID_MODEL_VALUES = [
  ...MODEL_PRESETS.map((p) => p.value),
  ...GEMINI_MODEL_PRESETS.map((p) => p.value),
  ...APPLE_MODEL_PRESETS.map((p) => p.value)
]
