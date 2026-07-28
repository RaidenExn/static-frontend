import React from 'react'
import { Select, Card, Title } from '@mantine/core'
import { UserCheck } from 'lucide-react'

interface HospitalCredentialsSettingsProps {
  settings: any
  validationErrors: Record<string, any>
  employees: any[]
  updateNestedSetting: (_keyPath: string[], value: any) => void
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

  const defaultUserIdValue = (settings?.hospital?.defaultUserId || 1089).toString()

  return (
    <Card
      withBorder
      radius="sm"
      padding="md"
      bg="var(--panel-soft)"
      style={{
        border: hasErrors
          ? '1.5px solid var(--mantine-color-red-filled)'
          : '1px solid var(--line, rgba(255, 255, 255, 0.05))',
        backgroundColor: 'var(--panel, rgba(255, 255, 255, 0.03))',
        borderRadius: 'var(--mantine-radius-sm)'
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
        <UserCheck size={14} color="var(--mantine-color-blue-filled)" />
        Default Operator Session
      </Title>

      <Select
        label="Active Operator Logged-In Account"
        description="Active clinician/operator account associated with background clinical operations and EHR sync"
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
        searchable
        size="sm"
      />
    </Card>
  )
}
