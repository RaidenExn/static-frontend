import React, { useState } from 'react'
import {
  Card,
  Text,
  Group,
  Stack,
  Box,
  Button,
  Title,
  SimpleGrid,
  Loader,
  SegmentedControl,
  Select,
  Switch,
  TextInput
} from '@mantine/core'
import { Settings, ShieldCheck, Database, Unlink, Activity } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { HospitalCredentialsSettings } from './settings/HospitalCredentialsSettings'
import { AdvancedPromptSettings } from './settings/AdvancedPromptSettings'
import { NetworkPerformanceSettings } from './settings/NetworkPerformanceSettings'
import { SystemUpdateSettings } from './settings/SystemUpdateSettings'
import ApiPanel from './ApiPanel'
import { setBackendUrl } from '../config/runtime'
import { validateBackendUrl } from '../config/backend'

function ConnectionSettingsCard({ showToast }: { showToast: any }) {
  const currentUrl = localStorage.getItem('lt-local-backend-url') || ''
  const [urlInput, setUrlInput] = useState(currentUrl)
  const [testing, setTesting] = useState(false)
  
  const handleUpdate = async () => {
    const val = urlInput.trim()
    if (!val) {
      showToast('Backend URL cannot be empty.', 'warning')
      return
    }
    if (!validateBackendUrl(val)) {
      showToast('Invalid URL format.', 'error')
      return
    }
    
    setTesting(true)
    try {
      const pingUrl = val.endsWith('/') ? `${val}lt-local/ping` : `${val}/lt-local/ping`
      const res = await fetch(pingUrl)
      if (res.ok) {
        const txt = await res.text()
        if (txt.trim() === 'LT_LOCAL_OK' || txt.includes('OK')) {
          setBackendUrl(val)
          showToast('Connection verified and updated successfully!', 'ok')
          setTimeout(() => {
            window.location.reload()
          }, 800)
          return
        }
      }
      showToast('Server responded but check failed.', 'error')
    } catch (err: any) {
      showToast(`Connection failed: ${err.message}`, 'error')
    } finally {
      setTesting(false)
    }
  }
  
  const handleDisconnect = () => {
    setBackendUrl(null)
    showToast('Disconnected from LT-Local backend. Redirecting to connection screen...', 'info')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <Card withBorder radius="sm" padding="md" bg="var(--panel-soft)">
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
        <Database size={14} color="var(--mantine-color-blue-filled)" />
        LT-Local Backend Connection
      </Title>
      <Stack gap="sm">
        <Text size="xs" c="dimmed">
          Your browser is currently linked to the following local EHR caching middleware.
        </Text>
        <TextInput
          label="Backend Address"
          placeholder="http://192.168.10.13:8788"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          disabled={testing}
          size="xs"
        />
        <Group justify="space-between" mt="xs">
          <Button
            size="xs"
            variant="outline"
            color="red"
            leftSection={<Unlink size={14} />}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
          <Button
            size="xs"
            loading={testing}
            leftSection={<Activity size={14} />}
            onClick={handleUpdate}
          >
            Update & Test
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}

interface SettingsPanelProps {
  active: boolean
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
  theme: string
  toggleTheme: () => void
  setTheme: (theme: string) => void
  onStopServer: () => void
  aiModel?: string
  setAiModel?: (model: string) => void
  primaryColor?: string
  setPrimaryColor?: (color: string) => void
  bgPalette?: string
  setBgPalette?: (palette: string) => void
  cornerRadius?: string
  setCornerRadius?: (radius: string) => void
  activeFont?: string
  setActiveFont?: (font: string) => void
  fontScale?: string
  setFontScale?: (scale: string) => void
  spacingScale?: string
  setSpacingScale?: (scale: string) => void
  visualStyle?: string
  setVisualStyle?: (style: string) => void
  adaptiveCardColors?: boolean
  setAdaptiveCardColors?: (val: boolean) => void
}

export default function SettingsPanel({
  active,
  showToast,
  theme,
  toggleTheme,
  setTheme,
  onStopServer,
  aiModel,
  setAiModel,
  primaryColor = 'dark',
  setPrimaryColor,
  bgPalette = 'charcoal',
  setBgPalette,
  cornerRadius = 'sm',
  setCornerRadius,
  activeFont = 'Inter',
  setActiveFont,
  fontScale = 'standard',
  setFontScale,
  spacingScale = 'xs',
  setSpacingScale,
  visualStyle = 'glassmorphic',
  setVisualStyle,
  adaptiveCardColors = true,
  setAdaptiveCardColors
}: SettingsPanelProps) {
  const {
    settings,
    loading,
    saving,
    fixingPermissions,
    wsStatus,
    permissionStatus,
    validationErrors,
    employees,
    updateNestedSetting,
    handleSave,
    handleResetDefaults,
    handleFixPermissions
  } = useSettings({ active, showToast })

  if (!active) return null

  if (loading || !settings) {
    return (
      <Stack align="center" justify="center" p={80} gap="md">
        <Loader size="lg" color="violet" />
        <Text size="sm" fw={600} c="dimmed">
          Syncing Portal Settings...
        </Text>
      </Stack>
    )
  }

  return (
    <Box>
      {/* Central Glassmorphic Header Control Card */}
      <Card withBorder mb="md" padding="md" style={{ background: 'var(--panel-soft, rgba(255, 255, 255, 0.02))' }}>
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Box>
            <Group gap="xs" align="center" mb={4}>
              <Settings size={20} color="var(--mantine-color-blue-filled)" />
              <Title
                order={2}
                size="h3"
                fw={800}
                style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                Control Center
              </Title>
            </Group>
            <Text size="xs" c="dimmed">
              Configure ICD payor default parameters, Level-1 demographic wrappers, Advanced Prompts, and third-party
              API gateway keys concurrently.
            </Text>
          </Box>
          <Group gap="xs">
            <Button
              variant="outline"
              color="gray"
              onClick={handleFixPermissions}
              disabled={fixingPermissions}
              size="xs"
              style={{ fontWeight: 600 }}
            >
              {fixingPermissions ? 'Checking...' : '🔒 Fix Permissions'}
            </Button>
            <Button variant="outline" color="gray" onClick={handleResetDefaults} size="xs" style={{ fontWeight: 600 }}>
              🔄 Reset Defaults
            </Button>
            <Button variant="filled" onClick={handleSave} disabled={saving} size="xs" style={{ fontWeight: 600 }}>
              {saving ? 'Saving...' : '💾 Save Configs'}
            </Button>
          </Group>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md" style={{ alignItems: 'start' }}>
        {/* Column 1 */}
        <Stack gap="md">
          <ConnectionSettingsCard showToast={showToast} />
          <HospitalCredentialsSettings
            settings={settings}
            validationErrors={validationErrors}
            employees={employees}
            updateNestedSetting={updateNestedSetting}
          />

          <NetworkPerformanceSettings
            settings={settings}
            validationErrors={validationErrors}
            updateNestedSetting={updateNestedSetting}
          />

          <SystemUpdateSettings showToast={showToast} />

          {/* Unified System & Browser Diagnostics Card */}
          <Card withBorder radius="sm" padding="md" bg="var(--panel-soft)">
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
              🔒 System & Browser Diagnostics
            </Title>
            <Stack gap="sm">
              <Group
                justify="space-between"
                align="center"
                p="sm"
                bg="var(--panel)"
                style={{ border: '1px solid var(--line)', borderRadius: 'var(--mantine-radius-sm)' }}
              >
                <Box>
                  <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Clipboard Reader
                  </Text>
                  <Text size="xs" c="dimmed">
                    Enables fast encounter parsing on paste
                  </Text>
                </Box>
                <Group gap="xs">
                  <ShieldCheck size={16} color="var(--mantine-color-green-filled)" />
                  <Text size="xs" fw="bold">
                    {permissionStatus.clipboard}
                  </Text>
                </Group>
              </Group>

              <Group
                justify="space-between"
                align="center"
                p="sm"
                bg="var(--panel)"
                style={{ border: '1px solid var(--line)', borderRadius: 'var(--mantine-radius-sm)' }}
              >
                <Box>
                  <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    System Notifications
                  </Text>
                  <Text size="xs" c="dimmed">
                    Enables background task completion alerts
                  </Text>
                </Box>
                <Group gap="xs">
                  <ShieldCheck size={16} color="var(--mantine-color-green-filled)" />
                  <Text size="xs" fw="bold">
                    {permissionStatus.notifications}
                  </Text>
                </Group>
              </Group>
            </Stack>
          </Card>
        </Stack>

        {/* Column 2 */}
        <Stack gap="md">
          <AdvancedPromptSettings
            wsStatus={wsStatus}
            theme={theme}
            toggleTheme={toggleTheme}
            setTheme={setTheme}
            onStopServer={onStopServer}
          />

          {/* 🎨 Real-Time Personalization Center */}
          <Card withBorder radius="sm" padding="md" bg="var(--panel-soft)">
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
              🎨 Real-Time Personalization Center
            </Title>
            <Stack gap="md">
              <SimpleGrid cols={2} spacing="xs">
                {/* Accent Color Palette */}
                <Box>
                  <Text
                    size="xs"
                    fw={700}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}
                  >
                    Accent Palette
                  </Text>
                  <Select
                    size="xs"
                    value={primaryColor}
                    onChange={(val) => setPrimaryColor?.(val || 'dark')}
                    data={[
                      { value: 'dark', label: 'Monochrome (Dark)' },
                      { value: 'violet', label: 'Sleek Violet' },
                      { value: 'teal', label: 'Clinical Teal' },
                      { value: 'blue', label: 'Professional Blue' },
                      { value: 'orange', label: 'Energetic Orange' },
                      { value: 'green', label: 'Organic Green' }
                    ]}
                  />
                </Box>

                {/* Background Tone Palette */}
                <Box>
                  <Text
                    size="xs"
                    fw={700}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}
                  >
                    Background Tone
                  </Text>
                  <Select
                    size="xs"
                    value={bgPalette}
                    onChange={(val) => setBgPalette?.(val || 'charcoal')}
                    data={[
                      { value: 'charcoal', label: 'Classic Charcoal' },
                      { value: 'slate', label: 'Slate Steel' },
                      { value: 'warm', label: 'Warm Amber' },
                      { value: 'forest', label: 'Cool Pine' }
                    ]}
                  />
                </Box>
              </SimpleGrid>

              <SimpleGrid cols={2} spacing="xs">
                {/* Corner Radius Scale */}
                <Box>
                  <Text
                    size="xs"
                    fw={700}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}
                  >
                    Corner Radius
                  </Text>
                  <SegmentedControl
                    size="xs"
                    fullWidth
                    value={cornerRadius}
                    onChange={(val) => setCornerRadius?.(val)}
                    data={[
                      { value: 'xs', label: 'Sharp' },
                      { value: 'sm', label: 'Normal' },
                      { value: 'md', label: 'Modern' },
                      { value: 'lg', label: 'Curved' },
                      { value: 'xl', label: 'Round' }
                    ]}
                  />
                </Box>

                {/* Spacing & Margins scale */}
                <Box>
                  <Text
                    size="xs"
                    fw={700}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}
                  >
                    Spacing & Margins
                  </Text>
                  <SegmentedControl
                    size="xs"
                    fullWidth
                    value={spacingScale}
                    onChange={(val) => setSpacingScale?.(val)}
                    data={[
                      { value: 'xs', label: 'XS' },
                      { value: 'sm', label: 'SM' },
                      { value: 'md', label: 'MD' },
                      { value: 'lg', label: 'LG' },
                      { value: 'xl', label: 'XL' }
                    ]}
                  />
                </Box>
              </SimpleGrid>

              <SimpleGrid cols={2} spacing="xs">
                {/* Font Typography */}
                <Box>
                  <Text
                    size="xs"
                    fw={700}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}
                  >
                    Typography Family
                  </Text>
                  <Select
                    size="xs"
                    value={activeFont}
                    onChange={(val) => setActiveFont?.(val || 'Inter')}
                    data={[
                      { value: 'Inter', label: 'Inter UI' },
                      { value: 'Outfit', label: 'Outfit (Premium)' },
                      { value: 'Roboto', label: 'Roboto (Clinical)' },
                      { value: 'JetBrains Mono', label: 'JetBrains Mono' }
                    ]}
                  />
                </Box>

                {/* Font Size Scale */}
                <Box>
                  <Text
                    size="xs"
                    fw={700}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}
                  >
                    Font Size Scale
                  </Text>
                  <SegmentedControl
                    size="xs"
                    fullWidth
                    value={fontScale}
                    onChange={(val) => setFontScale?.(val)}
                    data={[
                      { value: 'compact', label: 'Compact' },
                      { value: 'standard', label: 'Standard' },
                      { value: 'comfortable', label: 'Medium' },
                      { value: 'large', label: 'Large' }
                    ]}
                  />
                </Box>
              </SimpleGrid>

              <SimpleGrid cols={2} spacing="xs">
                {/* Visual Style Overlay */}
                <Box>
                  <Text
                    size="xs"
                    fw={700}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}
                  >
                    Visual Style Overlay
                  </Text>
                  <SegmentedControl
                    size="xs"
                    fullWidth
                    value={visualStyle}
                    onChange={(val) => setVisualStyle?.(val)}
                    data={[
                      { value: 'glassmorphic', label: 'Glass' },
                      { value: 'flat', label: 'Flat' }
                    ]}
                  />
                </Box>

                {/* Adaptive Card Backgrounds Switch */}
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height: '100%',
                    paddingTop: '16px'
                  }}
                >
                  <Switch
                    label="Adaptive Card Backgrounds"
                    description="Colors cards based on submission state"
                    checked={adaptiveCardColors}
                    onChange={(event) => setAdaptiveCardColors?.(event.currentTarget.checked)}
                    size="xs"
                  />
                </Box>
              </SimpleGrid>
            </Stack>
          </Card>

          <ApiPanel showToast={showToast as any} aiModel={aiModel} setAiModel={setAiModel} />
        </Stack>
      </SimpleGrid>
    </Box>
  )
}
