import React from 'react'
import { Badge, BadgeProps, MantineColor, MantineRadius } from '@mantine/core'
import { LtTooltip } from './LtTooltip'

export type LtChipPalette = 'error' | 'success' | 'warning' | 'neutral' | 'info'

export interface LtChipProps extends Omit<BadgeProps, 'children'> {
  children: React.ReactNode
  palette?: LtChipPalette
  tooltip?: string
}

const PALETTE_BG: Record<LtChipPalette, string> = {
  error: 'var(--badge-error-bg, rgba(239, 68, 68, 0.15))',
  success: 'var(--badge-success-bg, rgba(16, 185, 129, 0.15))',
  warning: 'var(--badge-warning-bg, rgba(245, 158, 11, 0.15))',
  neutral: 'var(--badge-neutral-bg, rgba(148, 163, 184, 0.12))',
  info: 'rgba(2, 132, 199, 0.15)'
}

const PALETTE_BORDER: Record<LtChipPalette, string> = {
  error: '1px solid var(--badge-error-border, rgba(239, 68, 68, 0.3))',
  success: '1px solid var(--badge-success-border, rgba(16, 185, 129, 0.3))',
  warning: '1px solid var(--badge-warning-border, rgba(245, 158, 11, 0.3))',
  neutral: '1px solid var(--badge-neutral-border, rgba(148, 163, 184, 0.25))',
  info: '1px solid rgba(2, 132, 199, 0.3)'
}

const PALETTE_TEXT: Record<LtChipPalette, string> = {
  error: 'var(--badge-error-text, #ef4444)',
  success: 'var(--badge-success-text, #10b981)',
  warning: 'var(--badge-warning-text, #f59e0b)',
  neutral: 'var(--badge-neutral-text, #94a3b8)',
  info: '#38bdf8'
}

export function LtChip({
  children,
  palette,
  tooltip,
  size = 'xs',
  fw = 600,
  variant = 'light',
  color,
  style,
  ...rest
}: LtChipProps) {
  const chip = palette ? (
    <Badge
      size={size}
      fw={fw}
      variant="none"
      style={{
        backgroundColor: PALETTE_BG[palette],
        border: PALETTE_BORDER[palette],
        color: PALETTE_TEXT[palette],
        height: '22px',
        padding: '0 8px',
        borderRadius: '4px',
        textTransform: 'none',
        ...style
      }}
      {...rest}
    >
      {children}
    </Badge>
  ) : (
    <Badge
      size={size}
      fw={fw}
      variant={variant}
      color={color}
      style={{ textTransform: 'none', ...style }}
      {...rest}
    >
      {children}
    </Badge>
  )

  if (tooltip) {
    return <LtTooltip label={tooltip}>{chip}</LtTooltip>
  }

  return chip
}
