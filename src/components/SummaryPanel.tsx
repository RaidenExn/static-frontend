import React from 'react'
import { Card, Group, Grid, Button, Stack, Box, Title, Text, ScrollArea } from '@mantine/core'
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

function processSummaryHtml(html: string): string {
  if (!html) return ''

  // Remove duplicate nested page tags
  let clean = html
    .replace(/<!DOCTYPE html>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<\/html>/gi, '')

  // Convert spacing divs into standard unified block spacers
  clean = clean.replace(
    /<div style=["']?line-height:\s*(200%|70%)["']?[^>]*><br><\/div>/gi,
    '<div class="clinical-line-break"></div>'
  )
  clean = clean.replace(
    /<div style=["']?line-height:\s*(200%|70%)["']?[^>]*><br\s*\/><\/div>/gi,
    '<div class="clinical-line-break"></div>'
  )

  // Standard clinical titles to isolate and wrap in block headings
  const sections = [
    'Known Allergy\\s*:',
    'Patient\\s+Complaints\\s*:',
    'History\\s+of\\s+Present\\s+illness\\s*\\(HPI\\)\\s*:',
    'Family\\s+History\\s*:',
    'Vitals\\s*:',
    'Diagnosed\\s+Problems\\s*:',
    'Plan\\s+Notes\\s*:',
    'Procedure\\s+Orders\\s*:',
    'Procedure\\s+Notes\\s*:'
  ]

  for (const section of sections) {
    const regex = new RegExp(`<b>(${section})\\s*<\\/b>`, 'gi')
    clean = clean.replace(regex, '<div class="clinical-section-title"><b>$1</b></div>')
  }

  return clean
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

  const processedHtml = React.useMemo(() => {
    return processSummaryHtml(summaryHtml)
  }, [summaryHtml])

  if (!active) return null

  return (
    <Grid style={{ marginTop: '12px', marginLeft: 0, marginRight: 0 }}>
      {/* LEFT SIDE: Structured React DOM Summary Document */}
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

        {/* Dynamic Theme Patched Structured Clinical Document Container */}
        <Card
          withBorder
          padding={0}
          radius="sm"
          bg="var(--mantine-color-body)"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px', overflow: 'hidden' }}
        >
          {/* Dynamic inline styles mapped completely through native Mantine CSS tokens */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .clinical-summary-html {
              color-scheme: light dark;
              font-family: var(--mantine-font-family), sans-serif !important;
              color: var(--mantine-color-text) !important;
              line-height: 1.5 !important;
              font-size: 12.5px !important;
            }
            
            .clinical-summary-html table[bgcolor] {
              background-color: var(--mantine-color-gray-1) !important;
              border-left: 4px solid var(--mantine-color-primary) !important;
              width: 100% !important;
              margin-top: 14px !important;
              margin-bottom: 8px !important;
              border-collapse: separate !important;
              border-radius: 0 4px 4px 0 !important;
            }

            .clinical-summary-html table[bgcolor] td {
              padding: 6px 12px !important;
              font-size: 11px !important;
              font-weight: 800 !important;
              letter-spacing: 0.04em !important;
              text-transform: uppercase !important;
              color: var(--mantine-color-text) !important;
            }

            [data-mantine-color-scheme="dark"] .clinical-summary-html table[bgcolor] {
              background-color: rgba(255, 255, 255, 0.05) !important;
              border-left: 4px solid var(--mantine-color-primary) !important;
            }

            [data-mantine-color-scheme="dark"] .clinical-summary-html table[bgcolor] td {
              color: var(--mantine-color-dark-0) !important;
            }

            .clinical-section-title {
              display: block !important;
              margin-top: 10px !important;
              margin-bottom: 4px !important;
              font-weight: 700 !important;
              font-size: 11.5px !important;
              letter-spacing: 0.02em !important;
              text-transform: uppercase !important;
              color: var(--mantine-color-primary) !important;
            }

            [data-mantine-color-scheme="dark"] .clinical-section-title {
              color: var(--mantine-color-primary) !important;
            }

            .clinical-line-break {
              display: block !important;
              height: 6px !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .clinical-summary-html br + br {
              display: none !important;
            }

            .clinical-summary-html br {
              margin: 2px 0 !important;
            }

            .clinical-summary-html hr {
              border: none !important;
              height: 1px !important;
              background-color: var(--mantine-color-default-border) !important;
              margin: 10px 0 !important;
            }

            [data-mantine-color-scheme="dark"] .clinical-summary-html hr {
              background-color: var(--mantine-color-dark-4) !important;
            }

            .clinical-summary-html b, .clinical-summary-html strong {
              color: var(--mantine-color-text) !important;
            }

            [data-mantine-color-scheme="dark"] .clinical-summary-html b, 
            [data-mantine-color-scheme="dark"] .clinical-summary-html strong {
              color: var(--mantine-color-dark-0) !important;
            }
          `
            }}
          />

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
            <Box style={{ flex: 1, overflow: 'hidden', height: '100%', minHeight: '600px' }}>
              <ScrollArea h="100%" p="md">
                <div
                  className="clinical-summary-html"
                  dangerouslySetInnerHTML={{
                    __html: processedHtml
                  }}
                />
              </ScrollArea>
            </Box>
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
