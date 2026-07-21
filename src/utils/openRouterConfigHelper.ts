/**
 * OpenRouter Configuration Helper
 * Provides validation and serialization utilities for API configuration management.
 */

export interface ILovePdfKey {
  publicKey: string
  privateKey?: string
  remainingFiles?: number
  remainingCredits?: number
  status?: string
}

export interface ILovePdfSettings {
  defaultPublicKey: string
  region?: string
  maxPoolSize?: number
  compressionLevel?: 'recommended' | 'extreme' | 'low'
  uploadMethod?: 'auto' | 'multipart' | 'cloud_pull'
  workflowMethod?: 'auto' | 'pool_only' | 'parallel_only' | 'sequential_only'
  keys: ILovePdfKey[]
}

export interface OpenRouterSettings {
  apiKey: string
  model: string
  maxTokens?: number
}

export interface GeminiSettings {
  apiKey: string
  model: string
  maxTokens?: number
  customModels: string[]
}

export interface ApiConfigBundle {
  ilovepdf: ILovePdfSettings
  openrouter: OpenRouterSettings & {
    customModels: string[]
  }
  gemini?: GeminiSettings
}

/**
 * Validates a custom model identifier string.
 * Must be non-empty, must contain alphanumeric characters, slashes, dashes, dots, or underscores.
 * Must not be equal to "custom" or contain spaces.
 */
export function validateModelId(modelId: string): { isValid: boolean; error?: string } {
  const trimmed = modelId.trim()
  if (!trimmed) {
    return { isValid: false, error: 'Model ID cannot be empty.' }
  }
  if (trimmed.toLowerCase() === 'custom') {
    return { isValid: false, error: 'Model ID cannot be the reserved keyword "custom".' }
  }
  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Model ID cannot contain spaces.' }
  }
  // Standard format check: typically organization/model-name, but can be just a model name or contain a colon (e.g., :free)
  const modelRegex = /^[a-zA-Z0-9_\-\.\/\:]+$/
  if (!modelRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Model ID can only contain alphanumeric characters, slashes, dashes, dots, underscores, and colons.'
    }
  }
  return { isValid: true }
}

/**
 * Validates and parses an imported configuration JSON string.
 */
export function parseAndValidateImportConfig(jsonText: string): {
  isValid: boolean
  data?: ApiConfigBundle
  error?: string
} {
  try {
    const parsed = JSON.parse(jsonText)
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Invalid JSON format. Expected an object.' }
    }

    // Prepare robust schema structure
    const bundle: Partial<ApiConfigBundle> = {}

    if (parsed.ilovepdf) {
      const keys = Array.isArray(parsed.ilovepdf.keys)
        ? parsed.ilovepdf.keys
            .map((k: any) => ({
              publicKey: String(k?.publicKey || '').trim(),
              privateKey: String(k?.privateKey || '').trim(),
              remainingFiles: typeof k?.remainingFiles === 'number' ? k.remainingFiles : -1,
              remainingCredits: typeof k?.remainingCredits === 'number' ? k.remainingCredits : -1,
              status: String(k?.status || 'unchecked').trim()
            }))
            .filter((k: any) => k.publicKey)
        : []

      bundle.ilovepdf = {
        defaultPublicKey: String(parsed.ilovepdf.defaultPublicKey || '').trim(),
        region: parsed.ilovepdf.region ? String(parsed.ilovepdf.region).trim() : undefined,
        maxPoolSize: typeof parsed.ilovepdf.maxPoolSize === 'number' ? parsed.ilovepdf.maxPoolSize : undefined,
        compressionLevel: parsed.ilovepdf.compressionLevel
          ? (String(parsed.ilovepdf.compressionLevel).trim() as any)
          : undefined,
        uploadMethod: parsed.ilovepdf.uploadMethod ? (String(parsed.ilovepdf.uploadMethod).trim() as any) : undefined,
        workflowMethod: parsed.ilovepdf.workflowMethod
          ? (String(parsed.ilovepdf.workflowMethod).trim() as any)
          : undefined,
        keys
      }
    }

    if (parsed.openrouter) {
      const customModels = Array.isArray(parsed.openrouter.customModels)
        ? parsed.openrouter.customModels.map((m: any) => String(m).trim()).filter(Boolean)
        : []

      bundle.openrouter = {
        apiKey: String(parsed.openrouter.apiKey || '').trim(),
        model: String(parsed.openrouter.model || 'openrouter/auto').trim(),
        maxTokens: typeof parsed.openrouter.maxTokens === 'number' ? parsed.openrouter.maxTokens : 4096,
        customModels
      }
    }

    if (parsed.gemini) {
      const customModels = Array.isArray(parsed.gemini.customModels)
        ? parsed.gemini.customModels.map((m: any) => String(m).trim()).filter(Boolean)
        : []

      bundle.gemini = {
        apiKey: String(parsed.gemini.apiKey || '').trim(),
        model: String(parsed.gemini.model || 'models/gemini-2.5-flash').trim(),
        maxTokens: typeof parsed.gemini.maxTokens === 'number' ? parsed.gemini.maxTokens : 4096,
        customModels
      }
    }

    if (!bundle.ilovepdf && !bundle.openrouter && !bundle.gemini) {
      return {
        isValid: false,
        error: 'Imported file contains no valid iLovePDF, OpenRouter or Gemini configuration blocks.'
      }
    }

    return { isValid: true, data: bundle as ApiConfigBundle }
  } catch (err: any) {
    return { isValid: false, error: `Failed to parse file: ${err.message}` }
  }
}
