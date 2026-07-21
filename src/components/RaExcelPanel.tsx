import React, { useState } from 'react'
import { Card, Text, Button, Progress, Stack, Box, Group, FileInput, Badge } from '@mantine/core'
import { FileSpreadsheet, Download, Info } from 'lucide-react'
import { customFetch as fetch } from '../config/backend'

interface RaExcelPanelProps {
  active: boolean
  showToast: (msg: string, type: 'ok' | 'error' | 'warning' | 'info' | 'loading') => void
}

export default function RaExcelPanel({ active, showToast }: RaExcelPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('')

  if (!active) return null

  const handleProcess = async () => {
    if (!file) {
      showToast('Please select an Excel file first.', 'warning')
      return
    }

    setProcessing(true)
    setProgress(10)
    setDownloadUrl(null)
    showToast('Uploading and evaluating Excel formulas...', 'loading')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/excel/process', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server returned ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setDownloadUrl(url)

      const originalName = file.name.substring(0, file.name.lastIndexOf('.'))
      setDownloadName(`${originalName}_Processed.xlsx`)
      setProgress(100)
      showToast('Excel processing completed successfully!', 'ok')
    } catch (err: any) {
      setProgress(0)
      showToast(err.message || 'Error processing Excel file', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <FileSpreadsheet size={20} color="var(--mantine-color-teal-filled)" />
            <Text fw={700} size="sm" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Remittance Advice Excel Engine
            </Text>
          </Group>
          {file && (
            <Badge size="sm" variant="light" color="teal">
              Ready
            </Badge>
          )}
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
            Select a claim spreadsheet to dynamically match encounter records with live server-side claim histories. The
            engine will evaluate and append actual EMR records dynamically.
          </Text>
        </Group>

        <FileInput
          leftSection={<FileSpreadsheet size={16} />}
          placeholder="Choose Excel file (.xlsx, .xls)"
          accept=".xlsx,.xls"
          value={file}
          onChange={(payload) => {
            setFile(payload)
            setDownloadUrl(null)
            setProgress(0)
          }}
        />

        {progress > 0 && (
          <Box>
            <Progress value={progress} size="xs" color="teal" animated={processing} />
            <Text size="xs" ta="right" mt={5}>
              {progress}%
            </Text>
          </Box>
        )}

        <Group justify="flex-end" mt="xs">
          <Button onClick={handleProcess} loading={processing} disabled={!file || !!downloadUrl} color="teal" size="xs">
            Process Spreadsheet
          </Button>

          {downloadUrl && (
            <Button
              component="a"
              href={downloadUrl}
              download={downloadName}
              color="teal"
              size="xs"
              variant="outline"
              leftSection={<Download size={14} />}
            >
              Download File
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  )
}
