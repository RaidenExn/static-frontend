import React from 'react'
import { Paper, Group, Text, Divider, Box, MantineSpacing } from '@mantine/core'

export interface LtInfoCardItem {
  label?: string
  value: React.ReactNode
  color?: string
}

export interface LtInfoCardProps {
  /** Key-value items to render in horizontal flow separated by dividers */
  items?: LtInfoCardItem[]
  /** Custom children node (overrides items if provided) */
  children?: React.ReactNode
  /** Right-aligned control actions dock */
  actions?: React.ReactNode
  /** Card height token (default: 38) */
  height?: number | string
  /** Padding token (default: 'xs') */
  padding?: MantineSpacing
  /** Render vertical dividers between items (default: true) */
  withDividers?: boolean
  /** Additional CSS style overrides */
  style?: React.CSSProperties
  /** Additional class name */
  className?: string
}

export function LtInfoCard({
  items,
  children,
  actions,
  height = 38,
  padding = 'xs',
  withDividers = true,
  style,
  className
}: LtInfoCardProps) {
  return (
    <Paper
      withBorder
      radius="sm"
      px={padding}
      h={height}
      bg="transparent"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        ...style
      }}
    >
      <Group gap="xs" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        {children ? (
          children
        ) : (
          items?.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && withDividers && <Divider orientation="vertical" h={14} opacity={0.5} />}
              <Text size="xs" fw={400} style={{ whiteSpace: 'nowrap' }}>
                {item.label && (
                  <Text component="span" c="var(--muted)" mr={4}>
                    {item.label}:
                  </Text>
                )}
                {typeof item.value === 'string' || typeof item.value === 'number' ? (
                  <Text component="span" fw={600} c={item.color}>
                    {item.value}
                  </Text>
                ) : (
                  item.value
                )}
              </Text>
            </React.Fragment>
          ))
        )}
      </Group>

      {actions && (
        <Box style={{ flexShrink: 0 }} pl="xs">
          <Group gap="xs" align="center" wrap="nowrap">
            {actions}
          </Group>
        </Box>
      )}
    </Paper>
  )
}
