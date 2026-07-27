import React from 'react'
import { Card, Text, Group, Box, SimpleGrid } from '@mantine/core'
import { Layers } from 'lucide-react'
import BulkXmlPanel from './BulkXmlPanel'
import BulkResubmissionPanel from './BulkResubmissionPanel'
import BulkExtractionPanel from './BulkExtractionPanel'
import RaExcelPanel from './RaExcelPanel'
import BypassPanel from './BypassPanel'

interface BulkOperationsPanelProps {
  active: boolean
  showToast: (_msg: string, type: 'ok' | 'error' | 'warning' | 'info' | 'loading') => void
  repeatTrackerLookbackYears: number
  setRepeatTrackerLookbackYears: (_val: number) => void
  mnecLookbackYears: number
  setMnecLookbackYears: (_val: number) => void
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
        <BulkExtractionPanel
          active={active}
          showToast={showToast}
          type="repeatTracker"
          lookbackYears={repeatTrackerLookbackYears}
          setLookbackYears={setRepeatTrackerLookbackYears}
        />
        <BulkExtractionPanel
          active={active}
          showToast={showToast}
          type="mnec"
          lookbackYears={mnecLookbackYears}
          setLookbackYears={setMnecLookbackYears}
        />

        {/* Row 3 */}
        <RaExcelPanel active={active} showToast={showToast} />
        <BypassPanel active={active} showToast={showToast} />
      </SimpleGrid>
    </Box>
  )
}
