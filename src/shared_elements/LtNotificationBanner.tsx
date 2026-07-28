import React from 'react'
import { Paper, Group, Text, ActionIcon, MantineColor } from '@mantine/core'
import { Info, AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react'

export type LtBannerType = 'info' | 'success' | 'warning' | 'error'

export interface LtNotificationBannerProps {
  type?: LtBannerType
  message: React.ReactNode
  icon?: React.ComponentType<{ size?: number }>
  dismissible?: boolean
  onDismiss?: () => void
  style?: React.CSSProperties
}

const BANNER_CONFIG: Record<
  LtBannerType,
  { icon: React.ComponentType<{ size?: number }>; color: MantineColor; bg: string }
> = {
  info: {
    icon: Info,
    color: 'blue',
    bg: 'var(--mantine-color-blue-light)'
  },
  success: {
    icon: CheckCircle,
    color: 'green',
    bg: 'var(--mantine-color-green-light)'
  },
  warning: {
    icon: AlertTriangle,
    color: 'yellow',
    bg: 'var(--mantine-color-yellow-light)'
  },
  error: {
    icon: AlertCircle,
    color: 'red',
    bg: 'var(--mantine-color-red-light)'
  }
}

export function LtNotificationBanner({
  type = 'info',
  message,
  icon: CustomIcon,
  dismissible = false,
  onDismiss,
  style
}: LtNotificationBannerProps) {
  const config = BANNER_CONFIG[type]
  const BannerIcon = CustomIcon ?? config.icon

  return (
    <Paper
      withBorder
      radius="sm"
      p="xs"
      bg={config.bg}
      style={{
        borderLeft: `3px solid var(--mantine-color-${config.color}-filled)`,
        transition: 'all 0.15s ease',
        ...style
      }}
    >
      <Group gap="xs" align="center" wrap="nowrap">
        <span style={{ flexShrink: 0, display: 'inline-flex', color: `var(--mantine-color-${config.color}-filled)` }}>
          <BannerIcon size={16} />
        </span>
        <Text size="xs" fw={500} style={{ flex: 1 }}>
          {message}
        </Text>
        {dismissible && onDismiss && (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={onDismiss}
            style={{ flexShrink: 0, border: 'none' }}
          >
            <X size={12} />
          </ActionIcon>
        )}
      </Group>
    </Paper>
  )
}
