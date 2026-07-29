import React from 'react'
import { Card, Group, Text, ScrollArea, Loader, Stack, Box, MantineSpacing, MantineColor } from '@mantine/core'
import { LtChip } from './LtChip'

export interface LtAppCardProps {
  /** Card section title */
  title?: React.ReactNode
  /** Optional Lucide React icon component to display beside title */
  icon?: React.ComponentType<{ size?: number }>
  /** Optional badge or status element placed next to title */
  badge?: React.ReactNode
  /** Right-aligned action dock or control buttons */
  actions?: React.ReactNode
  /** Card content children */
  children?: React.ReactNode
  /** Built-in loading state overlay/spinner */
  loading?: boolean
  /** Loading text shown when loading is true */
  loadingText?: string
  /** Enable scrollable content area with auto scrollbars */
  scrollable?: boolean
  /** Minimum height constraint */
  minHeight?: number | string
  /** Maximum height constraint */
  maxHeight?: number | string
  /** Mantine padding token (default: 'xs') */
  padding?: MantineSpacing
  /** Theme variant (default: 'default') */
  variant?: 'default' | 'light'
  /** Theme color token when using light variant */
  color?: MantineColor
  /** Additional CSS style overrides */
  style?: React.CSSProperties
  /** Additional class name */
  className?: string
}

export function LtAppCard({
  title,
  icon: Icon,
  badge,
  actions,
  children,
  loading = false,
  loadingText,
  scrollable = false,
  minHeight,
  maxHeight,
  padding = 'xs',
  variant = 'default',
  color,
  style,
  className
}: LtAppCardProps) {
  const hasHeader = Boolean(title || Icon || badge || actions)

  const contentNode = (
    <Box style={{ flex: 1, position: 'relative' }}>
      {loading ? (
        <Stack align="center" justify="center" py="xl" style={{ minHeight: '180px' }}>
          <Loader color="orange" size="sm" type="dots" />
          {loadingText && (
            <Text size="xs" c="var(--muted)" fw={600} ta="center">
              {loadingText}
            </Text>
          )}
        </Stack>
      ) : (
        children
      )}
    </Box>
  )

  return (
    <Card
      withBorder
      radius="md"
      padding={padding}
      bg="var(--mantine-color-body)"
      variant={variant}
      color={color}
      mih={minHeight}
      mah={maxHeight}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.15s ease',
        ...style
      }}
    >
      {hasHeader && (
        <Group
          justify="space-between"
          align="center"
          bd="0 0 1px solid var(--line)"
          pb="xs"
          mb="xs"
          wrap="nowrap"
        >
          {/* Left: Icon, Title, and Badge */}
          <Group gap={6} align="center" style={{ flexShrink: 1, minWidth: 0 }}>
            {Icon && <Icon size={14} />}
            {typeof title === 'string' ? (
              <Text size="xs" fw={800} tt="uppercase" lts="0.5px" truncate>
                {title}
              </Text>
            ) : (
              title
            )}
            {typeof badge === 'string' || typeof badge === 'number' ? (
              <LtChip>
                {badge}
              </LtChip>
            ) : (
              badge
            )}
          </Group>

          {/* Right: Actions / Control Buttons */}
          {actions && (
            <Group gap="xs" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
              {actions}
            </Group>
          )}
        </Group>
      )}

      {/* Main Body: Scrollable or Static Container */}
      {scrollable ? (
        <ScrollArea style={{ flex: 1 }} type="auto">
          {contentNode}
        </ScrollArea>
      ) : (
        contentNode
      )}
    </Card>
  )
}
