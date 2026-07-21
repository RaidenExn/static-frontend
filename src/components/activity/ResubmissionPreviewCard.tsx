import React from 'react'
import { Card, Group, Text } from '@mantine/core'
import { RefreshCw } from 'lucide-react'
import { RcmActivity } from '../../types'

interface ResubmissionPreviewCardProps {
  activityRows: RcmActivity[]
  rowActions: Record<number, 're-sub' | 'w-off' | 'close'>
  shortcodes?: Record<string, string | string[]>
}

export default function ResubmissionPreviewCard({
  activityRows,
  rowActions,
  shortcodes
}: ResubmissionPreviewCardProps) {
  const selectedCodes = activityRows
    .filter((row) => {
      const authId = Number(row.order_authorization_id)
      return authId && rowActions[authId] === 're-sub'
    })
    .map((row) => {
      const codeKey = (row.code || '').trim().toLowerCase()
      const mappedOptions = codeKey && shortcodes ? shortcodes[codeKey] : null
      let mapped = ''

      if (mappedOptions) {
        if (Array.isArray(mappedOptions)) {
          if (mappedOptions.length === 1) {
            mapped = mappedOptions[0]
          } else {
            const entryDesc = (row.order_name || '').toLowerCase()
            mapped =
              mappedOptions.find((opt) => {
                const optWords = opt.toLowerCase().split(/\s+/).filter(Boolean)
                return optWords.every((word) => entryDesc.includes(word))
              }) || mappedOptions[0]
          }
        } else if (typeof mappedOptions === 'string') {
          mapped = mappedOptions
        }
      }

      const fallback = row.order_name || row.code || ''
      return (mapped || fallback).trim().toLowerCase()
    })
    .filter((desc, index, self) => desc && self.indexOf(desc) === index)

  return (
    <Card withBorder radius="sm" padding="xs" bg="var(--panel-soft, rgba(255, 255, 255, 0.02))">
      <Group justify="space-between" align="center" gap="xs">
        <Group gap="xs" align="center">
          <RefreshCw style={{ width: 14, height: 14, color: 'var(--mantine-color-text)' }} />
          <Text
            size="xs"
            fw={800}
            tt="uppercase"
            style={{
              letterSpacing: '0.5px'
            }}
            c="var(--mantine-color-text)"
          >
            Selected for Resubmission
          </Text>
        </Group>

        <Group gap="xs" style={{ flex: 1, justifyContent: 'flex-end' }}>
          {selectedCodes.length > 0 ? (
            <Text size="xs" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedCodes.join(', ')}
            </Text>
          ) : (
            <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
              No items selected
            </Text>
          )}
        </Group>
      </Group>
    </Card>
  )
}
