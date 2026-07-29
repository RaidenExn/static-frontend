import React from 'react'
import { LtTooltip } from './LtTooltip'
import { LtChipPalette } from './LtChip'

export type LtPillColor = 'error' | 'success' | 'warning' | 'neutral' | 'info' | 'gray' | 'blue' | 'green' | 'teal' | 'orange' | 'red' | 'cyan'

export interface LtPillProps {
  children: React.ReactNode
  color?: LtPillColor
  tooltip?: string
  style?: React.CSSProperties
  className?: string
}

const PILL_BG: Record<LtPillColor, string> = {
  error: 'var(--badge-error-bg, rgba(239, 68, 68, 0.15))',
  success: 'var(--badge-success-bg, rgba(16, 185, 129, 0.15))',
  warning: 'var(--badge-warning-bg, rgba(245, 158, 11, 0.15))',
  neutral: 'var(--badge-neutral-bg, rgba(148, 163, 184, 0.12))',
  info: 'rgba(2, 132, 199, 0.15)',
  gray: 'var(--badge-neutral-bg, rgba(148, 163, 184, 0.12))',
  blue: 'rgba(2, 132, 199, 0.15)',
  green: 'var(--badge-success-bg, rgba(16, 185, 129, 0.15))',
  teal: 'rgba(20, 184, 166, 0.15)',
  orange: 'var(--badge-warning-bg, rgba(245, 158, 11, 0.15))',
  red: 'var(--badge-error-bg, rgba(239, 68, 68, 0.15))',
  cyan: 'rgba(6, 182, 212, 0.15)'
}

const PILL_BORDER: Record<LtPillColor, string> = {
  error: '1px solid var(--badge-error-border, rgba(239, 68, 68, 0.3))',
  success: '1px solid var(--badge-success-border, rgba(16, 185, 129, 0.3))',
  warning: '1px solid var(--badge-warning-border, rgba(245, 158, 11, 0.3))',
  neutral: '1px solid var(--badge-neutral-border, rgba(148, 163, 184, 0.25))',
  info: '1px solid rgba(2, 132, 199, 0.3)',
  gray: '1px solid var(--badge-neutral-border, rgba(148, 163, 184, 0.25))',
  blue: '1px solid rgba(2, 132, 199, 0.3)',
  green: '1px solid var(--badge-success-border, rgba(16, 185, 129, 0.3))',
  teal: '1px solid rgba(20, 184, 166, 0.3)',
  orange: '1px solid var(--badge-warning-border, rgba(245, 158, 11, 0.3))',
  red: '1px solid var(--badge-error-border, rgba(239, 68, 68, 0.3))',
  cyan: '1px solid rgba(6, 182, 212, 0.3)'
}

const PILL_TEXT: Record<LtPillColor, string> = {
  error: 'var(--badge-error-text, #ef4444)',
  success: 'var(--badge-success-text, #10b981)',
  warning: 'var(--badge-warning-text, #f59e0b)',
  neutral: 'var(--badge-neutral-text, #94a3b8)',
  info: '#38bdf8',
  gray: 'var(--badge-neutral-text, #94a3b8)',
  blue: '#38bdf8',
  green: 'var(--badge-success-text, #10b981)',
  teal: '#14b8a6',
  orange: 'var(--badge-warning-text, #f59e0b)',
  red: 'var(--badge-error-text, #ef4444)',
  cyan: '#06b6d4'
}

export function LtPill({
  children,
  color = 'neutral',
  tooltip,
  style,
  className
}: LtPillProps) {
  const pill = (
    <span
      className={className}
      style={{
        display: 'inline-block',
        height: '14px',
        padding: '2px 6px',
        fontSize: '8px',
        fontWeight: 600,
        lineHeight: '10px',
        borderRadius: 'var(--mantine-radius-md)',
        textTransform: 'none',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        backgroundColor: PILL_BG[color],
        border: PILL_BORDER[color],
        color: PILL_TEXT[color],
        ...style
      }}
    >
      {children}
    </span>
  )

  if (tooltip) {
    return <LtTooltip label={tooltip}>{pill}</LtTooltip>
  }

  return pill
}
