import React, { useEffect, useRef } from 'react'
import { Card, Group, Text, Switch, Textarea, Button, Stack } from '@mantine/core'

interface RaRemarksTabProps {
  loading?: boolean
  canSaveRaRemarks: boolean
  grossResub: number
  grossWriteOff: number
  pendingResub: number
  pendingWriteOff: number
  raRemarks: string
  setRaRemarks: (val: string) => void
  autoCopyRaRemarks: boolean
  setAutoCopyRaRemarks: (val: boolean) => void
  isSavingRaRemarks: boolean
  onSaveRaRemarks: () => void
  onClearRaRemarks: () => void
  autoTransferToRaRemarks: boolean
  setAutoTransferToRaRemarks: (val: boolean) => void
  hasPreExistingRemarksOrComments: boolean
}

export default function RaRemarksTab({
  loading,
  canSaveRaRemarks,
  grossResub,
  grossWriteOff,
  pendingResub,
  pendingWriteOff,
  raRemarks,
  setRaRemarks,
  autoCopyRaRemarks,
  setAutoCopyRaRemarks,
  isSavingRaRemarks,
  onSaveRaRemarks,
  onClearRaRemarks,
  autoTransferToRaRemarks,
  setAutoTransferToRaRemarks,
  hasPreExistingRemarksOrComments
}: RaRemarksTabProps) {
  const raRemarksRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = raRemarksRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [raRemarks])

  return (
    <Card
      withBorder
      radius="sm"
      padding="md"
      style={{
        backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
        backdropFilter: 'var(--backdrop-filter, blur(16px))',
        WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
        border: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
      }}
    >
      <Group
        justify="space-between"
        align="center"
        style={{
          borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
          paddingBottom: '10px',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={800} tt="uppercase" style={{ letterSpacing: '0.5px' }} c="var(--mantine-color-text)">
            Write RA Remarks
          </Text>
          <Switch
            label="Auto Copy"
            size="xs"
            checked={autoCopyRaRemarks}
            onChange={(e) => setAutoCopyRaRemarks(e.target.checked)}
          />
          <Switch
            label={
              <Text
                size="sm"
                fw={600}
                style={{ color: 'var(--muted)', cursor: hasPreExistingRemarksOrComments ? 'not-allowed' : 'pointer' }}
              >
                Auto transfer
              </Text>
            }
            size="xs"
            checked={autoTransferToRaRemarks && !hasPreExistingRemarksOrComments}
            onChange={(e) => setAutoTransferToRaRemarks(e.target.checked)}
            disabled={hasPreExistingRemarksOrComments}
            title={
              hasPreExistingRemarksOrComments
                ? 'Bypassed because pre-existing saved remarks or comments exist on the server'
                : 'Automatically mirror comments to RA remarks'
            }
          />
        </Group>

        {loading ? (
          <div
            className="shimmer-text"
            style={{ width: '100px', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}
          />
        ) : (
          <Group
            gap={0}
            style={{
              border: '1px solid var(--line, rgba(255,255,255,0.05))',
              borderRadius: 'var(--mantine-radius-sm)',
              overflow: 'hidden',
              backgroundColor: 'var(--panel-soft, rgba(0,0,0,0.01))'
            }}
          >
            <div
              style={{
                padding: '4px 10px',
                borderRight: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
                fontSize: 'var(--mantine-font-size-xs)',
                color: 'var(--muted)'
              }}
            >
              Gross Re-sub: <strong style={{ color: 'var(--ink)' }}>{grossResub.toFixed(2)}</strong>
            </div>
            <div style={{ padding: '4px 10px', fontSize: 'var(--mantine-font-size-xs)', color: 'var(--muted)' }}>
              Gross W-off: <strong style={{ color: 'var(--ink)' }}>{grossWriteOff.toFixed(2)}</strong>
            </div>
          </Group>
        )}
      </Group>

      {loading ? (
        <Stack gap="sm">
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
            ref={raRemarksRef as any}
            minRows={2}
            autosize
            placeholder="Enter RA remarks..."
            value={raRemarks}
            onChange={(e) => setRaRemarks(e.target.value)}
            disabled={!canSaveRaRemarks}
            styles={{
              input: {
                fontSize: 'var(--mantine-font-size-sm)',
                marginTop: '4px',
                backgroundColor: 'var(--panel-soft, rgba(0,0,0,0.02))'
              }
            }}
          />

          <Group gap="xs" justify="space-between" align="center" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Group
              gap={0}
              style={{
                border: '1px solid var(--line, rgba(255,255,255,0.05))',
                borderRadius: 'var(--mantine-radius-sm)',
                overflow: 'hidden',
                backgroundColor: 'var(--panel-soft, rgba(0,0,0,0.01))'
              }}
            >
              <div
                style={{
                  padding: '4px 10px',
                  borderRight: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
                  fontSize: 'var(--mantine-font-size-xs)',
                  color: 'var(--muted)'
                }}
              >
                Pending Re-sub:{' '}
                <strong style={{ color: 'var(--good, #40c057)' }}>{pendingResub.toFixed(2)}</strong>
              </div>
              <div style={{ padding: '4px 10px', fontSize: 'var(--mantine-font-size-xs)', color: 'var(--muted)' }}>
                Pending W-off: <strong style={{ color: 'var(--badge-warning-text, #fd7e14)' }}>{pendingWriteOff.toFixed(2)}</strong>
              </div>
            </Group>

            <Group gap="xs">
              <Button
                onClick={onClearRaRemarks}
                variant="light"
                color="gray"
                disabled={isSavingRaRemarks || !canSaveRaRemarks}
                style={{ height: '36px', fontSize: 'var(--mantine-font-size-sm)', padding: '0 16px' }}
              >
                Clear
              </Button>
              <Button
                onClick={onSaveRaRemarks}
                disabled={isSavingRaRemarks || !canSaveRaRemarks}
                className="rcm-save-ra"
                style={{ height: '36px', fontSize: 'var(--mantine-font-size-sm)', padding: '0 48px' }}
              >
                {isSavingRaRemarks ? 'Saving...' : 'Save'}
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Card>
  )
}
