import React, { useMemo } from 'react'
import { Group, Grid, Button, Stack, Box, Text, ScrollArea } from '@mantine/core'
import { Download, Eye, Archive, RefreshCw, FileText, Activity } from 'lucide-react'
import { useIcdState } from '../hooks/useIcdState'
import { IcdResultsTable } from './icd/IcdResultsTable'
import { IcdConfigCard } from './icd/IcdConfigCard'
import { IcdSearchForm } from './icd/IcdSearchForm'
import { LtAppCard } from '../shared_elements'

interface SummaryPanelProps {
  active: boolean
  summaryHtml: string
  onExportHtml: () => void
  onExportPdf: () => void
  onExportZip: () => void
  showToast: (_text: string, tone: 'ok' | 'error' | 'loading' | 'info' | 'warning', durationMs?: number) => void
  encounter: string
  theme: string
}

interface SummaryItem {
  label?: string
  content: string
}

interface SummaryCategory {
  title: string
  fields: SummaryItem[]
}

export function parseEmrSummaryHtml(htmlString: string) {
  if (!htmlString) return { metadata: [], categories: [] }
  try {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html')
    const metadata: { label: string; value: string }[] = []
    const tables = Array.from(doc.querySelectorAll('table'))

    for (const tbl of tables) {
      if (tbl.textContent?.includes('Patient Name') || tbl.textContent?.includes('MPI')) {
        const tds = Array.from(tbl.querySelectorAll('td'))
        for (let i = 0; i < tds.length; i++) {
          const bTag = tds[i].querySelector('b, strong')?.textContent?.trim()
          if (bTag && i + 1 < tds.length) {
            const cleanLabel = bTag.replace(/:$/, '').trim()
            let val = tds[i + 1].textContent?.trim() || ''
            if (val.startsWith(':')) val = val.substring(1).trim()
            if (!cleanLabel.toUpperCase().includes('PRINTED')) {
              metadata.push({ label: cleanLabel, value: val.replace(/^&nbsp;/g, '').trim() })
            }
            i++
          }
        }
        break
      }
    }

    let doctorSignature = ''
    for (let i = tables.length - 1; i >= 0; i--) {
      const tText = tables[i].textContent?.trim() || ''
      if (tText.includes('Signature') || tText.includes('Dr.') || tText.includes('Doctor')) {
        doctorSignature = (tables[i].textContent || '').split('\n').map((s) => s.trim()).filter(Boolean).join('\n')
        break
      }
    }

    const categories: SummaryCategory[] = []
    const catTables = tables.filter((t) => t.getAttribute('bgcolor') || t.getAttribute('style')?.includes('background') || t.textContent?.includes('Notes'))

    if (catTables.length > 0) {
      const bodyHtml = doc.body.innerHTML
      const matches: { title: string; index: number }[] = []
      const reg = /<table[^>]*bgcolor=["']?[^"'>]+["']?[^>]*>[\s\S]*?<b>\s*([^<]+)\s*<\/b>[\s\S]*?<\/table>/gi
      let m: RegExpExecArray | null
      while ((m = reg.exec(bodyHtml)) !== null) {
        matches.push({ title: m[1].replace(/&nbsp;/g, ' ').trim(), index: m.index + m[0].length })
      }

      for (let idx = 0; idx < matches.length; idx++) {
        const cur = matches[idx]
        const nextIdx = idx + 1 < matches.length ? matches[idx + 1].index : bodyHtml.length
        const block = bodyHtml.substring(cur.index, nextIdx)
        const fields: SummaryItem[] = []
        const parts = block.split(/<b>\s*([^:<]+?)\s*:\s*<\/b>/gi)

        if (parts.length > 1) {
          for (let fIdx = 1; fIdx < parts.length; fIdx += 2) {
            const clean = new DOMParser().parseFromString(parts[fIdx + 1] || '', 'text/html').body.textContent?.trim() || ''
            if (clean) fields.push({ label: parts[fIdx].trim(), content: clean })
          }
        } else {
          const clean = new DOMParser().parseFromString(block, 'text/html').body.textContent?.trim() || ''
          if (clean) fields.push({ content: clean })
        }
        if (fields.length > 0) categories.push({ title: cur.title, fields })
      }
    }

    return { metadata, categories, doctorSignature, rawFallbackHtml: categories.length === 0 ? htmlString : undefined }
  } catch {
    return { metadata: [], categories: [], rawFallbackHtml: htmlString }
  }
}

export default function SummaryPanel({
  active,
  summaryHtml,
  onExportHtml,
  onExportPdf,
  onExportZip,
  showToast,
  encounter
}: SummaryPanelProps) {
  const icdState = useIcdState({ encounter, active, showToast })

  const parsed = useMemo(() => {
    return parseEmrSummaryHtml(summaryHtml)
  }, [summaryHtml])

  if (!active) return null

  return (
    <Grid mt="xs" m={0}>
      {/* LEFT SIDE: Unified Summary Document Desk Card */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <LtAppCard
          title="Summary Document Desk"
          icon={FileText}
          minHeight={600}
          padding="xs"
          loading={!summaryHtml}
          loadingText="Waiting for EMR Summary Document... Please select or fetch an encounter above."
          actions={
            <>
              <Button size="xs" variant="outline" leftSection={<Download size={12} />} onClick={onExportHtml}>
                Export HTML
              </Button>
              <Button size="xs" variant="outline" leftSection={<Eye size={12} />} onClick={onExportPdf}>
                View PDF Summary
              </Button>
              <Button size="xs" leftSection={<Archive size={12} />} onClick={onExportZip}>
                Export ZIP Portfolio
              </Button>
            </>
          }
        >
          {summaryHtml && (
            <Box style={{ flex: 1, overflow: 'hidden' }} h="100%" mih={540}>
              <ScrollArea h="100%">
                <Stack gap="md" p="xs">
                  {/* Patient Metadata Grid */}
                  {parsed.metadata.length > 0 && (
                    <Box pb="xs" bd="0 0 1px solid var(--mantine-color-default-border)">
                      <Group gap="md" align="flex-start" wrap="wrap">
                        {parsed.metadata.map((item, idx) => (
                          <Box key={idx} style={{ flex: '1 1 120px', minWidth: '110px' }}>
                            <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                              {item.label}
                            </Text>
                            <Text size="xs" fw={800}>
                              {item.value || '-'}
                            </Text>
                          </Box>
                        ))}
                      </Group>
                    </Box>
                  )}

                  {/* Dynamic Summary Categories or Raw Fallback */}
                  {parsed.categories.length > 0 ? (
                    parsed.categories.map((cat, catIdx) => (
                      <Box key={catIdx} pl="xs" style={{ borderLeft: '3px solid var(--mantine-color-orange-5)' }}>
                        <Group gap="xs" align="center" mb={4}>
                          <Text size="xs" fw={800} tt="uppercase" c="orange">
                            {cat.title}
                          </Text>
                        </Group>
                        <Stack gap="xs" pl="2px">
                          {cat.fields.map((field, fieldIdx) => (
                            <Box key={fieldIdx}>
                              {field.label && (
                                <Text size="10px" fw={700} c="dimmed" tt="uppercase">
                                  {field.label}
                                </Text>
                              )}
                              <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
                                {field.content}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    ))
                  ) : parsed.rawFallbackHtml ? (
                    <Box fs="xs" dangerouslySetInnerHTML={{ __html: parsed.rawFallbackHtml }} />
                  ) : (
                    <Text size="xs" c="dimmed" ta="center">
                      No clinical summary recorded.
                    </Text>
                  )}

                  {/* Doctor Signature Block */}
                  {parsed.doctorSignature && (
                    <Box pl="xs" pt="xs" style={{ borderLeft: '3px solid var(--mantine-color-blue-5)' }}>
                      <Text size="10px" fw={700} c="dimmed" tt="uppercase" mb={2}>
                        Doctor / Physician Signature
                      </Text>
                      <Text size="xs" style={{ whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                        {parsed.doctorSignature}
                      </Text>
                    </Box>
                  )}
                </Stack>
              </ScrollArea>
            </Box>
          )}
        </LtAppCard>
      </Grid.Col>

      {/* RIGHT SIDE: ICD-10 Diagnoses, Configuration & Form Cards */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="sm" pb="md">
          <LtAppCard
            title="Active ICD-10 Diagnoses"
            icon={Activity}
            actions={
              <Button
                size="xs"
                variant="subtle"
                leftSection={<RefreshCw size={11} />}
                onClick={icdState.fetchDiagnoses}
                loading={icdState.loading}
                h={20}
                p="0 6px"
                fs="10px"
              >
                Refresh List
              </Button>
            }
          >
            <Box style={{ overflowX: 'auto' }}>
              <IcdResultsTable
                diagnoses={icdState.diagnoses}
                compact={true}
                handleTogglePrimary={icdState.handleTogglePrimary}
                handleDeleteDiagnosis={icdState.handleDeleteDiagnosis}
              />
            </Box>
          </LtAppCard>

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
