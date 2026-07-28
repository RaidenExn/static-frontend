import React from 'react'
import { Box, Group, Text, MantineColor } from '@mantine/core'

export interface LtTimelineItem {
  icon?: React.ComponentType<{ size?: number }>
  title?: React.ReactNode
  description?: React.ReactNode
  timestamp?: React.ReactNode
  color?: MantineColor
  active?: boolean
}

export interface LtTimelineProps {
  items: LtTimelineItem[]
  reverse?: boolean
  lineWidth?: number
  bulletSize?: number
}

export function LtTimeline({
  items,
  reverse = false,
  lineWidth = 2,
  bulletSize = 10
}: LtTimelineProps) {
  const sorted = reverse ? [...items].reverse() : items

  return (
    <Box>
      {sorted.map((item, idx) => {
        const isLast = idx === sorted.length - 1
        const Icon = item.icon
        const color = item.color ?? 'gray'

        return (
          <Group key={idx} gap="sm" align="flex-start" wrap="nowrap">
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
                width: bulletSize + 4
              }}
            >
              <Box
                style={{
                  width: bulletSize,
                  height: bulletSize,
                  borderRadius: '50%',
                  backgroundColor: item.active
                      ? `var(--mantine-color-${color}-filled)`
                    : 'var(--line)',
                    border: item.active
                      ? undefined
                      : `${lineWidth}px solid var(--line)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  ...(Icon
                    ? { width: 22, height: 22, backgroundColor: 'transparent', border: 'none' }
                    : undefined)
                }}
              >
                {Icon && <Icon size={12} />}
              </Box>
              {!isLast && (
                <Box
                  style={{
                    width: lineWidth,
                    flex: 1,
                    minHeight: 16,
                    backgroundColor: 'var(--line)',
                    marginTop: 2
                  }}
                />
              )}
            </Box>

            <Box style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 16 }}>
              <Group gap={6} align="center" wrap="nowrap">
                {item.title && (
                  <Text size="xs" fw={600} style={{ lineHeight: 1.4 }}>
                    {item.title}
                  </Text>
                )}
                {item.timestamp && (
                  <Text size="xs" c="var(--muted)" style={{ flexShrink: 0 }}>
                    {item.timestamp}
                  </Text>
                )}
              </Group>
              {item.description && (
                <Text size="xs" c="var(--muted)" mt={2} style={{ lineHeight: 1.4 }}>
                  {item.description}
                </Text>
              )}
            </Box>
          </Group>
        )
      })}
    </Box>
  )
}
