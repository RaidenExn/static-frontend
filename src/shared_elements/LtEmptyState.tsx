import React from 'react'
import { Stack, Text, Button, ButtonProps } from '@mantine/core'

export interface LtEmptyStateProps {
  icon?: React.ComponentType<{ size?: number }>
  title?: React.ReactNode
  description?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    icon?: React.ComponentType<{ size?: number }>
    color?: ButtonProps['color']
    variant?: ButtonProps['variant']
  }
  children?: React.ReactNode
}

export function LtEmptyState({
  icon: Icon,
  title,
  description,
  action,
  children
}: LtEmptyStateProps) {
  return (
    <Stack align="center" justify="center" py="xl" gap="xs" style={{ minHeight: 180, userSelect: 'none' }}>
      {Icon && (
        <Text c="var(--muted)" style={{ opacity: 0.4 }}>
          <Icon size={32} />
        </Text>
      )}
      {title && (
        <Text size="sm" fw={600} c="var(--muted)" ta="center">
          {title}
        </Text>
      )}
      {description && (
        <Text size="xs" c="var(--muted)" ta="center" maw={320}>
          {description}
        </Text>
      )}
      {action && (
        <Button
          size="xs"
          variant={action.variant ?? 'light'}
          color={action.color ?? 'gray'}
          onClick={action.onClick}
          leftSection={action.icon ? <action.icon size={12} /> : undefined}
          mt="xs"
        >
          {action.label}
        </Button>
      )}
      {children}
    </Stack>
  )
}
