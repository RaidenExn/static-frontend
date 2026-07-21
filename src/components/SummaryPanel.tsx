import React from 'react'
import { Card, Group, Grid, Button, Stack, Box, Title, Text } from '@mantine/core'
import { Download, Eye, Archive, RefreshCw } from 'lucide-react'
import { useIcdState } from '../hooks/useIcdState'
import { IcdResultsTable } from './icd/IcdResultsTable'
import { IcdConfigCard } from './icd/IcdConfigCard'
import { IcdSearchForm } from './icd/IcdSearchForm'

interface SummaryPanelProps {
  active: boolean
  summaryHtml: string
  onExportHtml: () => void
  onExportPdf: () => void
  onExportZip: () => void
  showToast: (text: string, tone: 'ok' | 'error' | 'loading' | 'info' | 'warning', durationMs?: number) => void
  encounter: string
  theme: string
}

// Applies dynamic theme patches to the raw EMR document before embedding
function patchSummaryHtmlForTheme(html: string, theme: string): string {
  if (!html) return ''

  const scrollbarStyles = `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${theme === 'dark' ? '#373a40' : '#dee2e6'};
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${theme === 'dark' ? '#4a4f56' : '#ced4da'};
    }
  `

  let injectedStyles = ''
  if (theme === 'dark') {
    injectedStyles = `
      <style>
        :root {
          color-scheme: dark !important;
        }
        body {
          background-color: #1a1b1e !important;
          color: #c1c2c5 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          padding: 16px !important;
          margin: 0 !important;
        }
        table, tr, td, th, div, span, p, font, b, strong, h1, h2, h3, h4, h5, h6 {
          background-color: transparent !important;
          background: transparent !important;
          color: #c1c2c5 !important;
        }
        th, b, strong, h1, h2, h3, h4 {
          color: #ffffff !important;
        }
        table, tr, td, th {
          border-color: #373a40 !important;
        }
        a {
          color: #909296 !important;
        }
        img {
          opacity: 0.85;
          filter: grayscale(20%);
        }
        ${scrollbarStyles}
      </style>
    `
  } else {
    injectedStyles = `
      <style>
        body {
          background-color: #ffffff !important;
          color: #212529 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          padding: 16px !important;
          margin: 0 !important;
        }
        ${scrollbarStyles}
      </style>
    `
  }

  // Inject styles just before </head> or <body>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${injectedStyles}</head>`)
  } else if (html.includes('<body>')) {
    return html.replace('<body>', `<body>${injectedStyles}`)
  } else {
    return `${injectedStyles}${html}`
  }
}

export default function SummaryPanel({
  active,
  summaryHtml,
  onExportHtml,
  onExportPdf,
  onExportZip,
  showToast,
  encounter,
  theme
}: SummaryPanelProps) {
  const icdState = useIcdState({ encounter, active, showToast })

  const patchedHtml = React.useMemo(() => {
    return patchSummaryHtmlForTheme(summaryHtml, theme)
  }, [summaryHtml, theme])

  if (!active) return null

  return (
    <Grid style={{ marginTop: '12px', marginLeft: 0, marginRight: 0 }}>
      {/* LEFT SIDE: Native iframe Summary Document with dark theme compatible patches */}
      <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Consolidated Action Dock */}
        <Card withBorder radius="sm" p="xs" bg="var(--mantine-color-body)">
          <Group justify="space-between" align="center">
            <Title
              order={3}
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: 0
              }}
            >
              Summary Document Desk
            </Title>
            <Group gap="xs">
              <Button
                size="xs"
                variant="outline"
                leftSection={<Download style={{ width: 12, height: 12 }} />}
                onClick={onExportHtml}
              >
                Export HTML
              </Button>
              <Button
                size="xs"
                variant="outline"
                leftSection={<Eye style={{ width: 12, height: 12 }} />}
                onClick={onExportPdf}
              >
                View PDF Summary
              </Button>
              <Button size="xs" leftSection={<Archive style={{ width: 12, height: 12 }} />} onClick={onExportZip}>
                Export ZIP Portfolio
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Dynamic Theme Patched iframe Sheet Container */}
        <Card
          withBorder
          padding={0}
          radius="sm"
          bg="var(--mantine-color-body)"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px', overflow: 'hidden' }}
        >
          {!summaryHtml ? (
            <Stack align="center" justify="center" p="xl" style={{ flex: 1, minHeight: '320px' }}>
              <div
                className="toast-spinner"
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid var(--mantine-color-text)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <Text size="xs" c="dimmed" fw={600} ta="center">
                Waiting for EMR Summary Document...
              </Text>
              <Text size="xs" c="dimmed" ta="center" style={{ maxWidth: '300px' }}>
                Please select or fetch an encounter above to view the clinical summary.
              </Text>
            </Stack>
          ) : (
            <iframe
              srcDoc={patchedHtml}
              title="EMR Summary Document"
              style={{
                border: 'none',
                width: '100%',
                height: '100%',
                flex: 1,
                minHeight: '600px',
                backgroundColor: theme === 'dark' ? '#1a1b1e' : '#ffffff'
              }}
            />
          )}
        </Card>
      </Grid.Col>

      {/* RIGHT SIDE: ICD-10 Diagnoses, Configuration & Form Cards */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="sm" style={{ paddingBottom: '20px' }}>
          <Card withBorder radius="sm" padding="xs" bg="var(--mantine-color-body)">
            <Group justify="space-between" align="center" style={{ marginBottom: '8px' }}>
              <Title
                order={4}
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--mantine-color-text)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  margin: 0
                }}
              >
                Active ICD-10 Diagnoses
              </Title>
              <Button
                size="xs"
                variant="subtle"
                leftSection={<RefreshCw style={{ width: 11, height: 11 }} />}
                onClick={icdState.fetchDiagnoses}
                loading={icdState.loading}
                style={{ height: '20px', padding: '0 6px', fontSize: '10px' }}
              >
                Refresh List
              </Button>
            </Group>

            <Box style={{ overflowX: 'auto' }}>
              <IcdResultsTable
                diagnoses={icdState.diagnoses}
                compact={true}
                handleTogglePrimary={icdState.handleTogglePrimary}
                handleDeleteDiagnosis={icdState.handleDeleteDiagnosis}
              />
            </Box>
          </Card>

          <IcdConfigCard compact={true} {...icdState} />

          <IcdSearchForm
            compact={true}
            handleAddDiagnosis={icdState.handleAddDiagnosis}
            commentInput={icdState.commentInput}
            setCommentInput={icdState.setCommentInput}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
