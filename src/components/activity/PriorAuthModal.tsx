import React from 'react'
import { Modal, TextInput, Button, Group, Stack, Text } from '@mantine/core'

interface PriorAuthModalProps {
  editingAuthId: number | null
  onClose: () => void
  tempAuthCode: string
  setTempAuthCode: (val: string) => void
  tempAuthStartDate: string
  setTempAuthStartDate: (val: string) => void
  tempAuthExpiryDate: string
  setTempAuthExpiryDate: (val: string) => void
  isSavingAuth: boolean
  handleSavePriorAuth: (authId: number, code: string, startDate?: string, expiryDate?: string) => void
  formatToDisplayDatetime: (str: string) => string
}

export default function PriorAuthModal({
  editingAuthId,
  onClose,
  tempAuthCode,
  setTempAuthCode,
  tempAuthStartDate,
  setTempAuthStartDate,
  tempAuthExpiryDate,
  setTempAuthExpiryDate,
  isSavingAuth,
  handleSavePriorAuth,
  formatToDisplayDatetime
}: PriorAuthModalProps) {
  return (
    <Modal
      opened={editingAuthId !== null}
      onClose={onClose}
      title={
        <Text size="sm" fw={700} c="var(--ink)">
          Edit Prior Authorization
        </Text>
      }
      size="380px"
    >
      <Stack gap="md">
        {/* Prior Auth Code Input */}
        <TextInput
          label="Authorization Code"
          placeholder="Enter Authorization Code"
          size="xs"
          value={tempAuthCode}
          onChange={(e) => setTempAuthCode(e.target.value)}
        />

        {/* Start Date & Time */}
        <TextInput
          label="Authorization Start Date"
          type="datetime-local"
          size="xs"
          value={tempAuthStartDate}
          onChange={(e) => setTempAuthStartDate(e.target.value)}
          styles={{ input: { colorScheme: 'dark' } }}
        />

        {/* Expiry Date & Time */}
        <TextInput
          label="Authorization Expiry Date"
          type="datetime-local"
          size="xs"
          value={tempAuthExpiryDate}
          onChange={(e) => setTempAuthExpiryDate(e.target.value)}
          styles={{ input: { colorScheme: 'dark' } }}
        />

        {/* Form Actions */}
        <Group gap="xs" justify="flex-end" mt="xs" pt="xs" style={{ borderTop: '1px solid var(--line)' }}>
          <Button type="button" size="xs" variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="xs"
            disabled={isSavingAuth}
            onClick={() =>
              editingAuthId !== null &&
              handleSavePriorAuth(
                editingAuthId,
                tempAuthCode,
                formatToDisplayDatetime(tempAuthStartDate),
                formatToDisplayDatetime(tempAuthExpiryDate)
              )
            }
          >
            {isSavingAuth ? 'Saving...' : 'Save Changes'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
