import React, { useEffect, useRef } from 'react'
import { Card, Group, Text, Textarea, Button, Stack } from '@mantine/core'

interface WriteOffTabProps {
  loading?: boolean
  writeOffRemarks: string
  setWriteOffRemarks: (val: string) => void
  isSavingWriteOff: boolean
  onSaveWriteOff: () => void
  onClearWriteOff: () => void
  pendingWriteOff: number
}

export default function WriteOffTab({
  loading,
  writeOffRemarks,
  setWriteOffRemarks,
  isSavingWriteOff,
  onSaveWriteOff,
  onClearWriteOff,
  pendingWriteOff
}: WriteOffTabProps) {
  const writeOffRemarksRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = writeOffRemarksRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [writeOffRemarks])

  return (
    <Card
      withBorder
      radius="sm"
      padding="md"
      style={{
        backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
        backdropFilter: 'var(--backdrop-filter, blur(16px))',
        WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
        border: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
        opacity: pendingWriteOff > 0 ? 1 : 0.45,
        pointerEvents: pendingWriteOff > 0 ? 'auto' : 'none',
        filter: pendingWriteOff > 0 ? 'none' : 'grayscale(100%)',
        transition: 'all 0.2s ease'
      }}
    >
      <Group
        justify="space-between"
        align="center"
        style={{
          borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
          paddingBottom: '10px',
          marginBottom: '12px'
        }}
      >
        <Text size="sm" fw={800} tt="uppercase" style={{ letterSpacing: '0.5px' }} c="var(--mantine-color-text)">
          Write off remarks
        </Text>
      </Group>

      {loading ? (
        <Stack gap="sm">
          <div
            className="shimmer-text"
            style={{ width: '60px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}
          />
          <div
            className="shimmer-text"
            style={{ height: '40px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}
          />
          <Group justify="flex-end" gap="xs">
            <div
              className="shimmer-text"
              style={{ height: '36px', width: '60px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}
            />
            <div
              className="shimmer-text"
              style={{ height: '36px', width: '80px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}
            />
          </Group>
        </Stack>
      ) : (
        <Stack gap="sm">
          <Textarea
            ref={writeOffRemarksRef as any}
            minRows={2}
            autosize
            placeholder="Enter write-off remarks..."
            value={writeOffRemarks}
            onChange={(e) => setWriteOffRemarks(e.target.value)}
            styles={{
              input: {
                fontSize: 'var(--mantine-font-size-sm)',
                marginTop: '4px',
                backgroundColor: 'var(--panel-soft, rgba(0,0,0,0.02))'
              }
            }}
          />

          <Group gap="xs" justify="flex-end">
            <Button
              onClick={onClearWriteOff}
              variant="light"
              color="gray"
              disabled={isSavingWriteOff}
              style={{ height: '36px', fontSize: 'var(--mantine-font-size-sm)', padding: '0 16px' }}
            >
              Clear
            </Button>
            <Button
              onClick={onSaveWriteOff}
              disabled={isSavingWriteOff || pendingWriteOff <= 0}
              className="rcm-save-writeoff"
              color={pendingWriteOff > 0 ? 'orange' : undefined}
              style={{ height: '36px', fontSize: 'var(--mantine-font-size-sm)', padding: '0 48px' }}
            >
              {isSavingWriteOff ? 'Saving...' : 'Save'}
            </Button>
          </Group>
        </Stack>
      )}
    </Card>
  )
}
