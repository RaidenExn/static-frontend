import React from 'react'
import {
  Card,
  Group,
  Text,
  Badge,
  Table,
  Button,
  ScrollArea,
  Skeleton,
  Modal,
  ActionIcon,
  Tooltip,
  Loader
} from '@mantine/core'
import { Eye } from 'lucide-react'
import { Attachment } from '../types'
import { parseDateLikeJs } from '../utils'
import { customFetch as fetch } from '../config/backend'

interface ResultsHistoryTableProps {
  resultsLoading: boolean
  attachments: Attachment[]
  encounterDate: string
  onCopyLink: (downloadUrl: string) => void
  onCopyPdfPrompt: (downloadUrl: string) => void
  onCompressPdf: (downloadUrl: string, fileName: string) => void
  onOpenPdf: (downloadUrl: string, fileName: string) => void
  recommendedUrls?: Set<string>
  recommendationReasons?: Record<string, string>
}

export const ResultsHistoryTable: React.FC<ResultsHistoryTableProps> = ({
  resultsLoading,
  attachments,
  encounterDate,
  onCopyLink,
  onCopyPdfPrompt,
  onCompressPdf,
  onOpenPdf,
  recommendedUrls = new Set<string>(),
  recommendationReasons = {}
}) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [previewName, setPreviewName] = React.useState<string | null>(null)
  const [loadingMeta, setLoadingMetadata] = React.useState<boolean>(false)
  const [fileSizeStr, setFileSizeFormatted] = React.useState<string | null>(null)
  const [pagesCount, setPageCount] = React.useState<number | null>(null)

  const handleOpenPreview = async (url: string, name: string) => {
    setPreviewUrl(url)
    setPreviewName(name)
    setLoadingMetadata(true)
    setFileSizeFormatted(null)
    setPageCount(null)

    try {
      const metaRes = await fetch(`/api/pdf/metadata?url=${encodeURIComponent(url)}`)
      if (!metaRes.ok) throw new Error(`Metadata API returned ${metaRes.status}`)
      const meta = await metaRes.json()
      if (meta.fileSizeStr) setFileSizeFormatted(meta.fileSizeStr)
      if (meta.pageCount) setPageCount(meta.pageCount)
    } catch (err) {
      console.error('Failed to load PDF metadata:', err)
    } finally {
      setLoadingMetadata(false)
    }
  }

  return (
    <Card
      withBorder
      radius="sm"
      padding="md"
      w="100%"
      bg="var(--panel-soft, rgba(255, 255, 255, 0.02))"
      bd="1px solid var(--line, rgba(255, 255, 255, 0.05))"
    >
      <style>{`
        .recommended-row-glow {
          position: relative;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .recommended-row-glow td {
          border-top: 1px solid rgba(34, 197, 94, 0.25) !important;
          border-bottom: 1px solid rgba(34, 197, 94, 0.25) !important;
          background-color: rgba(34, 197, 94, 0.04) !important;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }
        .recommended-row-glow td:first-of-type {
          border-left: 3px solid rgba(34, 197, 94, 0.7) !important;
        }
        .recommended-row-glow td:last-of-type {
          border-right: 1px solid rgba(34, 197, 94, 0.2) !important;
        }
        /* Elegant Hover Transition to expand depth and contrast with 0% idle GPU load */
        .recommended-row-glow:hover td {
          background-color: rgba(34, 197, 94, 0.09) !important;
          border-top: 1px solid rgba(34, 197, 94, 0.45) !important;
          border-bottom: 1px solid rgba(34, 197, 94, 0.45) !important;
        }
        .recommended-row-glow:hover td:first-of-type {
          border-left: 3px solid rgba(34, 197, 94, 1) !important;
        }
        .pulse-match-badge {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pulse-match-badge:hover {
          transform: scale(1.05);
        }
      `}</style>
      <Group justify="space-between" align="center" pb="xs" mb="xs" style={{ borderBottom: '1px solid var(--line)' }}>
        <Text size="sm" fw={800} tt="uppercase" style={{ letterSpacing: '0.5px' }} c="var(--mantine-color-text)">
          Results History
        </Text>
        <Badge
          size="xs"
          radius="xs"
          fw={600}
          bg="var(--badge-neutral-bg)"
          c="var(--badge-neutral-text)"
          bd="1px solid var(--badge-neutral-border)"
        >
          {attachments.length}
        </Badge>
      </Group>

      <ScrollArea w="100%" scrollbars={false}>
        <Table
          highlightOnHover
          verticalSpacing="xs"
          horizontalSpacing="md"
          style={{ fontSize: 'var(--mantine-font-size-sm)', width: '100%', tableLayout: 'fixed' }}
        >
          <Table.Thead>
            <Table.Tr style={{ borderBottom: '1px solid var(--line)' }}>
              {[
                { label: '#', w: 45 },
                { label: 'Reported', w: 120 },
                { label: 'Uploaded file', w: undefined },
                { label: 'Encounter', w: 160 },
                { label: 'Category', w: 120 },
                { label: 'Open', w: 180 }
              ].map((h, i) => (
                <Table.Th
                  key={i}
                  style={{
                    padding: '8px 12px',
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    width: h.w,
                    textTransform: 'uppercase'
                  }}
                >
                  {h.label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {resultsLoading ? (
              Array.from({ length: 2 }).map((_, idx) => (
                <Table.Tr key={`shimmer-${idx}`}>
                  {[25, 80, 180, 100, 80, 120].map((width, cIdx) => (
                    <Table.Td key={cIdx} style={{ padding: '8px 12px' }}>
                      <Skeleton h={14} w={width} radius="xs" />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : attachments.length === 0 ? (
              <Table.Tr>
                <Table.Td
                  colSpan={6}
                  style={{
                    padding: '16px 0',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: 'var(--mantine-font-size-sm)'
                  }}
                >
                  No result PDFs found.
                </Table.Td>
              </Table.Tr>
            ) : (
              attachments.map((row: Attachment, idx: number) => {
                const attMs = parseDateLikeJs(row.reportedDate)
                const encMs = parseDateLikeJs(encounterDate)
                let rowBgColor = undefined
                let closenessType: 'green' | 'orange' | null = null

                if (attMs && encMs) {
                  const attDate = new Date(attMs)
                  const encDate = new Date(encMs)
                  attDate.setHours(0, 0, 0, 0)
                  encDate.setHours(0, 0, 0, 0)
                  if (!isNaN(attDate.getTime()) && !isNaN(encDate.getTime())) {
                    const diffDays = Math.round(Math.abs(attDate.getTime() - encDate.getTime()) / (1000 * 60 * 60 * 24))
                    if (diffDays <= 2) {
                      rowBgColor = 'rgba(22, 163, 74, 0.28)'
                      closenessType = 'green'
                    } else if (diffDays >= 3 && diffDays <= 7) {
                      rowBgColor = 'rgba(234, 88, 12, 0.28)'
                      closenessType = 'orange'
                    }
                  }
                }

                const isRec = row.downloadUrl ? recommendedUrls.has(row.downloadUrl) : false
                const recReason = row.downloadUrl ? recommendationReasons[row.downloadUrl] : ''

                const displayCategory = row.category?.trim() === 'Non OT Procedure' ? 'Non OT' : row.category || ''

                // Adaptive configurations for modern text-button controls
                const hasAlert = closenessType === 'green' || closenessType === 'orange'
                const compressBg =
                  closenessType === 'green' ? '#16a34a' : closenessType === 'orange' ? '#ea580c' : 'transparent'
                const compressColor = hasAlert ? '#ffffff' : 'var(--muted, #6b7280)'

                const fileName = row.name || ''
                const midPoint = Math.floor(fileName.length / 2)
                const firstHalf = fileName.slice(0, midPoint)
                const secondHalf = fileName.slice(midPoint)

                return (
                  <Table.Tr key={idx} bg={rowBgColor} className={isRec ? 'recommended-row-glow' : undefined}>
                    <Table.Td
                      style={{
                        padding: '8px 12px',
                        fontSize: 'var(--mantine-font-size-sm)',
                        cursor: row.downloadUrl ? 'pointer' : 'default'
                      }}
                      onClick={() => row.downloadUrl && onCopyLink(row.downloadUrl)}
                    >
                      <Tooltip
                        label="Click to copy direct PDF link"
                        disabled={!row.downloadUrl}
                        position="top"
                        withArrow
                      >
                        <Text
                          size="sm"
                          fw="bold"
                          c={row.downloadUrl ? 'var(--accent, #a78bfa)' : 'inherit'}
                          td={row.downloadUrl ? 'underline' : 'none'}
                          truncate="end"
                        >
                          {idx + 1}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)' }}>
                      <Text size="sm" truncate="end">
                        {row.reportedDate || ''}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', maxWidth: 0 }}>
                      <Group gap="xs" wrap="nowrap" w="100%" style={{ overflow: 'hidden' }}>
                        <Tooltip label={fileName} position="top" withArrow>
                          <Group gap={0} wrap="nowrap" style={{ overflow: 'hidden', flex: 1, cursor: 'help' }}>
                            <Text
                              component="span"
                              size="sm"
                              fw={500}
                              truncate="end"
                              style={{ minWidth: 0, flexShrink: 1 }}
                            >
                              {firstHalf}
                            </Text>
                            <Text
                              component="span"
                              size="sm"
                              fw={500}
                              truncate="end"
                              style={{ minWidth: 0, flexShrink: 1, direction: 'rtl', textAlign: 'left' }}
                            >
                              <span style={{ direction: 'ltr', display: 'inline-block' }}>{secondHalf}</span>
                            </Text>
                          </Group>
                        </Tooltip>
                        {isRec && (
                          <Tooltip label={recReason || 'Auto-recommended clinical PDF'} position="top" withArrow>
                            <Badge
                              size="xs"
                              radius="xs"
                              variant="filled"
                              color="green"
                              className="pulse-match-badge"
                              styles={{
                                root: {
                                  cursor: 'help',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }
                              }}
                            >
                              Auto-Match ✨
                            </Badge>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)' }}>
                      <Text size="sm" truncate="end">
                        {row.encounter || ''}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)' }}>
                      <Text size="sm" truncate="end">
                        {displayCategory}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)' }}>
                      {row.downloadUrl ? (
                        <Group gap="xs" wrap="nowrap">
                          <Tooltip label="Preview PDF" position="top" withArrow>
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="blue"
                              onClick={() => handleOpenPreview(row.downloadUrl!, row.name || '')}
                              style={{ width: '24px', height: '24px', minWidth: '24px' }}
                              aria-label="Preview PDF"
                            >
                              <Eye style={{ width: 14, height: 14 }} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Open PDF via PDF Pro extension" position="top" withArrow>
                            <Button
                              onClick={() => onOpenPdf(row.downloadUrl!, row.name || '')}
                              size="xs"
                              variant="light"
                              style={{
                                height: '24px',
                                fontSize: 'var(--mantine-font-size-xs)',
                                padding: '0 8px'
                              }}
                            >
                              Open PDF
                            </Button>
                          </Tooltip>
                          <Tooltip label="Compress PDF via iLovePDF (backend)" position="top" withArrow>
                            <Button
                              onClick={() => onCompressPdf(row.downloadUrl!, row.name || '')}
                              size="xs"
                              variant={hasAlert ? 'filled' : 'light'}
                              color={
                                closenessType === 'green' ? 'green' : closenessType === 'orange' ? 'orange' : 'gray'
                              }
                              style={{
                                height: '24px',
                                fontSize: 'var(--mantine-font-size-xs)',
                                padding: '0 8px'
                              }}
                            >
                              Compress
                            </Button>
                          </Tooltip>
                        </Group>
                      ) : (
                        <Text size="sm" truncate="end">
                          -
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                )
              })
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Modal
        opened={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title={
          <Group gap="sm" style={{ flexWrap: 'nowrap' }}>
            <Text fw={700} truncate="end" style={{ maxWidth: '300px' }}>
              {previewName || 'PDF Preview'}
            </Text>
            <Group gap="xs" style={{ borderLeft: '1px solid var(--line)', paddingLeft: '12px', flexWrap: 'nowrap' }}>
              {loadingMeta ? (
                <Group gap="xs">
                  <Loader size={12} color="blue" />
                  <Text size="xs" c="var(--text-muted, var(--muted))">
                    Analyzing document...
                  </Text>
                </Group>
              ) : (
                <>
                  {fileSizeStr && (
                    <Badge size="xs" variant="light" color="blue" radius="xs" style={{ textTransform: 'none' }}>
                      SIZE: {fileSizeStr}
                    </Badge>
                  )}
                  {pagesCount !== null && (
                    <Badge size="xs" variant="light" color="teal" radius="xs" style={{ textTransform: 'none' }}>
                      PAGES: {pagesCount}
                    </Badge>
                  )}
                </>
              )}
            </Group>
          </Group>
        }
        size="80%"
        centered
        overlayProps={{
          backgroundOpacity: 0.45,
          blur: 16
        }}
        styles={{
          content: {
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--line)',
            color: 'var(--ink)'
          },
          header: {
            backgroundColor: 'var(--bg-panel)',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '12px'
          }
        }}
      >
        {previewUrl && (
          <iframe
            src={previewUrl}
            title={previewName || 'PDF Document'}
            style={{
              width: '100%',
              height: 'calc(80vh - 120px)',
              border: 'none',
              borderRadius: 'var(--mantine-radius-sm, 4px)',
              backgroundColor: '#fff'
            }}
          />
        )}
      </Modal>
    </Card>
  )
}
