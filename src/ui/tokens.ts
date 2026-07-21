import { THEME_CONFIG, ThemeColors } from './themeConfig'

/**
 * Lifetrenz Local Portal Design System Tokens
 * Centralizes borders, radii, color palettes, and animation timings.
 * Strictly within our 300-line modular budget limit.
 */

export const BORDERS = {
  radiusSm: '4px',
  radiusMd: '6px',
  radiusLg: '12px',
  radiusFull: '9999px',
  widthThin: '1px',
  widthThick: '2px'
}

export const ANIMATIONS = {
  timingShort: '150ms',
  timingMedium: '250ms',
  timingLong: '350ms',
  curveEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
  curveSharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
}

/**
 * Apply design tokens dynamically to document element
 */
export function applyTokens(theme: 'light' | 'dark' = 'light') {
  const root = document.documentElement
  const colors: ThemeColors = THEME_CONFIG[theme] || THEME_CONFIG['light']

  // Set colors
  root.style.setProperty('--bg', colors.bg)
  root.style.setProperty('--bg-translucent', colors.bgTranslucent)
  root.style.setProperty('--panel', colors.panel)
  root.style.setProperty('--panel-soft', colors.panelSoft)
  root.style.setProperty('--ink', colors.ink)
  root.style.setProperty('--muted', colors.muted)
  root.style.setProperty('--line', colors.line)
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--accent-2', colors.accentSecondary)
  root.style.setProperty('--good', colors.good)
  root.style.setProperty('--bad', colors.bad)
  root.style.setProperty('--shimmer-base', colors.shimmerBase)
  root.style.setProperty('--shimmer-highlight', colors.shimmerHighlight)

  // Set borders
  root.style.setProperty('--border-radius', BORDERS.radiusMd)
  root.style.setProperty('--border-radius-sm', BORDERS.radiusSm)
  root.style.setProperty('--border-radius-lg', BORDERS.radiusLg)

  // Set animations
  root.style.setProperty('--transition-duration', ANIMATIONS.timingShort)
  root.style.setProperty('--transition-ease', ANIMATIONS.curveEase)
}
