import React from 'react'
import { TextInput, Select, Card, Title, Text, SimpleGrid } from '@mantine/core'

interface HospitalCredentialsSettingsProps {
  settings: any
  validationErrors: Record<string, any>
  employees: any[]
  updateNestedSetting: (keyPath: string[], value: any) => void
}

export function HospitalCredentialsSettings({
  settings,
  validationErrors,
  employees,
  updateNestedSetting
}: HospitalCredentialsSettingsProps) {
  const hasErrors = Object.keys(validationErrors).some((k) => k.startsWith('hospital.'))

  // Map employee options to Select data structure with robust deduplication
  const selectData = employees.reduce(
    (acc, emp) => {
      const valStr = emp.id.toString()
      if (!acc.some((existing: { value: string; label: string }) => existing.value === valStr)) {
        acc.push({
          value: valStr,
          label: `${emp.id} (${emp.name})`
        })
      }
      return acc
    },
    [] as { value: string; label: string }[]
  )

  const defaultUserIdValue = (settings.hospital.defaultUserId || 1089).toString()

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
        🏦 Hospital Credentials Hub
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <Select
            label="Default Operator Session"
            description="Active operator logged in for background clinical synchronizations"
            value={defaultUserIdValue}
            onChange={(val) => {
              if (val) {
                const idNum = parseInt(val, 10)
                const selectedEmp = employees.find((emp) => emp.id === idNum)
                updateNestedSetting(['hospital', 'defaultUserId'], idNum)
                if (selectedEmp) {
                  updateNestedSetting(['hospital', 'defaultUserName'], selectedEmp.name)
                }
              }
            }}
            data={selectData}
          />
        </div>

        <div>
          <TextInput
            label="Role ID"
            description="Used in downstream financial RCM integration payloads"
            value={settings.hospital.roleId}
            onChange={(e) => updateNestedSetting(['hospital', 'roleId'], e.target.value)}
            error={validationErrors['hospital.roleId']}
          />
        </div>

        <div>
          <TextInput
            label="Vendor ID"
            description="Assigned portal integrator channel code"
            value={settings.hospital.vendorId}
            onChange={(e) => updateNestedSetting(['hospital', 'vendorId'], e.target.value)}
            error={validationErrors['hospital.vendorId']}
          />
        </div>

        <div>
          <TextInput
            label="Insurance Mapping ID"
            description="Fallback default client insurer payload ID"
            value={settings.hospital.insuranceMappingId}
            onChange={(e) => updateNestedSetting(['hospital', 'insuranceMappingId'], e.target.value)}
            error={validationErrors['hospital.insuranceMappingId']}
          />
        </div>

        <div>
          <TextInput
            label="Fallback Receiver ID"
            description="If clinician code matches no local mapping keys"
            value={settings.hospital.receiverIdFallback}
            onChange={(e) => updateNestedSetting(['hospital', 'receiverIdFallback'], e.target.value)}
            error={validationErrors['hospital.receiverIdFallback']}
          />
        </div>

        {/* Sub-block for ICD creation payload defaults */}
        <Card
          withBorder
          padding="xs"
          radius="sm"
          bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
          style={{ borderColor: 'var(--line, rgba(255, 255, 255, 0.05))' }}
        >
          <Text
            size="11px"
            fw={700}
            style={{
              color: 'var(--mantine-color-text)',
              display: 'block',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            ICD Creation Payload Flags
          </Text>
          <SimpleGrid cols={2} spacing="xs">
            <TextInput
              label="isChronic"
              value={settings.hospital.icdDefaults.isChronic}
              onChange={(e) => updateNestedSetting(['hospital', 'icdDefaults', 'isChronic'], e.target.value)}
            />
            <TextInput
              label="isCoded"
              value={settings.hospital.icdDefaults.isCoded}
              onChange={(e) => updateNestedSetting(['hospital', 'icdDefaults', 'isCoded'], e.target.value)}
            />
            <TextInput
              label="isSymptom"
              value={settings.hospital.icdDefaults.isSymptom}
              onChange={(e) => updateNestedSetting(['hospital', 'icdDefaults', 'isSymptom'], e.target.value)}
            />
            <TextInput
              label="prodId"
              value={settings.hospital.icdDefaults.prodId}
              onChange={(e) => updateNestedSetting(['hospital', 'icdDefaults', 'prodId'], e.target.value)}
            />
          </SimpleGrid>
        </Card>
      </div>
    </Card>
  )
}
