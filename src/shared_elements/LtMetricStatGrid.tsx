import React from 'react'
import { Card, Text, SimpleGrid, MantineColor } from '@mantine/core'

export interface LtMetricStatItem {
  label: string
  value: React.ReactNode
  color?: MantineColor
  subtext?: string
}

export interface LtMetricStatGridProps {
  stats: LtMetricStatItem[]
  cols?: number | { base?: number; sm?: number; md?: number; lg?: number }
  spacing?: string | number
}

export function LtMetricStatGrid({ stats, cols = { base: 2, sm: 4 }, spacing = 'xs' }: LtMetricStatGridProps) {
  return (
    <SimpleGrid cols={cols} spacing={spacing}>
      {stats.map((stat, idx) => (
        <Card key={idx} withBorder padding="xs" radius="md" ta="center" bg="var(--mantine-color-body)">
          <Text size="md" fw={800} c={stat.color}>
            {stat.value}
          </Text>
          <Text size="9px" c="var(--muted)" tt="uppercase" fw={600}>
            {stat.label}
          </Text>
          {stat.subtext && (
            <Text size="9px" c="var(--muted)" mt={2}>
              {stat.subtext}
            </Text>
          )}
        </Card>
      ))}
    </SimpleGrid>
  )
}
