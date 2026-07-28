import React from 'react'
import { Box, Button, Badge, Group } from '@mantine/core'
import { LtAppCard } from './LtAppCard'

export interface LtFormSectionCardProps {
  title?: React.ReactNode
  icon?: React.ComponentType<{ size?: number }>
  isDirty?: boolean
  dirtyText?: string
  onSubmit?: (e: React.FormEvent) => void
  submitText?: string
  submitIcon?: React.ComponentType<{ size?: number }>
  submitColor?: string
  submitDisabled?: boolean
  loading?: boolean
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function LtFormSectionCard({
  title,
  icon,
  isDirty = false,
  dirtyText = 'Unsaved Changes',
  onSubmit,
  submitText,
  submitIcon: SubmitIcon,
  submitColor = 'cyan',
  submitDisabled = false,
  loading = false,
  actions,
  children
}: LtFormSectionCardProps) {
  const badgeNode = isDirty ? (
    <Badge color="orange" size="xs" variant="light">
      {dirtyText}
    </Badge>
  ) : undefined

  return (
    <LtAppCard title={title} icon={icon} badge={badgeNode} actions={actions}>
      <Box component="form" onSubmit={onSubmit}>
        {children}

        {submitText && (
          <Group justify="flex-end" mt="xs">
            <Button
              type="submit"
              size="xs"
              color={submitColor}
              variant="filled"
              loading={loading}
              disabled={submitDisabled}
              leftSection={SubmitIcon ? <SubmitIcon size={12} /> : undefined}
            >
              {submitText}
            </Button>
          </Group>
        )}
      </Box>
    </LtAppCard>
  )
}
