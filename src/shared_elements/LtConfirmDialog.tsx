import React from 'react'
import { Modal, Text, Group, Button, Stack, MantineColor } from '@mantine/core'

export interface LtConfirmDialogProps {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  title?: React.ReactNode
  message?: React.ReactNode
  confirmLabel?: string
  confirmColor?: MantineColor
  cancelLabel?: string
  loading?: boolean
  children?: React.ReactNode
}

export function LtConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  confirmColor = 'red',
  cancelLabel = 'Cancel',
  loading = false,
  children
}: LtConfirmDialogProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="sm" fw={800} tt="uppercase" lts="0.5px">
          {title}
        </Text>
      }
      size="sm"
      padding="lg"
    >
      <Stack gap="md">
        {message && (
          <Text size="sm" c="var(--muted)">
            {message}
          </Text>
        )}
        {children}
        <Group justify="flex-end" gap="xs">
          <Button size="xs" variant="subtle" color="gray" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button size="xs" color={confirmColor} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
