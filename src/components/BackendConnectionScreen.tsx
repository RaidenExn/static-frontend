import React, { useState } from 'react'
import { Card, TextInput, Button, Stack, Text, Title, Group, Box, Alert } from '@mantine/core'
import { Database, Wifi, AlertCircle, CheckCircle2 } from 'lucide-react'
import { validateBackendUrl } from '../config/backend'
import { setBackendUrl } from '../config/runtime'

export default function BackendConnectionScreen() {
  const [urlInput, setEncounterInput] = useState('http://localhost:8788')
  const [testing, setTesting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  React.useEffect(() => {
    const autoProbe = async () => {
      // Proactively scavenge standard ports to auto-negotiate protocol and port context
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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccess(false)

    const targetUrl = urlInput.trim()
    if (!targetUrl) {
      setErrorMsg('Backend URL cannot be empty.')
      return
    }

    if (!validateBackendUrl(targetUrl)) {
      setErrorMsg('Invalid URL format. Please use http://IP:PORT or https://IP:PORT.')
      return
    }

    setTesting(true)
    try {
      // Direct health-check ping to local backend discovery ping
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
          // Short delay for user satisfaction animation before full reload
          setTimeout(() => {
            window.location.reload()
          }, 800)
          return
        }
      }
      setErrorMsg('Connected but received an invalid response. Is this a genuine LT-Local server?')
    } catch (err: any) {
      setErrorMsg(`Failed to connect to the backend: ${err.message || 'Network error'}. Make sure your LT-Local server is running on this address and CORS permits connections.`)
    } finally {
      setTesting(false)
    }
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
          maxWidth: 460,
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

          <form onSubmit={handleConnect}>
            <Stack gap="md">
              <TextInput
                label="Local Backend Connection Address"
                placeholder="http://192.168.10.13:8788"
                description="Input your server's LAN IP or loopback address"
                value={urlInput}
                onChange={(e) => setEncounterInput(e.target.value)}
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
