import React from 'react'
import { Group, Text, Button, CloseButton } from '@mantine/core'

export interface LtFilterChip {
  key: string
  label: string
  onRemove?: () => void
}

export interface LtFilterChipsProps {
  filters: LtFilterChip[]
  onClearAll?: () => void
  label?: string
}

export function LtFilterChips({
  filters,
  onClearAll,
  label
}: LtFilterChipsProps) {
  if (!filters.length) return null

  return (
    <Group gap={4} align="center" wrap="wrap">
      {label && (
        <Text size="xs" c="var(--muted)" fw={600} tt="uppercase" lts="0.02em" mr={2}>
          {label}:
        </Text>
      )}
      {filters.map((filter) => (
        <Group
          key={filter.key}
          gap={2}
          align="center"
          wrap="nowrap"
          style={{
            backgroundColor: 'var(--panel-soft)',
            borderRadius: 'var(--mantine-radius-md)',
            padding: '2px 4px 2px 8px',
            fontSize: 'var(--mantine-font-size-xs)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            transition: 'all 0.15s ease'
          }}
        >
          <Text size="xs" fw={600}>
            {filter.label}
          </Text>
          <CloseButton
            size="xs"
            variant="subtle"
            onClick={filter.onRemove}
            style={{ minWidth: 14, minHeight: 14 }}
          />
        </Group>
      ))}
      {onClearAll && filters.length > 1 && (
        <Button size="compact-xs" variant="subtle" color="gray" onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </Group>
  )
}
