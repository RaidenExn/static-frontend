import React from 'react'
import { Skeleton, Stack, Group, Paper } from '@mantine/core'

export type LtSkeletonVariant = 'card' | 'table' | 'text' | 'form'

export interface LtLoadingSkeletonProps {
  variant?: LtSkeletonVariant
  rows?: number
  height?: number | string
  width?: number | string
}

function TextRows({ rows = 3 }: { rows?: number }) {
  return (
    <Stack gap="xs">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === rows - 1 ? '60%' : '100%'}
          radius="md"
        />
      ))}
    </Stack>
  )
}

function TableRows({ rows = 5 }: { rows?: number }) {
  return (
    <Stack gap="xs">
      <Group gap="xs" grow>
        <Skeleton height={10} width="20%" radius="md" />
        <Skeleton height={10} width="30%" radius="md" />
        <Skeleton height={10} width="25%" radius="md" />
        <Skeleton height={10} width="15%" radius="md" />
      </Group>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={10} radius="md" />
      ))}
    </Stack>
  )
}

function FormRows({ rows = 4 }: { rows?: number }) {
  return (
    <Stack gap="md">
      {Array.from({ length: rows }).map((_, i) => (
        <Stack key={i} gap={4}>
          <Skeleton height={8} width="25%" radius="md" />
          <Skeleton height={28} radius="md" />
        </Stack>
      ))}
    </Stack>
  )
}

export function LtLoadingSkeleton({
  variant = 'text',
  rows,
  height,
  width
}: LtLoadingSkeletonProps) {
  const content = (() => {
    switch (variant) {
      case 'card':
        return (
          <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-body)">
            <Stack gap="sm">
              <Group gap="xs" align="center">
                <Skeleton height={14} width={14} radius="md" />
                <Skeleton height={10} width="40%" radius="md" />
              </Group>
              <Skeleton height={height ?? 80} radius="md" />
            </Stack>
          </Paper>
        )
      case 'table':
        return <TableRows rows={rows} />
      case 'form':
        return <FormRows rows={rows} />
      case 'text':
      default:
        return <TextRows rows={rows} />
    }
  })()

  return (
    <div style={{ width, height }}>
      {content}
    </div>
  )
}
