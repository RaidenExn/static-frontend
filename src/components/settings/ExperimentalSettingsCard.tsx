import React, { useEffect, useState, useCallback } from 'react'
import { Card, Group, Stack, Text, Title, Badge, Switch } from '@mantine/core'
import { FlaskConical } from 'lucide-react'
import { customFetch as fetch } from '../../config/backend'

export const ExperimentalSettingsCard: React.FC = () => {
  const [expEhrVerification, setExpEhrVerification] = useState<boolean>(true)
  const [savingExp, setSavingExp] = useState<boolean>(false)

  const fetchExperimentalSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/experimental-verification')
      if (res.ok) {
        const data = await res.json()
        setExpEhrVerification(data.experimentalEhrVerification !== false)
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    fetchExperimentalSettings()
  }, [fetchExperimentalSettings])

  const handleToggleExp = async (checked: boolean) => {
    setExpEhrVerification(checked)
    setSavingExp(true)
    try {
      await fetch('/api/settings/experimental-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentalEhrVerification: checked })
      })
    } catch (_) {
    } finally {
      setSavingExp(false)
    }
  }

  return (
    <Card
      withBorder
      radius="sm"
      padding="md"
      style={{
        background: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
        borderColor: 'var(--line, rgba(255, 255, 255, 0.1))',
        opacity: 0.55,
        pointerEvents: 'none'
      }}
    >
      <Title
        order={3}
        style={{
          fontSize: '12px',
          fontWeight: 800,
          color: 'var(--mantine-color-text)',
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        <FlaskConical size={16} color="var(--mantine-color-dimmed)" />
        Experimental Features
      </Title>

      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Stack gap={2} style={{ flex: 1 }}>
            <Group gap={6} align="center">
              <Text size="xs" fw={700} style={{ textTransform: 'uppercase' }} c="dimmed">
                Background EHR Verification (SHA Probe)
              </Text>
              <Badge size="xs" color="gray" variant="filled">
                DISABLED
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Background remote EHR verification probe is currently disabled to ensure maximum sub-millisecond local caching performance.
            </Text>
          </Stack>

          <Switch
            size="sm"
            color="teal"
            checked={false}
            disabled={true}
          />
        </Group>
      </Stack>
    </Card>
  )
}
