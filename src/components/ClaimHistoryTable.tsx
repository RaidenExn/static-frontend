import React, { useState } from 'react'
import { Card, Group, Text, Badge, Table } from '@mantine/core'
import { rcmStrVal } from '../utils'

interface ClaimHistoryTableProps {
  claimHistory: any[]
}

export const ClaimHistoryTable: React.FC<ClaimHistoryTableProps> = ({ claimHistory }) => {
  // Map of file_id (or index if null) to expanded boolean. Default to expanded (true)
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({})

  const toggleFile = (fileKey: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [fileKey]: prev[fileKey] === false ? true : false
    }))
  }

  // Helper to format values as decimals
  const formatAmount = (val: any) => {
    if (val === null || val === undefined || val === '') return ''
    const parsed = parseFloat(val)
    return isNaN(parsed) ? rcmStrVal(val) : parsed.toFixed(2)
  }

  // Render RA status badge for child code rows
  const renderStatusBadge = (raAmount: any, denialCode: string) => {
    if (raAmount === null || raAmount === undefined || raAmount === '') {
      return null
    }
    const amount = parseFloat(raAmount)
    const hasDenial = !!(denialCode || '').trim()

    if (amount === 0) {
      if (hasDenial) {
        return (
          <Badge
            size="xs"
            variant="none"
            style={{
              marginLeft: '6px',
              height: '14px',
              padding: '2px 6px',
              fontSize: '8px',
              textTransform: 'none',
              borderRadius: '4px',
              backgroundColor: 'var(--badge-error-bg)',
              border: '1px solid var(--badge-error-border)',
              color: 'var(--badge-error-text)',
              fontWeight: 600
            }}
          >
            DENIED
          </Badge>
        )
      }
      return (
        <Badge
          size="xs"
          variant="none"
          style={{
            marginLeft: '6px',
            height: '14px',
            padding: '2px 6px',
            fontSize: '8px',
            textTransform: 'none',
            borderRadius: '4px',
            backgroundColor: 'var(--badge-neutral-bg)',
            border: '1px solid var(--badge-neutral-border)',
            color: 'var(--badge-neutral-text)',
            fontWeight: 600
          }}
        >
          ZERO
        </Badge>
      )
    } else {
      if (hasDenial) {
        return (
          <Badge
            size="xs"
            variant="none"
            style={{
              marginLeft: '6px',
              height: '14px',
              padding: '2px 6px',
              fontSize: '8px',
              textTransform: 'none',
              borderRadius: '4px',
              backgroundColor: 'var(--badge-warning-bg)',
              border: '1px solid var(--badge-warning-border)',
              color: 'var(--badge-warning-text)',
              fontWeight: 600
            }}
          >
            PARTIAL
          </Badge>
        )
      }
      return (
        <Badge
          size="xs"
          variant="none"
          style={{
            marginLeft: '6px',
            height: '14px',
            padding: '2px 6px',
            fontSize: '8px',
            textTransform: 'none',
            borderRadius: '4px',
            backgroundColor: 'var(--badge-success-bg)',
            border: '1px solid var(--badge-success-border)',
            color: 'var(--badge-success-text)',
            fontWeight: 600
          }}
        >
          PAID
        </Badge>
      )
    }
  }

  return (
    <Card
      withBorder
      radius="sm"
      padding="xs"
      style={{
        backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
        backdropFilter: 'var(--backdrop-filter, blur(16px))',
        WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
        border: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
        marginTop: '16px'
      }}
    >
      <Group
        justify="space-between"
        align="center"
        style={{
          borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
          paddingBottom: '4px',
          marginBottom: '4px'
        }}
      >
        <Text
          size="xs"
          fw={700}
          style={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-text)' }}
        >
          Claim History Details
        </Text>
        <Badge
          size="xs"
          variant="none"
          style={{
            height: '14px',
            padding: '2px 6px',
            fontSize: '8px',
            borderRadius: '4px',
            backgroundColor: 'var(--badge-neutral-bg)',
            border: '1px solid var(--badge-neutral-border)',
            color: 'var(--badge-neutral-text)',
            fontWeight: 600
          }}
        >
          {claimHistory.length}
        </Badge>
      </Group>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <Table
          highlightOnHover
          verticalSpacing={4}
          horizontalSpacing="xs"
          style={{ fontSize: '10.5px', width: '100%', tableLayout: 'auto' }}
        >
          <Table.Thead>
            <Table.Tr style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))' }}>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'left'
                }}
              >
                File Name / Code Type
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'left'
                }}
              >
                Transaction Date / Code
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'left'
                }}
              >
                Description
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'left'
                }}
              >
                ID Payer
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'left'
                }}
              >
                Payment Ref #
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'left'
                }}
              >
                Denial Code
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'right'
                }}
              >
                As Per Rate Card
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'right'
                }}
              >
                Authorized / Claimed
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'right'
                }}
              >
                Latest RA Amount
              </Table.Th>
              <Table.Th
                style={{
                  padding: '4px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textAlign: 'left'
                }}
              >
                Comment / Denial Description
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {claimHistory.length === 0 ? (
              <Table.Tr>
                <Table.Td
                  colSpan={10}
                  style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '10.5px' }}
                >
                  No claim history files found.
                </Table.Td>
              </Table.Tr>
            ) : (
              claimHistory.map((row: any, idx: number) => {
                const fileKey = row.file_id ? String(row.file_id) : `idx-${idx}`
                const isExpanded = expandedFiles[fileKey] === true
                const children = row.children || []

                // Calculate file-level totals
                const fileRateCardTotal = children.reduce(
                  (sum: number, c: any) => sum + (parseFloat(c.conf_payer_payable) || 0),
                  0
                )
                const fileClaimedTotal = children.reduce(
                  (sum: number, c: any) => sum + (parseFloat(c.auth_payer_payable || c.conf_payer_payable) || 0),
                  0
                )

                const hasRaCredits = children.some(
                  (c: any) => c.ra_payer_credit !== null && c.ra_payer_credit !== undefined
                )
                const fileRaTotal = hasRaCredits
                  ? children.reduce((sum: number, c: any) => sum + (parseFloat(c.ra_payer_credit) || 0), 0)
                  : null

                return (
                  <React.Fragment key={fileKey}>
                    {/* File Row (Parent) */}
                    <Table.Tr
                      onClick={() => toggleFile(fileKey)}
                      style={{
                        background: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
                      }}
                    >
                      <Table.Td
                        style={{
                          padding: '6px',
                          color: 'var(--ink)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            transition: 'transform 0.15s ease',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            fontSize: '8px',
                            color: 'var(--muted)'
                          }}
                        >
                          ▶
                        </span>
                        <span style={{ wordBreak: 'break-all' }}>{row.file_name || 'Manual'}</span>
                      </Table.Td>
                      <Table.Td style={{ padding: '6px' }}>{row.transact_date || ''}</Table.Td>
                      <Table.Td style={{ padding: '6px', color: 'var(--muted)' }}>[File Entry]</Table.Td>
                      <Table.Td style={{ padding: '6px' }}>{row.ra_id_payer || row.idPayer || ''}</Table.Td>
                      <Table.Td style={{ padding: '6px' }}>{row.payment_ref || ''}</Table.Td>
                      <Table.Td style={{ padding: '6px' }}></Table.Td>
                      <Table.Td style={{ padding: '6px', textAlign: 'right' }}>
                        {formatAmount(row.conf_payer_payable || fileRateCardTotal)}
                      </Table.Td>
                      <Table.Td style={{ padding: '6px', textAlign: 'right' }}>
                        {formatAmount(row.auth_payer_payable || fileClaimedTotal)}
                      </Table.Td>
                      <Table.Td
                        style={{
                          padding: '6px',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: fileRaTotal !== null && fileRaTotal > 0 ? 'var(--good, #40c057)' : 'inherit'
                        }}
                      >
                        {fileRaTotal !== null ? formatAmount(fileRaTotal) : ''}
                      </Table.Td>
                      <Table.Td
                        style={{ padding: '6px', color: 'var(--muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}
                      >
                        {row.ra_claim_comment || ''}
                      </Table.Td>
                    </Table.Tr>

                    {/* Nested Child Rows */}
                    {isExpanded &&
                      (children.length === 0 ? (
                        <Table.Tr style={{ borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))' }}>
                          <Table.Td
                            colSpan={10}
                            style={{
                              padding: '6px 6px 6px 24px',
                              color: 'var(--muted)',
                              fontStyle: 'italic',
                              fontSize: '10px'
                            }}
                          >
                            No activities nested in this record.
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        children.map((child: any, cIdx: number) => {
                          const raAmountStr =
                            child.ra_payer_credit !== null && child.ra_payer_credit !== undefined
                              ? formatAmount(child.ra_payer_credit)
                              : ''

                          return (
                            <Table.Tr
                              key={`${fileKey}-child-${cIdx}`}
                              style={{
                                borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
                                fontSize: '10px',
                                background: 'transparent'
                              }}
                            >
                              <Table.Td
                                style={{
                                  padding: '4px 6px 4px 20px',
                                  color: 'var(--muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <span style={{ color: 'var(--muted)', fontSize: '10px' }}>↳</span>
                                <span>{child.codeTypeName || 'CPT'}</span>
                              </Table.Td>
                              <Table.Td style={{ padding: '4px 6px', fontWeight: '500' }}>{child.code || ''}</Table.Td>
                              <Table.Td
                                style={{
                                  padding: '4px 6px',
                                  fontWeight: '500',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {child.itemName || child.item_name || ''}
                              </Table.Td>
                              <Table.Td style={{ padding: '4px 6px' }}></Table.Td>
                              <Table.Td style={{ padding: '4px 6px' }}></Table.Td>
                              <Table.Td style={{ padding: '4px 6px' }}>
                                {child.denialCode || ''}
                                {renderStatusBadge(child.ra_payer_credit, child.denialCode)}
                              </Table.Td>
                              <Table.Td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--muted)' }}>
                                {formatAmount(child.conf_payer_payable)}
                              </Table.Td>
                              <Table.Td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--muted)' }}>
                                {formatAmount(child.auth_payer_payable || child.conf_payer_payable)}
                              </Table.Td>
                              <Table.Td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: '500' }}>
                                {raAmountStr}
                              </Table.Td>
                              <Table.Td
                                style={{
                                  padding: '4px 6px',
                                  color: 'var(--muted)',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {child.claim_denial_desc || ''}
                              </Table.Td>
                            </Table.Tr>
                          )
                        })
                      ))}
                  </React.Fragment>
                )
              })
            )}
          </Table.Tbody>
        </Table>
      </div>
    </Card>
  )
}
