import React from 'react'
import { Badge, BadgeProps, MantineColor } from '@mantine/core'

export type LtStatus = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral'

export interface LtStatusBadgeProps extends Omit<BadgeProps, 'color' | 'children'> {
  status?: LtStatus
  label?: React.ReactNode
  color?: MantineColor
}

const STATUS_COLOR_MAP: Record<LtStatus, MantineColor> = {
  success: 'green',
  warning: 'yellow',
  error: 'red',
  info: 'blue',
  pending: 'gray',
  neutral: 'gray'
}

export function LtStatusBadge({
  status = 'neutral',
  label,
  color,
  variant = 'light',
  size = 'xs',
  ...rest
}: LtStatusBadgeProps) {
  return (
    <Badge
      size={size}
      variant={variant}
      color={color ?? STATUS_COLOR_MAP[status]}
      styles={{
        label: {
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '0.02em'
        }
      }}
      {...rest}
    >
      {label}
    </Badge>
  )
}
