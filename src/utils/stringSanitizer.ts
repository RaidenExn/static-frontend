import { normalizeEncounterValue } from '../../shared/utils/helpers.ts'

/**
 * Utility to split, trim, sanitize and normalize raw copy-paste data
 * from spreadsheets (Excel) before sending to cache hydration processes.
 */
export function sanitizeExcelInput(text: string): string[] {
  if (!text) return []

  // Split cleanly using regex catching tabs, commas, and newlines
  const tokens = text.split(/\r?\n|[\t,]/)

  return (
    tokens
      .map((token) => token.trim())
      // Filter out empty strings or falsy values
      .filter((token) => !!token)
      // Filter out non-encounter strings (e.g., must contain 'ENC' and at least one number)
      .filter((token) => /ENC[-\/]?\d+/i.test(token))
      // Normalize format: Replace ENC/ with ENC- and uppercase the prefix/year/encounter structure
      .map((token) => normalizeEncounterValue(token))
  )
}
