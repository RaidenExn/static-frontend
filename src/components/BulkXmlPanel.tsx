import React, { useState } from 'react'
import { Card, Text, Textarea, Button, Group, Stack, Badge } from '@mantine/core'
import { FileCode, Download, Info } from 'lucide-react'
import { customFetch as fetch } from '../config/backend'

interface BulkXmlPanelProps {
  active: boolean
  showToast: (msg: string, type: 'ok' | 'error' | 'warning' | 'info' | 'loading') => void
}

export default function BulkXmlPanel({ active, showToast }: BulkXmlPanelProps) {
  const [inputText, setInputText] = useState('')
  const [parsedEncounters, setParsedEncounters] = useState<string[]>([])
  const [isProcessing, setIsStarting] = useState(false)

  if (!active) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setInputText(text)

    // Regex to match encounter IDs (e.g. BJ/2026/ENC-100 or BJ-2026-ENC-100)
    // Slashes and hyphens are normalized or accepted
    const regex = /BJ[/\-]\d{4}[/\-]ENC-\d+/gi
    const matches = text.match(regex) || []
    const unique = [...new Set(matches.map((m) => m.toUpperCase().replace(/-/g, '/')))]
    setParsedEncounters(unique)
  }

  const handleDownloadBulkXml = async () => {
    if (parsedEncounters.length === 0) {
      showToast('No valid encounters found in the text.', 'error')
      return
    }

    setIsStarting(true)
    showToast(`Generating bulk claim XMLs for ${parsedEncounters.length} encounters...`, 'loading')

    try {
      const res = await fetch('/api/rcm/bulk-generate-claim-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounters: parsedEncounters })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `HTTP error ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bulk_claim_xml_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast(`Successfully downloaded bulk claim XML zip archive.`, 'ok')
      setInputText('')
      setParsedEncounters([])
    } catch (e: any) {
      showToast(`Bulk XML download failed: ${e.message}`, 'error')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <FileCode size={20} color="var(--mantine-color-blue-filled)" />
            <Text fw={700} size="sm" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Bulk Claim XML Generator
            </Text>
          </Group>
          <Badge size="sm" variant="light" color="blue">
            {parsedEncounters.length} Encounters
          </Badge>
        </Group>

        <Group
          gap="xs"
          wrap="nowrap"
          align="flex-start"
          style={{
            backgroundColor: 'var(--panel-soft, rgba(255,255,255,0.02))',
            padding: '10px',
            borderRadius: 'var(--mantine-radius-sm)'
          }}
        >
          <Info size={16} style={{ marginTop: '2px', color: 'var(--muted)' }} />
          <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
            Paste a list of encounter IDs from Excel or any text source. Slashes and hyphens are supported. The server
            will generate individual claim XML files, pack them on-the-fly into an uncompressed ZIP archive, and stream
            the file directly to your browser.
          </Text>
        </Group>

        <Textarea
          value={inputText}
          onChange={handleInputChange}
          placeholder="Paste encounter list here (e.g. BJ/2026/ENC-24069)..."
          minRows={8}
          maxRows={15}
          autosize
          styles={{
            input: {
              fontFamily: 'var(--mantine-font-family-monospace)',
              fontSize: '11px'
            }
          }}
        />

        <Group justify="space-between" align="center" mt="xs">
          <Text size="xs" c="dimmed">
            Matches found:{' '}
            <Text span fw={700} c={parsedEncounters.length > 0 ? 'blue' : 'dimmed'}>
              {parsedEncounters.length}
            </Text>{' '}
            unique encounters
          </Text>

          <Button
            onClick={handleDownloadBulkXml}
            disabled={parsedEncounters.length === 0 || isProcessing}
            loading={isProcessing}
            size="xs"
            leftSection={<Download size={14} />}
          >
            Download ZIP
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
