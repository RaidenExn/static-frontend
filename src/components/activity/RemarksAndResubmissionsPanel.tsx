import React from 'react'
import { Card, Group, Text, Badge, Table, Stack, Button, Box } from '@mantine/core'
import { RcmRemark, RcmResubmission } from '../../types'
import { remarkText, rcmStrVal, parseDateLikeJs } from '../../utils'
import dayjs from 'dayjs'

interface RemarksAndResubmissionsPanelProps {
  loading: boolean
  remarksCount: number
  remarksRows: RcmRemark[]
  resubmissionsCount: number
  resubmissionsRows: RcmResubmission[]
  onLoadSubmissionFile: (fileId: string, siteId: string, fileName: string, isViewXml: boolean) => void
  adaptiveCardColors?: boolean
  submissionStateColor?: string
  theme?: string
}

const renderDateWithTimeInline = (dateStr: string) => {
  if (!dateStr) return '—'
  const parts = dateStr.trim().split(/\s+/)
  const datePartStr = parts[0]
  const timePart = parts.slice(1).join(' ')

  const parsedMs = parseDateLikeJs(datePartStr)
  const formattedDate = parsedMs ? dayjs(parsedMs).format('MMM DD, YYYY') : datePartStr

  if (timePart) {
    return `${formattedDate} (${timePart})`
  }
  return formattedDate
}

export default function RemarksAndResubmissionsPanel({
  loading,
  remarksCount,
  remarksRows,
  resubmissionsCount,
  resubmissionsRows,
  onLoadSubmissionFile,
  adaptiveCardColors = true,
  submissionStateColor = 'gray',
  theme = 'light'
}: RemarksAndResubmissionsPanelProps) {
  const adaptiveStyles = React.useMemo(() => {
    if (!adaptiveCardColors || submissionStateColor === 'gray') {
      return {
        bg: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
        border: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
      }
    }

    const isDark = theme === 'dark'

    const colors: Record<string, { lightBg: string; lightBorder: string; darkBg: string; darkBorder: string }> = {
      blue: {
        lightBg: 'rgba(231, 245, 255, 0.58)',
        lightBorder: 'rgba(51, 154, 240, 0.32)',
        darkBg: 'rgba(24, 100, 171, 0.16)',
        darkBorder: 'rgba(51, 154, 240, 0.38)'
      },
      teal: {
        lightBg: 'rgba(224, 242, 241, 0.58)',
        lightBorder: 'rgba(13, 148, 136, 0.32)',
        darkBg: 'rgba(13, 148, 136, 0.16)',
        darkBorder: 'rgba(13, 148, 136, 0.38)'
      },
      indigo: {
        lightBg: 'rgba(237, 242, 255, 0.58)',
        lightBorder: 'rgba(92, 124, 250, 0.32)',
        darkBg: 'rgba(54, 79, 199, 0.16)',
        darkBorder: 'rgba(92, 124, 250, 0.38)'
      },
      orange: {
        lightBg: 'rgba(255, 244, 230, 0.58)',
        lightBorder: 'rgba(253, 126, 20, 0.32)',
        darkBg: 'rgba(232, 114, 0, 0.16)',
        darkBorder: 'rgba(253, 126, 20, 0.38)'
      },
      red: {
        lightBg: 'rgba(255, 235, 235, 0.58)',
        lightBorder: 'rgba(250, 82, 82, 0.32)',
        darkBg: 'rgba(201, 42, 42, 0.16)',
        darkBorder: 'rgba(250, 82, 82, 0.38)'
      }
    }

    const set = colors[submissionStateColor] || colors.blue
    return {
      bg: isDark ? set.darkBg : set.lightBg,
      border: `1px solid ${isDark ? set.darkBorder : set.lightBorder}`
    }
  }, [adaptiveCardColors, submissionStateColor, theme])

  return (
    <Stack gap="sm">
      {/* 1. Remarks Card */}
      <Card
        withBorder
        radius="sm"
        padding="xs"
        style={{
          backgroundColor: adaptiveStyles.bg,
          border: adaptiveStyles.border,
          color: 'var(--ink)',
          transition: 'all 0.2s ease'
        }}
      >
        <Group justify="space-between" align="center" pb="xs" mb="xs" style={{ borderBottom: '1px solid var(--line)' }}>
          <Text size="sm" fw={800} tt="uppercase" style={{ letterSpacing: '0.5px' }} c="var(--mantine-color-text)">
            Remarks
          </Text>
          <Badge size="xs" variant="light" color="gray">
            {remarksCount}
          </Badge>
        </Group>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <Table
            highlightOnHover
            verticalSpacing="xs"
            horizontalSpacing="md"
            style={{ fontSize: 'var(--mantine-font-size-xs)', width: '100%', tableLayout: 'auto' }}
          >
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid var(--line)' }}>
                <Table.Th
                  colSpan={2}
                  style={{
                    padding: '6px 8px',
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Metadata
                </Table.Th>
                <Table.Th
                  style={{
                    padding: '6px 8px',
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Remark
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <Table.Tr key={`shimmer-remarks-${idx}`}>
                    <Table.Td style={{ padding: '6px 8px', width: '130px', verticalAlign: 'top' }}>
                      <Stack gap={2}>
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                      </Stack>
                    </Table.Td>
                    <Table.Td style={{ padding: '6px 8px', width: '220px', verticalAlign: 'top' }}>
                      <Stack gap={2}>
                        <div
                          className="shimmer-text"
                          style={{
                            width: '120px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '100px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '90px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '140px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                      </Stack>
                    </Table.Td>
                    <Table.Td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      <Stack gap="xs">
                        <div
                          className="shimmer-text"
                          style={{
                            width: '90%',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '70%',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : remarksRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={3}
                    style={{
                      padding: '16px 0',
                      textAlign: 'center',
                      color: 'var(--muted)',
                      fontSize: 'var(--mantine-font-size-xs)'
                    }}
                  >
                    No remarks found.
                  </Table.Td>
                </Table.Tr>
              ) : (
                remarksRows.map((row, idx) => (
                  <Table.Tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                    {/* Column 1: Labels Stack */}
                    <Table.Td style={{ padding: '6px 8px', width: '130px', verticalAlign: 'top' }}>
                      <Stack gap={2}>
                        <Text size="xs" fw={700} c="var(--muted)">
                          DATE
                        </Text>
                        <Text size="xs" fw={700} c="var(--muted)">
                          FROM
                        </Text>
                        <Text size="xs" fw={700} c="var(--muted)">
                          USER
                        </Text>
                        <Text size="xs" fw={700} c="var(--muted)">
                          ENCOUNTER
                        </Text>
                      </Stack>
                    </Table.Td>
                    {/* Column 2: Values Stack */}
                    <Table.Td style={{ padding: '6px 8px', width: '220px', verticalAlign: 'top' }}>
                      <Stack gap={2}>
                        <Text size="xs" fw={500} style={{ color: 'var(--ink)' }}>
                          {renderDateWithTimeInline(row.remarks_date || '')}
                        </Text>
                        <Text size="xs" fw={500} style={{ color: 'var(--ink)' }}>
                          {row.remarks_from || '—'}
                        </Text>
                        <Text size="xs" fw={500} style={{ color: 'var(--ink)' }}>
                          {row.user_name || '—'}
                        </Text>
                        <Text size="xs" fw={600} style={{ color: 'var(--ink)' }}>
                          {row._encounter || '—'}
                        </Text>
                      </Stack>
                    </Table.Td>
                    {/* Column 3: Full, Wrap-around Remark Text */}
                    <Table.Td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      <Text
                        size="xs"
                        fw={500}
                        style={{ color: 'var(--ink)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}
                      >
                        {remarkText(row)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Card>

      {/* 2. Resubmissions Card */}
      <Card
        withBorder
        radius="sm"
        padding="xs"
        style={{
          backgroundColor: adaptiveStyles.bg,
          border: adaptiveStyles.border,
          color: 'var(--ink)',
          transition: 'all 0.2s ease'
        }}
      >
        <Group justify="space-between" align="center" pb="xs" mb="xs" style={{ borderBottom: '1px solid var(--line)' }}>
          <Text size="sm" fw={800} tt="uppercase" style={{ letterSpacing: '0.5px' }} c="var(--mantine-color-text)">
            Resubmissions
          </Text>
          <Badge size="xs" variant="light" color="gray">
            {resubmissionsCount}
          </Badge>
        </Group>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <Table
            highlightOnHover
            verticalSpacing="xs"
            horizontalSpacing="md"
            style={{ fontSize: 'var(--mantine-font-size-xs)', width: '100%', tableLayout: 'auto' }}
          >
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid var(--line)' }}>
                <Table.Th
                  colSpan={2}
                  style={{
                    padding: '6px 8px',
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Metadata
                </Table.Th>
                <Table.Th
                  style={{
                    padding: '6px 8px',
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase'
                  }}
                >
                  Comments
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <Table.Tr key={`shimmer-resub-${idx}`}>
                    <Table.Td style={{ padding: '6px 8px', width: '130px', verticalAlign: 'top' }}>
                      <Stack gap={2}>
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '40px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                      </Stack>
                    </Table.Td>
                    <Table.Td style={{ padding: '6px 8px', width: '220px', verticalAlign: 'top' }}>
                      <Stack gap={2}>
                        <div
                          className="shimmer-text"
                          style={{
                            width: '120px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '100px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '80px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '90px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '130px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '60px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                      </Stack>
                    </Table.Td>
                    <Table.Td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      <Stack gap="xs">
                        <div
                          className="shimmer-text"
                          style={{
                            width: '95%',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '80%',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                        <div
                          className="shimmer-text"
                          style={{
                            width: '60%',
                            height: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '1px'
                          }}
                        />
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : resubmissionsRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={3}
                    style={{
                      padding: '16px 0',
                      textAlign: 'center',
                      color: 'var(--muted)',
                      fontSize: 'var(--mantine-font-size-xs)'
                    }}
                  >
                    No resubmissions found.
                  </Table.Td>
                </Table.Tr>
              ) : (
                resubmissionsRows.map((row, idx) => {
                  const reason = row.reason || ''
                  const fileIdStr = rcmStrVal(row.file_id) || ''
                  const siteIdStr = rcmStrVal(row.site_id) || ''
                  const fileNameStr = row.ra_file_name || ''

                  return (
                    <Table.Tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                      {/* Column 1: Labels Stack */}
                      <Table.Td style={{ padding: '6px 8px', width: '130px', verticalAlign: 'top' }}>
                        <Stack gap={2}>
                          <Text size="xs" fw={700} c="var(--muted)">
                            DATE
                          </Text>
                          <Text size="xs" fw={700} c="var(--muted)">
                            TYPE
                          </Text>
                          <Text size="xs" fw={700} c="var(--muted)">
                            USER
                          </Text>
                          <Text size="xs" fw={700} c="var(--muted)">
                            SOURCE
                          </Text>
                          <Text size="xs" fw={700} c="var(--muted)">
                            ENCOUNTER
                          </Text>
                          <Text size="xs" fw={700} c="var(--muted)">
                            ACTIONS
                          </Text>
                        </Stack>
                      </Table.Td>
                      {/* Column 2: Values Stack */}
                      <Table.Td style={{ padding: '6px 8px', width: '220px', verticalAlign: 'top' }}>
                        <Stack gap={2}>
                          <Text size="xs" fw={500} style={{ color: 'var(--ink)' }}>
                            {renderDateWithTimeInline(row.captured_on || '')}
                          </Text>
                          <Text size="xs" fw={500} style={{ color: 'var(--ink)' }}>
                            {row.type || '—'}
                          </Text>
                          <Text size="xs" fw={500} style={{ color: 'var(--ink)' }}>
                            {row.user_name || '—'}
                          </Text>
                          <Text size="xs" fw={500} style={{ color: 'var(--ink)' }}>
                            {row.source || '—'}
                          </Text>
                          <Text size="xs" fw={600} style={{ color: 'var(--ink)' }}>
                            {row._encounter || '—'}
                          </Text>
                          <Box style={{ height: '18px', display: 'flex', alignItems: 'center' }}>
                            {fileIdStr ? (
                              <Group gap="xs" wrap="nowrap">
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="gray"
                                  onClick={() => onLoadSubmissionFile(fileIdStr, siteIdStr, fileNameStr, true)}
                                  style={{
                                    padding: '0 8px',
                                    fontSize: 'var(--mantine-font-size-xs)',
                                    height: '18px',
                                    minHeight: '0',
                                    lineHeight: '16px'
                                  }}
                                >
                                  XML
                                </Button>
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="gray"
                                  onClick={() => onLoadSubmissionFile(fileIdStr, siteIdStr, fileNameStr, false)}
                                  style={{
                                    padding: '0 8px',
                                    fontSize: 'var(--mantine-font-size-xs)',
                                    height: '18px',
                                    minHeight: '0',
                                    lineHeight: '16px'
                                  }}
                                >
                                  PDF
                                </Button>
                              </Group>
                            ) : (
                              <Text size="xs" c="var(--muted)">
                                —
                              </Text>
                            )}
                          </Box>
                        </Stack>
                      </Table.Td>
                      {/* Column 3: Full, Wrap-around Comments Text */}
                      <Table.Td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                        <Text
                          size="xs"
                          fw={500}
                          style={{ color: 'var(--ink)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}
                        >
                          {reason}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )
                })
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Card>
    </Stack>
  )
}
