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
  TextInput,
  Grid,
  NavLink,
  Paper
} from '@mantine/core'
import {
  Settings,
  Database,
  Unlink,
  Activity,
  UserCheck,
  Palette,
  Zap,
  Bot
} from 'lucide-react'

import { useSettings } from '../hooks/useSettings'
import { HospitalCredentialsSettings } from './settings/HospitalCredentialsSettings'
import { ShortcodesSettings } from './settings/ShortcodesSettings'
import ApiPanel from './ApiPanel'
import { setBackendUrl } from '../config/runtime'
import { normalizeIpToBackendUrl, extractIpFromBackendUrl, validateIpOrHost } from '../config/backend'
import NetworkDiscoveryCard from './NetworkDiscoveryCard'

type SettingsCategory = 'connection' | 'session' | 'theme' | 'shortcodes' | 'ai'

function ConnectionSettingsCard({ showToast }: { showToast: any }) {
  const currentUrl = localStorage.getItem('lt-local-backend-url') || ''
  const [ipInput, setIpInput] = useState(extractIpFromBackendUrl(currentUrl) || 'localhost')
  const [testing, setTesting] = useState(false)

  const handleUpdate = async (rawIp?: string) => {
    const targetIp = (rawIp || ipInput).trim()
    if (!targetIp) {
      showToast('Server IP address cannot be empty.', 'warning')
      return
    }
    if (!validateIpOrHost(targetIp)) {
      showToast('Invalid IP address or hostname format.', 'error')
      return
    }

    const val = normalizeIpToBackendUrl(targetIp)
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
    <Card
      withBorder
      radius="sm"
      padding="md"
      bg="var(--panel-soft)"
      className="glass-panel"
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
        <Database size={14} color="var(--mantine-color-blue-filled)" />
        LT-Local Backend Connection
      </Title>
      <Stack gap="sm">
        <Text size="xs" c="dimmed">
          Your browser is currently linked to the following local EHR caching middleware instance.
        </Text>
        <TextInput
          label="Backend Server IP Address"
          placeholder="192.168.10.13"
          value={ipInput}
          onChange={(e) => setIpInput(e.target.value)}
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
            onClick={() => handleUpdate()}
          >
            Update & Test
          </Button>
        </Group>

        <Box mt="xs">
          <NetworkDiscoveryCard
            onSelectServer={(selectedIp) => {
              setIpInput(selectedIp)
              handleUpdate(selectedIp)
            }}
            compact
          />
        </Box>
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
  setTheme,
  aiModel,
  setAiModel,
  cornerRadius = 'sm',
  setCornerRadius,
  activeFont = 'Inter',
  setActiveFont,
  fontScale = 'standard',
  setFontScale,
  spacingScale = 'xs',
  setSpacingScale,
  adaptiveCardColors = true,
  setAdaptiveCardColors
}: SettingsPanelProps) {
  const {
    settings,
    loading,
    saving,
    wsStatus,
    validationErrors,
    employees,
    updateNestedSetting,
    handleSave,
    handleResetDefaults
  } = useSettings({ active, showToast })

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('connection')

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

  const categories = [
    { key: 'connection', label: 'Connection & Server', icon: Database, description: 'Middleware IP & Discovery' },
    { key: 'session', label: 'Operator Session', icon: UserCheck, description: 'Active Clinician Account' },
    { key: 'theme', label: 'Theme & Appearance', icon: Palette, description: 'Typography & Layout Rules' },
    { key: 'shortcodes', label: 'Shortcodes & Snippets', icon: Zap, description: 'Custom Expansion Rules' },
    { key: 'ai', label: 'AI & Compactor Services', icon: Bot, description: 'OpenRouter & iLovePDF Engine' }
  ]

  return (
    <Box>
      {/* Control Center Header */}
      <Card
        withBorder
        mb="md"
        padding="md"
        bg="var(--panel-soft)"
        className="glass-panel"
      >
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
              Configure local connection endpoints, active clinician sessions, personal themes, and AI compression integrations.
            </Text>
          </Box>
          <Group gap="xs">
            <Button
              variant="outline"
              color="gray"
              onClick={handleResetDefaults}
              size="xs"
              style={{ fontWeight: 600 }}
            >
              🔄 Reset Defaults
            </Button>
            <Button variant="filled" onClick={handleSave} disabled={saving} size="xs" style={{ fontWeight: 600 }}>
              {saving ? 'Saving...' : '💾 Save Configs'}
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Lite Dual-Pane Layout */}
      <Grid>
        {/* Left Navigation Sidebar */}
        <Grid.Col span={{ base: 12, md: 3.5 }}>
          <Paper
            withBorder
            p="xs"
            radius="sm"
            bg="var(--panel-soft)"
            className="glass-panel"
          >
            <Text
              size="10px"
              fw={800}
              c="dimmed"
              p="xs"
              style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Configuration Category
            </Text>
            <Stack gap={4}>
              {categories.map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.key
                return (
                  <NavLink
                    key={cat.key}
                    active={isActive}
                    label={cat.label}
                    description={cat.description}
                    leftSection={
                      <Icon
                        size={16}
                        color={
                          isActive
                            ? 'var(--mantine-color-blue-filled)'
                            : 'var(--mantine-color-dimmed)'
                        }
                      />
                    }
                    onClick={() => setActiveCategory(cat.key as SettingsCategory)}
                    styles={{
                      root: {
                        borderRadius: 'var(--mantine-radius-sm)',
                        padding: '8px 12px',
                        transition: 'all 0.15s ease'
                      },
                      label: {
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '12px'
                      },
                      description: {
                        fontSize: '10px'
                      }
                    }}
                  />
                )
              })}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right Content Workspace */}
        <Grid.Col span={{ base: 12, md: 8.5 }}>
          {activeCategory === 'connection' && (
            <Stack gap="md">
              <ConnectionSettingsCard showToast={showToast} />
            </Stack>
          )}

          {activeCategory === 'session' && (
            <Stack gap="md">
              <HospitalCredentialsSettings
                settings={settings}
                validationErrors={validationErrors}
                employees={employees}
                updateNestedSetting={updateNestedSetting}
              />
            </Stack>
          )}

          {activeCategory === 'theme' && (
            <Stack gap="md">
              <Card
                withBorder
                radius="sm"
                padding="md"
                bg="var(--panel-soft)"
                className="glass-panel"
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
                  <Palette size={14} color="var(--mantine-color-blue-filled)" />
                  Theme & Environment
                </Title>
                <Stack gap="md">
                  <Box
                    p="sm"
                    bg="var(--panel)"
                    style={{ border: '1px solid var(--line)', borderRadius: 'var(--mantine-radius-sm)' }}
                  >
                    <Box mb="xs">
                      <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Active System Theme
                      </Text>
                      <Text size="xs" c="dimmed">
                        Instant zero-re-render DOM theme swapper
                      </Text>
                    </Box>
                    <SegmentedControl
                      value={theme}
                      onChange={(val) => setTheme(val)}
                      data={[
                        { label: 'Light Mode', value: 'light' },
                        { label: 'Dark Mode', value: 'dark' }
                      ]}
                      fullWidth
                      size="xs"
                    />
                  </Box>

                  <SimpleGrid cols={2} spacing="xs">
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
                          { value: 'lg', label: 'Curved' }
                        ]}
                      />
                    </Box>
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
                          { value: 'lg', label: 'LG' }
                        ]}
                      />
                    </Box>
                  </SimpleGrid>

                  <SimpleGrid cols={2} spacing="xs">
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

                  <Box p="xs" bg="var(--panel)" style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
                    <Switch
                      label="Adaptive Card Backgrounds"
                      description="Dynamically colors encounter cards based on activity submission states"
                      checked={adaptiveCardColors}
                      onChange={(event) => setAdaptiveCardColors?.(event.currentTarget.checked)}
                      size="xs"
                    />
                  </Box>
                </Stack>
              </Card>
            </Stack>
          )}

          {activeCategory === 'shortcodes' && (
            <Stack gap="md">
              <ShortcodesSettings showToast={showToast} />
            </Stack>
          )}

          {activeCategory === 'ai' && (
            <Stack gap="md">
              <ApiPanel showToast={showToast as any} aiModel={aiModel} setAiModel={setAiModel} />
            </Stack>
          )}
        </Grid.Col>
      </Grid>
    </Box>
  )
}
