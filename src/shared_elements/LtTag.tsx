import React from 'react'
import { BadgeProps, MantineColor, MantineRadius, ActionIcon } from '@mantine/core'
import { X } from 'lucide-react'
import { LtChip, LtChipPalette } from './LtChip'

export interface LtTagProps extends Omit<BadgeProps, 'children'> {
  children: React.ReactNode
  palette?: LtChipPalette
  tooltip?: string
  leftIcon?: React.ComponentType<{ size?: number }>
  rightIcon?: React.ComponentType<{ size?: number }>
  onClose?: () => void
}

export function LtTag({
  children,
  palette,
  tooltip,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onClose,
  size = 'xs',
  variant = 'light',
  color,
  ...rest
}: LtTagProps) {
  return (
    <LtChip
      palette={palette}
      tooltip={tooltip}
      size={size}
      variant={variant}
      color={color}
      leftSection={LeftIcon ? <LeftIcon size={10} /> : undefined}
      rightSection={
        onClose ? (
          <ActionIcon
            size={12}
            variant="transparent"
            color="gray"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            style={{ cursor: 'pointer', marginLeft: 2 }}
          >
            <X size={8} />
          </ActionIcon>
        ) : RightIcon ? (
          <RightIcon size={10} />
        ) : undefined
      }
      {...rest}
    >
      {children}
    </LtChip>
  )
}
