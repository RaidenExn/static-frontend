import React, { useState } from 'react'
import { Card, TextInput, Button, Stack, Text, Title, Group, Box, Alert } from '@mantine/core'
import { Database, Wifi, AlertCircle, CheckCircle2 } from 'lucide-react'
import { normalizeIpToBackendUrl, validateIpOrHost } from '../config/backend'
import { setBackendUrl } from '../config/runtime'
import NetworkDiscoveryCard from './NetworkDiscoveryCard'

export default function BackendConnectionScreen() {
  const [ipInput, setIpInput] = useState('localhost')
  const [testing, setTesting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  React.useEffect(() => {
    const autoProbe = async () => {
      // Proactively scavenge standard ports on localhost
      const ports = [8788, 8789, 8790, 8791]
      const protocols = ['https', 'http']
      for (const port of ports) {
        for (const proto of protocols) {
          try {
            const url = `${proto}://localhost:${port}`
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), 600)
            const res = await fetch(`${url}/lt-local/ping`, {
              method: 'GET',
              mode: 'cors',
              signal: controller.signal
            })
            clearTimeout(id)
            if (res.ok) {
              const text = await res.text()
              if (text.trim() === 'LT_LOCAL_OK' || text.includes('OK')) {
                console.log(`[AutoConnect] Successfully scavenged active local server at ${url}`)
                setSuccess(true)
                setBackendUrl(url)
                setTimeout(() => {
                  window.location.reload()
                }, 600)
                return
              }
            }
          } catch (_) {
            // Keep probing
          }
        }
      }
    }
    autoProbe()
  }, [])

  const connectToIp = async (rawIp: string) => {
    setErrorMsg(null)
    setSuccess(false)

    const cleanInput = rawIp.trim()
    if (!cleanInput) {
      setErrorMsg('Server IP address cannot be empty.')
      return
    }

    if (!validateIpOrHost(cleanInput)) {
      setErrorMsg('Invalid IP format. Please enter a valid LAN IP address or hostname (e.g. 192.168.10.13 or localhost).')
      return
    }

    const targetUrl = normalizeIpToBackendUrl(cleanInput)
    setTesting(true)

    try {
      const pingUrl = targetUrl.endsWith('/')
        ? `${targetUrl}lt-local/ping`
        : `${targetUrl}/lt-local/ping`

      const res = await fetch(pingUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain'
        }
      })

      if (res.ok) {
        const text = await res.text()
        if (text.trim() === 'LT_LOCAL_OK' || text.includes('OK')) {
          setSuccess(true)
          setBackendUrl(targetUrl)
          setTimeout(() => {
            window.location.reload()
          }, 800)
          return
        }
      }
      setErrorMsg('Connected but received an invalid response. Is this a genuine LT-Local server?')
    } catch (err: any) {
      setErrorMsg(`Failed to connect to backend: ${err.message || 'Network error'}. Verify your server is active on this IP and permits CORS.`)
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    connectToIp(ipInput)
  }

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--mantine-color-body)',
        padding: 'var(--mantine-spacing-md)'
      }}
    >
      <Card
        withBorder
        padding="xl"
        radius="sm"
        style={{
          width: '100%',
          maxWidth: 520,
          boxShadow: 'var(--mantine-shadow-md)'
        }}
      >
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Database size={24} style={{ color: 'var(--mantine-color-blue-filled)' }} />
              <Title order={3}>LT-Local Portal</Title>
            </Group>
            <Wifi size={20} style={{ opacity: 0.6 }} />
          </Group>

          <Box>
            <Text size="sm" c="dimmed" mb="xs">
              This standalone static frontend is running in your browser. To start processing medical claims and EMR data, please connect to your local <strong>LT-Local Backend</strong> server running on your LAN.
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="LT-Local Server IP Address"
                placeholder="192.168.10.13"
                description="Enter your server's LAN IP address or hostname"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                disabled={testing || success}
                required
              />

              {errorMsg && (
                <Alert
                  color="red"
                  title="Connection Failed"
                  icon={<AlertCircle size={16} />}
                  radius="xs"
                >
                  <Text size="xs">{errorMsg}</Text>
                </Alert>
              )}

              {success && (
                <Alert
                  color="green"
                  title="Connection Successful"
                  icon={<CheckCircle2 size={16} />}
                  radius="xs"
                >
                  <Text size="xs">Successfully linked to backend! Reloading portal interface...</Text>
                </Alert>
              )}

              <Button
                type="submit"
                loading={testing}
                color={success ? 'green' : 'blue'}
                disabled={success}
                fullWidth
              >
                {success ? 'CONNECTED' : 'CONNECT TO BACKEND'}
              </Button>
            </Stack>
          </form>

          {/* Integrated LAN Network Discovery */}
          <NetworkDiscoveryCard onSelectServer={(discoveredIp) => connectToIp(discoveredIp)} compact />

          <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 'var(--mantine-spacing-sm)' }}>
            <Text size="xs" c="dimmed">
              Ensure that your local server environment allows CORS requests from this domain.
            </Text>
          </Box>
        </Stack>
      </Card>
    </Box>
  )
}
