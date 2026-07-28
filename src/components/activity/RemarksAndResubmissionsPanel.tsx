import React from 'react'
import { Group, Text, Table, Stack, Skeleton } from '@mantine/core'
import { Trash2, Paperclip, Pencil } from 'lucide-react'
import { RcmRemark, RcmResubmission } from '../../types'
import { remarkText, rcmStrVal, parseDateLikeJs } from '../../utils'
import dayjs from 'dayjs'
import { LtCompactButton, LtIconButton, LtTableCard } from '../../shared_elements'

interface RemarksAndResubmissionsPanelProps {
  loading: boolean
  remarksCount: number
  remarksRows: RcmRemark[]
  resubmissionsCount: number
  resubmissionsRows: RcmResubmission[]
  onLoadSubmissionFile: (_fileId: string, siteId: string, fileName: string, isViewXml: boolean, directBase64?: string) => void
  onDeleteResubmissionReason?: (resubmitReasonId: number, encounter?: string, raFileId?: number) => void
  onEditResubmissionReason?: (row: RcmResubmission) => void
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
  onDeleteResubmissionReason,
  onEditResubmissionReason,
  adaptiveCardColors = true,
  submissionStateColor = 'gray'
}: RemarksAndResubmissionsPanelProps) {
  const cardColor = adaptiveCardColors ? submissionStateColor : undefined

  return (
    <Stack gap="sm">
      {/* 1. Remarks Card */}
      <LtTableCard
        title="Remarks"
        badge={remarksCount}
        variant={adaptiveCardColors && submissionStateColor !== 'gray' ? 'light' : 'default'}
        color={cardColor}
      >
        <Table.Thead>
          <Table.Tr bd="0 0 1px solid var(--line)">
            <Table.Th colSpan={2} p="6px 8px" fs="xs" fw={700} c="var(--muted)" tt="uppercase">
              Metadata
            </Table.Th>
            <Table.Th p="6px 8px" fs="xs" fw={700} c="var(--muted)" tt="uppercase">
              Remark
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <Table.Tr key={`shimmer-remarks-${idx}`}>
                <Table.Td p="6px 8px" w={130} style={{ verticalAlign: 'top' }}>
                  <Stack gap={4}>
                    <Skeleton height={10} width={40} radius="xs" />
                    <Skeleton height={10} width={40} radius="xs" />
                    <Skeleton height={10} width={40} radius="xs" />
                    <Skeleton height={10} width={40} radius="xs" />
                  </Stack>
                </Table.Td>
                <Table.Td p="6px 8px" w={220} style={{ verticalAlign: 'top' }}>
                  <Stack gap={4}>
                    <Skeleton height={10} width={120} radius="xs" />
                    <Skeleton height={10} width={100} radius="xs" />
                    <Skeleton height={10} width={90} radius="xs" />
                    <Skeleton height={10} width={140} radius="xs" />
                  </Stack>
                </Table.Td>
                <Table.Td p="6px 8px" style={{ verticalAlign: 'top' }}>
                  <Stack gap="xs">
                    <Skeleton height={10} width="90%" radius="xs" />
                    <Skeleton height={10} width="70%" radius="xs" />
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ))
          ) : remarksRows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={3} p="16px 0" ta="center" c="var(--muted)" fs="xs">
                No remarks found.
              </Table.Td>
            </Table.Tr>
          ) : (
            remarksRows.map((row, idx) => (
              <Table.Tr key={idx} bd="0 0 1px solid var(--line)">
                {/* Column 1: Labels Stack */}
                <Table.Td p="6px 8px" w={130} style={{ verticalAlign: 'top' }}>
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
                <Table.Td p="6px 8px" w={220} style={{ verticalAlign: 'top' }}>
                  <Stack gap={2}>
                    <Text size="xs" fw={500}>
                      {renderDateWithTimeInline(row.remarks_date || '')}
                    </Text>
                    <Text size="xs" fw={500}>
                      {row.remarks_from || '—'}
                    </Text>
                    <Text size="xs" fw={500}>
                      {row.user_name || '—'}
                    </Text>
                    <Text size="xs" fw={600}>
                      {row._encounter || '—'}
                    </Text>
                  </Stack>
                </Table.Td>
                {/* Column 3: Full, Wrap-around Remark Text */}
                <Table.Td p="6px 8px" style={{ verticalAlign: 'top' }}>
                  <Text size="xs" fw={500} lh="1.4" style={{ whiteSpace: 'pre-wrap' }}>
                    {remarkText(row)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </LtTableCard>

      {/* 2. Resubmissions Card */}
      <LtTableCard
        title="Resubmissions"
        badge={resubmissionsCount}
        variant={adaptiveCardColors && submissionStateColor !== 'gray' ? 'light' : 'default'}
        color={cardColor}
      >
        <Table.Thead>
          <Table.Tr bd="0 0 1px solid var(--line)">
            <Table.Th colSpan={2} p="6px 8px" fs="xs" fw={700} c="var(--muted)" tt="uppercase">
              Metadata
            </Table.Th>
            <Table.Th p="6px 8px" fs="xs" fw={700} c="var(--muted)" tt="uppercase">
              Comments
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <Table.Tr key={`shimmer-resub-${idx}`}>
                <Table.Td p="6px 8px" w={130} style={{ verticalAlign: 'top' }}>
                  <Stack gap={4}>
                    <Skeleton height={10} width={40} radius="xs" />
                    <Skeleton height={10} width={40} radius="xs" />
                    <Skeleton height={10} width={40} radius="xs" />
                    <Skeleton height={10} width={40} radius="xs" />
                    <Skeleton height={10} width={40} radius="xs" />
                    <Skeleton height={10} width={40} radius="xs" />
                  </Stack>
                </Table.Td>
                <Table.Td p="6px 8px" w={220} style={{ verticalAlign: 'top' }}>
                  <Stack gap={4}>
                    <Skeleton height={10} width={120} radius="xs" />
                    <Skeleton height={10} width={100} radius="xs" />
                    <Skeleton height={10} width={80} radius="xs" />
                    <Skeleton height={10} width={90} radius="xs" />
                    <Skeleton height={10} width={130} radius="xs" />
                    <Skeleton height={10} width={60} radius="xs" />
                  </Stack>
                </Table.Td>
                <Table.Td p="6px 8px" style={{ verticalAlign: 'top' }}>
                  <Stack gap="xs">
                    <Skeleton height={10} width="95%" radius="xs" />
                    <Skeleton height={10} width="80%" radius="xs" />
                    <Skeleton height={10} width="60%" radius="xs" />
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ))
          ) : resubmissionsRows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={3} p="16px 0" ta="center" c="var(--muted)" fs="xs">
                No resubmissions found.
              </Table.Td>
            </Table.Tr>
          ) : (
            resubmissionsRows.map((row, idx) => {
              const reason = row.reason || ''
              const fileIdStr = rcmStrVal(row.file_id) || rcmStrVal(row.resubmit_reason_id) || rcmStrVal(row.id) || ''
              const siteIdStr = rcmStrVal(row.site_id) || ''
              const fileNameStr = row.ra_file_name || ''
              const isSavedComment = row.source === 'Saved Comment' || !!row.resubmit_reason_id || !!row.resubmitReasonId
              const rawAttachment = String(row.attachment || row.resubmit_reason_attachment || '').trim()
              const hasAttachment = isSavedComment
                ? rawAttachment.length > 5 && rawAttachment !== 'null' && rawAttachment !== 'undefined'
                : !!(fileIdStr || fileNameStr)

              const pdfFileName = fileNameStr
                ? fileNameStr.toLowerCase().endsWith('.pdf')
                  ? fileNameStr
                  : fileNameStr.replace(/\.[a-zA-Z0-9]+$/i, '') + '.pdf'
                : 'resubmission_attachment.pdf'

              return (
                <Table.Tr key={idx} bd="0 0 1px solid var(--line)">
                  {/* Column 1: Labels Stack */}
                  <Table.Td p="6px 8px" w={130} style={{ verticalAlign: 'top' }}>
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
                  <Table.Td p="6px 8px" w={220} style={{ verticalAlign: 'top' }}>
                    <Stack gap={2}>
                      <Text size="xs" fw={500}>
                        {renderDateWithTimeInline(row.captured_on || '')}
                      </Text>
                      <Text size="xs" fw={500}>
                        {row.type || '—'}
                      </Text>
                      <Text size="xs" fw={500}>
                        {row.user_name || '—'}
                      </Text>
                      <Text size="xs" fw={500}>
                        {row.source || '—'}
                      </Text>
                      <Text size="xs" fw={600}>
                        {row._encounter || '—'}
                      </Text>
                      <Group gap="xs" h={18} align="center" wrap="nowrap">
                        {hasAttachment ? (
                          <LtCompactButton
                            variant="light"
                            color="blue"
                            leftIcon={<Paperclip size={11} />}
                            onClick={() => onLoadSubmissionFile(fileIdStr, siteIdStr, pdfFileName, false, rawAttachment)}
                            height={18}
                            tooltip="Open Attached PDF Document"
                          >
                            PDF
                          </LtCompactButton>
                        ) : (
                          <Text size="xs" c="var(--muted)">
                            —
                          </Text>
                        )}
                        {typeof onEditResubmissionReason === 'function' &&
                          (row.resubmit_reason_id || row.source === 'Saved Comment') && (
                            <LtIconButton
                              icon={Pencil}
                              iconSize={12}
                              color="blue"
                              variant="subtle"
                              onClick={() => onEditResubmissionReason(row)}
                              tooltip="Edit this resubmission comment"
                            />
                          )}
                        {typeof onDeleteResubmissionReason === 'function' &&
                          (row.resubmit_reason_id || row.source === 'Saved Comment') && (
                            <LtIconButton
                              icon={Trash2}
                              iconSize={13}
                              color="red"
                              variant="subtle"
                              onClick={() => {
                                const reasonId = Number(
                                  row.resubmit_reason_id ||
                                    row.resubmitReasonId ||
                                    (row.source === 'Saved Comment' ? row.id : 0) ||
                                    0
                                )
                                const enc = row._encounter || ''
                                const raFileId = Number(row.ra_file_id || row.file_id || 0)
                                if (window.confirm('Are you sure you want to delete this resubmission comment?')) {
                                  onDeleteResubmissionReason(reasonId, enc, raFileId)
                                }
                              }}
                              tooltip="Delete this resubmission comment from EMR & local cache"
                            />
                          )}
                      </Group>
                    </Stack>
                  </Table.Td>
                  {/* Column 3: Full, Wrap-around Comments Text */}
                  <Table.Td p="6px 8px" style={{ verticalAlign: 'top' }}>
                    <Text size="xs" fw={500} lh="1.4" style={{ whiteSpace: 'pre-wrap' }}>
                      {reason}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )
            })
          )}
        </Table.Tbody>
      </LtTableCard>
    </Stack>
  )
}
