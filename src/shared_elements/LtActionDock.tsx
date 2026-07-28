import React from 'react'
import { Group, Box, MantineSpacing } from '@mantine/core'

export interface LtActionDockProps {
  children?: React.ReactNode
  gap?: MantineSpacing
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  style?: React.CSSProperties
  className?: string
}

export function LtActionDock({
  children,
  gap = 'xs',
  align = 'center',
  justify = 'flex-start',
  style,
  className
}: LtActionDockProps) {
  return (
    <Box className={className} style={{ width: 'auto', ...style }}>
      <Group gap={gap} align={align} justify={justify} wrap="nowrap">
        {children}
      </Group>
    </Box>
  )
}
