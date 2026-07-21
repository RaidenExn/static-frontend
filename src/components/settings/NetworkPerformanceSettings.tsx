import React from 'react'
import { TextInput, Card, Title, SimpleGrid } from '@mantine/core'

interface NetworkPerformanceSettingsProps {
  settings: any
  validationErrors: Record<string, any>
  updateNestedSetting: (keyPath: string[], value: any) => void
}

export function NetworkPerformanceSettings({
  settings,
  validationErrors,
  updateNestedSetting
}: NetworkPerformanceSettingsProps) {
  const hasErrors = Object.keys(validationErrors).some(
    (k) =>
      k.startsWith('hospital.') &&
      !['roleId', 'vendorId', 'insuranceMappingId', 'receiverIdFallback', 'defaultUserId'].includes(k.split('.')[1])
  )

  return (
    <Card
      withBorder
      radius="sm"
      padding="sm"
      bg="var(--mantine-color-body)"
      style={{
        border: hasErrors
          ? '1.5px solid var(--mantine-color-red-filled)'
          : '1px solid var(--line, rgba(255, 255, 255, 0.05))',
        transition: 'all 0.3s ease'
      }}
    >
      <Title
        order={3}
        style={{
          fontSize: '12px',
          fontWeight: 800,
          color: 'var(--mantine-color-text)',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        🌐 Network & Performance Parameters
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <TextInput
            label="Pulse / SCMS Backend URL"
            value={settings.hospital.downloadUrl || ''}
            onChange={(e) => updateNestedSetting(['hospital', 'downloadUrl'], e.target.value)}
            error={validationErrors['hospital.downloadUrl']}
          />
        </div>

        <div>
          <TextInput
            label="Hospital Downstream Services URL"
            value={settings.hospital.hospitalUrl || ''}
            onChange={(e) => updateNestedSetting(['hospital', 'hospitalUrl'], e.target.value)}
            error={validationErrors['hospital.hospitalUrl']}
          />
        </div>

        <SimpleGrid cols={2} spacing="xs">
          <TextInput
            label="Customer ID"
            value={settings.hospital.customerId !== undefined ? settings.hospital.customerId : ''}
            onChange={(e) => updateNestedSetting(['hospital', 'customerId'], e.target.value)}
            error={validationErrors['hospital.customerId']}
          />

          <TextInput
            label="Site IDs (comma-separated)"
            value={
              Array.isArray(settings.hospital.siteIds)
                ? settings.hospital.siteIds.join(', ')
                : settings.hospital.siteIds || ''
            }
            onChange={(e) => updateNestedSetting(['hospital', 'siteIds'], e.target.value)}
            error={validationErrors['hospital.siteIds']}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} spacing="xs">
          <TextInput
            label="Search Window (Months)"
            value={settings.hospital.searchMonths !== undefined ? settings.hospital.searchMonths : ''}
            onChange={(e) => updateNestedSetting(['hospital', 'searchMonths'], e.target.value)}
            error={validationErrors['hospital.searchMonths']}
          />

          <TextInput
            label="Results Window (Months)"
            value={settings.hospital.resultMonths !== undefined ? settings.hospital.resultMonths : ''}
            onChange={(e) => updateNestedSetting(['hospital', 'resultMonths'], e.target.value)}
            error={validationErrors['hospital.resultMonths']}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} spacing="xs">
          <TextInput
            label="Cache TTL duration (ms)"
            value={settings.hospital.cacheTtlMs !== undefined ? settings.hospital.cacheTtlMs : ''}
            onChange={(e) => updateNestedSetting(['hospital', 'cacheTtlMs'], e.target.value)}
            error={validationErrors['hospital.cacheTtlMs']}
          />

          <TextInput
            label="Remote Timeout (ms)"
            value={settings.hospital.remoteTimeoutMs !== undefined ? settings.hospital.remoteTimeoutMs : ''}
            onChange={(e) => updateNestedSetting(['hospital', 'remoteTimeoutMs'], e.target.value)}
            error={validationErrors['hospital.remoteTimeoutMs']}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} spacing="xs">
          <TextInput
            label="Batch Concurrency Limit"
            value={
              settings.hospital.batchEncounterConcurrency !== undefined
                ? settings.hospital.batchEncounterConcurrency
                : ''
            }
            onChange={(e) => updateNestedSetting(['hospital', 'batchEncounterConcurrency'], e.target.value)}
            error={validationErrors['hospital.batchEncounterConcurrency']}
          />

          <TextInput
            label="Upstream Queue Limit"
            value={settings.hospital.upstreamConcurrency !== undefined ? settings.hospital.upstreamConcurrency : ''}
            onChange={(e) => updateNestedSetting(['hospital', 'upstreamConcurrency'], e.target.value)}
            error={validationErrors['hospital.upstreamConcurrency']}
          />
        </SimpleGrid>

        <div>
          <TextInput
            label="Document Types (comma-separated)"
            value={
              Array.isArray(settings.hospital.patientFileTypes)
                ? settings.hospital.patientFileTypes.join(', ')
                : settings.hospital.patientFileTypes || ''
            }
            onChange={(e) => updateNestedSetting(['hospital', 'patientFileTypes'], e.target.value)}
            error={validationErrors['hospital.patientFileTypes']}
          />
        </div>
      </div>
    </Card>
  )
}
