import React from 'react'
import { Card, Text, Group, Box, SimpleGrid } from '@mantine/core'
import { Layers } from 'lucide-react'
import BulkXmlPanel from './BulkXmlPanel'
import BulkResubmissionPanel from './BulkResubmissionPanel'
import BulkRepeatTrackerExtraction from './BulkRepeatTrackerExtraction'
import BulkMnecExtraction from './BulkMnecExtraction'
import RaExcelPanel from './RaExcelPanel'
import BypassPanel from './BypassPanel'

interface BulkOperationsPanelProps {
  active: boolean
  showToast: (msg: string, type: 'ok' | 'error' | 'warning' | 'info' | 'loading') => void
  repeatTrackerLookbackYears: number
  setRepeatTrackerLookbackYears: (val: number) => void
  mnecLookbackYears: number
  setMnecLookbackYears: (val: number) => void
}

export default function BulkOperationsPanel({
  active,
  showToast,
  repeatTrackerLookbackYears,
  setRepeatTrackerLookbackYears,
  mnecLookbackYears,
  setMnecLookbackYears
}: BulkOperationsPanelProps) {
  if (!active) return null

  return (
    <Box>
      <Card withBorder mb="md" padding="md" style={{ background: 'var(--panel-soft, rgba(255, 255, 255, 0.02))' }}>
        <Group justify="space-between" align="center">
          <Box>
            <Group gap="xs" align="center" mb={4}>
              <Layers size={20} color="var(--mantine-color-blue-filled)" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Unified Bulk Operations Suite</h2>
            </Group>
            <Text size="xs" c="dimmed">
              Execute automated high-throughput clinical claims operations and bypass validations concurrently.
            </Text>
          </Box>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md" style={{ alignItems: 'start' }}>
        {/* Row 1 */}
        <BulkResubmissionPanel active={active} showToast={showToast as any} />
        <BulkXmlPanel active={active} showToast={showToast} />

        {/* Row 2 */}
        <BulkRepeatTrackerExtraction
          active={active}
          showToast={showToast}
          repeatTrackerLookbackYears={repeatTrackerLookbackYears}
          setRepeatTrackerLookbackYears={setRepeatTrackerLookbackYears}
        />
        <BulkMnecExtraction
          active={active}
          showToast={showToast}
          mnecLookbackYears={mnecLookbackYears}
          setMnecLookbackYears={setMnecLookbackYears}
        />

        {/* Row 3 */}
        <RaExcelPanel active={active} showToast={showToast} />
        <BypassPanel active={active} showToast={showToast} />
      </SimpleGrid>
    </Box>
  )
}
