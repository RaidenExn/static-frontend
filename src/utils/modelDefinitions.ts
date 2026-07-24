export interface ModelPreset {
  value: string
  label: string
  shortLabel: string
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

export const ALL_PRESETS: ModelPreset[] = [...MODEL_PRESETS, ...GEMINI_MODEL_PRESETS]

export const VALID_MODEL_VALUES = ALL_PRESETS.map((p) => p.value)

export function mergeModelOptions(
  provider: 'openrouter' | 'gemini',
  customModels: string[],
  variant: 'short' | 'full' = 'short'
): { value: string; label: string }[] {
  const presets = provider === 'gemini' ? GEMINI_MODEL_PRESETS : MODEL_PRESETS
  const known = new Set(presets.map((p) => p.value))
  const custom = customModels
    .filter((m) => !known.has(m))
    .map((m) => ({ value: m, label: m }))
  return [
    ...presets.map((p) => ({ value: p.value, label: variant === 'full' ? p.label : p.shortLabel })),
    ...custom,
    { value: 'custom', label: 'Custom Model ID...' }
  ]
}
