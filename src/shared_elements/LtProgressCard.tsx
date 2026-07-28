import React from 'react'
import { Paper, Group, Text, Progress, MantineColor, MantineSpacing } from '@mantine/core'

export interface LtProgressCardProps {
  label?: React.ReactNode
  value: number
  color?: MantineColor
  subtext?: React.ReactNode
  icon?: React.ComponentType<{ size?: number }>
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  padding?: MantineSpacing
  style?: React.CSSProperties
}

const SIZE_MAP = {
  sm: { bar: 'sm', value: 'xs', label: 'xs' } as const,
  md: { bar: 'md', value: 'sm', label: 'xs' } as const,
  lg: { bar: 'lg', value: 'sm', label: 'sm' } as const
}

export function LtProgressCard({
  label,
  value,
  color = 'cyan',
  subtext,
  icon: Icon,
  size = 'md',
  animated = true,
  padding = 'sm',
  style
}: LtProgressCardProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const tokens = SIZE_MAP[size]

  return (
    <Paper
      withBorder
      radius="sm"
      p={padding}
      bg="var(--mantine-color-body)"
      style={{
        transition: 'all 0.15s ease',
        ...style
      }}
    >
      <Group gap="xs" align="center" wrap="nowrap" mb={4}>
        {Icon && <span style={{ opacity: 0.5, display: 'inline-flex' }}><Icon size={14} /></span>}
        {label && (
          <Text size={tokens.label} fw={600} tt="uppercase" lts="0.02em" style={{ flex: 1 }}>
            {label}
          </Text>
        )}
        <Text size={tokens.value} fw={700} c={color}>
          {Math.round(clampedValue)}%
        </Text>
      </Group>
      <Progress
        value={clampedValue}
        color={color}
        size={tokens.bar}
        animated={animated}
        transitionDuration={300}
      />
      {subtext && (
        <Text size="xs" c="var(--muted)" mt={4}>
          {subtext}
        </Text>
      )}
    </Paper>
  )
}
