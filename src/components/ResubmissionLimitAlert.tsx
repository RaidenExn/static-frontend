import React from 'react'
import { Alert } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'

interface ResubmissionLimitAlertProps {
  limitExceeded: boolean
  limitWarning: string
  resubmissionCount: number
  resubmissionRateCard: number
}

export default function ResubmissionLimitAlert({
  limitExceeded,
  limitWarning,
  resubmissionCount,
  resubmissionRateCard
}: ResubmissionLimitAlertProps) {
  if (!limitExceeded) return null

  return (
    <Alert
      variant="light"
      color="yellow"
      title={limitWarning}
      icon={<AlertTriangle size={14} />}
      radius="default"
      styles={{
        root: {
          margin: 'var(--mantine-spacing-md) var(--mantine-spacing-md) 0 var(--mantine-spacing-md)',
          padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-md)'
        },
        title: {
          fontSize: 'var(--mantine-font-size-xs)',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        },
        message: {
          fontSize: 'var(--mantine-font-size-xs)',
          fontWeight: 500
        }
      }}
    >
      This claim has been resubmitted {resubmissionCount} times. The rate card limit is {resubmissionRateCard}.
    </Alert>
  )
}
