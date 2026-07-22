import React, { useRef, useState } from 'react'
import { Card, Title, Group, Text, Box, Stack, Button, Tooltip } from '@mantine/core'
import { Download, Upload, CheckCircle, RefreshCw } from 'lucide-react'

interface ShortcodesSettingsProps {
  showToast: (text: string, tone?: 'ok' | 'error' | 'info' | 'warning' | 'loading') => void
}

export function ShortcodesSettings({ showToast }: ShortcodesSettingsProps) {
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    try {
      showToast('Downloading CSV...', 'loading')
      const link = document.createElement('a')
      link.href = '/api/shortcodes/export'
      link.setAttribute('download', 'codes_descriptions_shortcodes.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast('CSV downloaded successfully!', 'ok')
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error')
    }
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    showToast('Reading file contents...', 'loading')

    const reader = new FileReader()
    reader.onload = async (event) => {
      const csvContent = event.target?.result
      if (typeof csvContent !== 'string') {
        showToast('Invalid CSV file format', 'error')
        setImporting(false)
        return
      }

      showToast('Importing and building database index...', 'loading')

      try {
        const res = await fetch('/api/shortcodes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent })
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Server returned an error status')
        }

        showToast('Clinical database index successfully rebuilt!', 'ok')
      } catch (err: any) {
        showToast(`Import failed: ${err.message}`, 'error')
      } finally {
        setImporting(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      showToast('FileReader read operation failed', 'error')
      setImporting(false)
    }

    reader.readAsText(file)
  }

  return (
    <Card
      withBorder
      radius="sm"
      padding="md"
      bg="var(--panel-soft)"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '220px'
      }}
    >
      <Box>
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
          📋 Clinical Shortcodes Dictionary
        </Title>

        <Text size="xs" c="dimmed" mb="md">
          Translates standardized medical billing codes (e.g. <code>85025</code>) to friendly shortcodes (e.g. <code>cbc</code>) for prompt compilation, saving up to 50% on input tokens.
        </Text>

        <Stack gap="sm">
          {/* Status block */}
          <Group
            justify="space-between"
            align="center"
            p="sm"
            bg="var(--panel)"
            style={{ border: '1px solid var(--line)', borderRadius: 'var(--mantine-radius-sm)' }}
          >
            <Box>
              <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SQLite Storage Mapping
              </Text>
              <Text size="xs" c="dimmed">
                Status of index compilation
              </Text>
            </Box>
            <Group gap="xs" align="center">
              {importing ? (
                <>
                  <RefreshCw size={14} className="spin" color="var(--mantine-color-yellow-filled)" />
                  <Text size="xs" fw="bold" c="yellow">
                    INDEXING...
                  </Text>
                </>
              ) : (
                <>
                  <CheckCircle size={14} color="var(--mantine-color-green-filled)" />
                  <Text size="xs" fw="bold" c="green">
                    ACTIVE (READY)
                  </Text>
                </>
              )}
            </Group>
          </Group>
        </Stack>
      </Box>

      {/* Action buttons */}
      <Box mt="md">
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Group grow gap="xs">
          <Tooltip label="Download current dictionary as CSV" openDelay={0} closeDelay={0}>
            <Button
              variant="outline"
              color="gray"
              leftSection={<Download size={14} />}
              size="xs"
              onClick={handleExport}
              style={{ fontWeight: 600 }}
            >
              Export CSV
            </Button>
          </Tooltip>

          <Tooltip label="Import and index a new shortcodes CSV" openDelay={0} closeDelay={0}>
            <Button
              variant="filled"
              leftSection={<Upload size={14} />}
              size="xs"
              onClick={handleImportClick}
              loading={importing}
              style={{ fontWeight: 600 }}
            >
              Import CSV
            </Button>
          </Tooltip>
        </Group>
      </Box>
    </Card>
  )
}
