import React from 'react'
import { Table, Box, MantineSpacing, MantineColor } from '@mantine/core'
import { LtAppCard } from './LtAppCard'

export interface LtTableCardProps {
  title?: React.ReactNode
  icon?: React.ComponentType<{ size?: number }>
  badge?: React.ReactNode
  actions?: React.ReactNode
  loading?: boolean
  loadingText?: string
  scrollable?: boolean
  maxHeight?: number | string
  minHeight?: number | string
  padding?: MantineSpacing
  variant?: 'default' | 'light'
  color?: MantineColor
  style?: React.CSSProperties
  className?: string
  disableTableWrapper?: boolean
  children?: React.ReactNode
}

export function LtTableCard({
  title,
  icon,
  badge,
  actions,
  loading,
  loadingText,
  scrollable = false,
  maxHeight,
  minHeight,
  padding = 0,
  variant,
  color,
  style,
  className,
  disableTableWrapper = false,
  children
}: LtTableCardProps) {
  return (
    <LtAppCard
      title={title}
      icon={icon}
      badge={badge}
      actions={actions}
      loading={loading}
      loadingText={loadingText}
      scrollable={scrollable}
      maxHeight={maxHeight}
      minHeight={minHeight}
      padding={padding}
      variant={variant}
      color={color}
      className={className}
      style={style}
    >
      {disableTableWrapper ? children : (
        <Box style={{ overflowX: 'auto' }}>
          <Table highlightOnHover withColumnBorders>
            {children}
          </Table>
        </Box>
      )}
    </LtAppCard>
  )
}
