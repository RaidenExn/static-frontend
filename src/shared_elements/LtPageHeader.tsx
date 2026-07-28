import React from 'react'
import { Group, Text, Title } from '@mantine/core'

export interface LtPageHeaderProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ComponentType<{ size?: number }>
  badge?: React.ReactNode
  actions?: React.ReactNode
  border?: boolean
  style?: React.CSSProperties
}

export function LtPageHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  border = true,
  style
}: LtPageHeaderProps) {
  return (
    <Group
      justify="space-between"
      align="center"
      wrap="nowrap"
      pb="sm"
      mb="sm"
      style={{
        borderBottom: border ? '1px solid var(--line)' : undefined,
        minHeight: 40,
        transition: 'all 0.15s ease',
        ...style
      }}
    >
      <Group gap={8} align="center" style={{ flexShrink: 1, minWidth: 0 }}>
        {Icon && <span style={{ opacity: 0.7, display: 'inline-flex' }}><Icon size={18} /></span>}
        <div style={{ minWidth: 0 }}>
          <Group gap={8} align="center" wrap="nowrap">
            {typeof title === 'string' ? (
              <Title order={4} style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {title}
              </Title>
            ) : (
              title
            )}
            {badge}
          </Group>
          {subtitle && (
            <Text size="xs" c="var(--muted)" style={{ marginTop: 1 }}>
              {subtitle}
            </Text>
          )}
        </div>
      </Group>
      {actions && (
        <Group gap="xs" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          {actions}
        </Group>
      )}
    </Group>
  )
}
