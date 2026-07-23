import React, { useState } from 'react'
import { Table, Group, Text, Badge, Button, Popover, TextInput, Card, Loader, Tooltip } from '@mantine/core'
import { RefreshCw, Download, X, ChevronRight, ChevronDown } from 'lucide-react'
import { RcmActivity } from '../../types'
import { activityRaStatus, priorAuthCode, rcmStrVal, rowHasRepeatTrackerMarker } from '../../utils'

interface ActivityTableProps {
  loading: boolean
  sortedRows: RcmActivity[]
  loadingRepeatTracker: boolean
  repeatTrackerLoaded: boolean
  onLoadRepeatTracker?: (encValue?: any, lookbackYears?: number, mode?: 'auto' | 'manual') => void
  repeatTrackerLookbackYears?: number
  batchAuthStartInput: string
  setBatchAuthStartInput: (val: string) => void
  batchAuthExpiryInput: string
  setBatchAuthExpiryInput: (val: string) => void
  batchActivityStartInput: string
  setBatchActivityStartInput: (val: string) => void
  handleBatchSaveField: (field: 'start' | 'expiry' | 'activityStart', value: string) => void
  handleToggleAllActions: () => void
  editingCell: { authId: number; field: 'code' | 'start' | 'expiry' | 'activityStart' } | null
  setEditingCell: (val: { authId: number; field: 'code' | 'start' | 'expiry' | 'activityStart' } | null) => void
  editValue: string
  setEditValue: (val: string) => void
  handleSaveCell: (authId: number, field: 'code' | 'start' | 'expiry' | 'activityStart', value: string) => void
  modifiedCells: Record<string, boolean>
  observationCounts: Record<number, number>
  handleOpenObservationsModal: (row: RcmActivity) => void
  getDenialDescription: (code: string) => string
  rowActions: Record<number, 're-sub' | 'w-off' | 'close'>
  setRowActions: React.Dispatch<React.SetStateAction<Record<number, 're-sub' | 'w-off' | 'close'>>>
  canSaveRaRemarks: boolean
  dateEditMode: boolean
}

const mapStatusDisplayName = (status: string): string => {
  const normalized = (status || '').trim().toLowerCase()
  if (['full remittance', 'full', 'remitted', 'paid', 'remittance', 'full ra'].includes(normalized)) return 'Full RA'
  if (['partial remittance', 'partial', 'partial ra'].includes(normalized)) return 'Partial RA'
  if (['submitted', 'claim submitted', 'subm'].includes(normalized)) return 'Submitted'
  if (['billed', 'newly billed', 'ready for submission', 'unsubmitted'].includes(normalized)) return 'Billed'
  if (normalized === 'recovery') return 'Recovery'
  if (normalized === 'ra error') return 'RA Error'
  return status || 'Billed'
}

const CellText = ({ text, maxChars, style }: { text: string; maxChars?: number; style?: React.CSSProperties }) => {
  const cleanText = String(text || '')
  const isTruncated = maxChars && cleanText.length > maxChars
  const truncated = isTruncated ? `${cleanText.slice(0, maxChars)}...` : cleanText

  const content = (
    <div
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
    >
      {truncated}
    </div>
  )

  if (isTruncated) {
    return (
      <Tooltip label={cleanText} position="top" withArrow>
        {content}
      </Tooltip>
    )
  }

  return content
}

/* Reusable Batch Header Component to reduce markup repetition */
interface BatchHeaderProps {
  label: string
  field: 'start' | 'expiry' | 'activityStart'
  activePopover: string | null
  setActivePopover: (field: 'start' | 'expiry' | 'activityStart' | null) => void
  inputValue: string
  setInputValue: (val: string) => void
  onSave: (field: 'start' | 'expiry' | 'activityStart', value: string) => void
}

const BatchHeaderCell = ({
  label,
  field,
  activePopover,
  setActivePopover,
  inputValue,
  setInputValue,
  onSave
}: BatchHeaderProps) => (
  <Table.Th style={{ position: 'relative', padding: '8px 12px', whiteSpace: 'nowrap' }}>
    <Popover
      opened={activePopover === field}
      onClose={() => setActivePopover(null)}
      trapFocus
      position="bottom"
      withArrow
      shadow="md"
    >
      <Popover.Target>
        <Group
          gap="xs"
          align="center"
          wrap="nowrap"
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            height: '24px',
            fontSize: 'var(--mantine-font-size-xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)'
          }}
          onClick={(e) => {
            e.stopPropagation()
            setActivePopover(activePopover === field ? null : field)
          }}
        >
          <span>{label}</span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
        </Group>
      </Popover.Target>
      <Popover.Dropdown
        style={{ backgroundColor: 'var(--mantine-color-body)', borderColor: 'var(--line)', padding: '8px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Group gap="xs" align="center" wrap="nowrap">
          <TextInput
            size="xs"
            placeholder="DD/MM/YYYY HH:MM"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            styles={{ input: { width: '150px', height: '32px', fontSize: 'var(--mantine-font-size-sm)' } }}
          />
          <Button
            size="xs"
            onClick={() => {
              onSave(field, inputValue)
              setActivePopover(null)
            }}
            style={{ height: '32px', fontSize: 'var(--mantine-font-size-sm)' }}
          >
            Set
          </Button>
        </Group>
      </Popover.Dropdown>
    </Popover>
  </Table.Th>
)

function ActivityTable({
  loading,
  sortedRows,
  loadingRepeatTracker,
  repeatTrackerLoaded,
  onLoadRepeatTracker,
  repeatTrackerLookbackYears,
  batchAuthStartInput,
  setBatchAuthStartInput,
  batchAuthExpiryInput,
  setBatchAuthExpiryInput,
  batchActivityStartInput,
  setBatchActivityStartInput,
  handleBatchSaveField,
  handleToggleAllActions,
  editingCell,
  setEditingCell,
  editValue,
  setEditValue,
  handleSaveCell,
  modifiedCells,
  observationCounts,
  handleOpenObservationsModal,
  getDenialDescription,
  rowActions,
  setRowActions,
  canSaveRaRemarks,
  dateEditMode
}: ActivityTableProps) {
  const [activePopover, setActivePopover] = useState<'start' | 'expiry' | 'activityStart' | null>(null)
  const [raErrorExpanded, setRaErrorExpanded] = useState<Record<number, boolean>>({})

  const [scrollTop, setScrollTop] = useState(0)
  const containerHeight = 650
  const rowHeight = 39
  const overscan = 15

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const getActionButtonProps = (actionType: 're-sub' | 'w-off', currentAction: string, isDisabled: boolean) => {
    const isActive = currentAction === actionType
    return {
      size: 'xs' as const,
      variant: (isActive ? 'filled' : 'default') as any,
      color: isActive ? (actionType === 're-sub' ? 'green' : 'orange') : undefined,
      disabled: isDisabled,
      style: {
        height: '24px',
        padding: '0 8px',
        fontSize: 'var(--mantine-font-size-xs)',
        fontWeight: 600,
        textTransform: 'none' as const,
        minHeight: '0'
      }
    }
  }

  const staticHeaders = [
    { label: 'Code', w: undefined },
    { label: 'Name', w: undefined },
    { label: 'Status', w: undefined },
    { label: 'Prior Auth #', w: undefined }
  ]

  const dateHeaders = [
    { label: 'Auth Start', field: 'start' as const, value: batchAuthStartInput, setVal: setBatchAuthStartInput },
    { label: 'Auth Expiry', field: 'expiry' as const, value: batchAuthExpiryInput, setVal: setBatchAuthExpiryInput },
    {
      label: 'Activity Start',
      field: 'activityStart' as const,
      value: batchActivityStartInput,
      setVal: setBatchActivityStartInput
    }
  ]

  const numericHeaders = [
    { label: 'Qty', w: undefined },
    { label: 'Obs', w: undefined },
    { label: 'Claim Pat', w: undefined },
    { label: 'Claim Pay', w: undefined },
    { label: 'Claim Net', w: undefined },
    { label: 'RA Pat', w: undefined },
    { label: 'RA Payer', w: undefined },
    { label: 'RA Net', w: undefined },
    { label: 'Rej Amt', w: undefined },
    { label: 'Denial Code', w: undefined }
  ]

  const totalRows = sortedRows.length
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(totalRows, Math.floor((scrollTop + containerHeight) / rowHeight) + overscan)

  const visibleRows = sortedRows.slice(startIndex, endIndex)
  const topSpacerHeight = startIndex * rowHeight
  const bottomSpacerHeight = (totalRows - endIndex) * rowHeight

  return (
    <Card
      withBorder
      radius="sm"
      padding="xs"
      bg="var(--panel-soft, rgba(255, 255, 255, 0.02))" style={{ overflow: "visible", backdropFilter: "var(--backdrop-filter, blur(16px))", WebkitBackdropFilter: "var(--backdrop-filter, blur(16px))" }}
    >
      <div
        style={{
          overflowX: 'auto',
          width: '100%',
          maxHeight: `${containerHeight}px`,
          overflowY: 'auto',
          position: 'relative'
        }}
        onScroll={handleScroll}
      >
        <Table
          highlightOnHover
          verticalSpacing="xs"
          horizontalSpacing="md"
          stickyHeader
          style={{ fontSize: 'var(--mantine-font-size-sm)', width: '100%', tableLayout: 'auto' }}
        >
          <Table.Thead>
            <Table.Tr style={{ borderBottom: '1px solid var(--line)' }}>
              {staticHeaders.map(({ label }) => (
                <Table.Th
                  key={label}
                  style={{
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    padding: '8px 12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {label}
                </Table.Th>
              ))}

              {dateEditMode &&
                dateHeaders.map(({ label, field, value, setVal }) => (
                  <BatchHeaderCell
                    key={field}
                    label={label}
                    field={field}
                    activePopover={activePopover}
                    setActivePopover={setActivePopover}
                    inputValue={value}
                    setInputValue={setVal}
                    onSave={handleBatchSaveField}
                  />
                ))}

              {numericHeaders.map(({ label }) => (
                <Table.Th
                  key={label}
                  style={{
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    padding: '8px 12px',
                    whiteSpace: 'nowrap',
                    ...(label === 'Obs' && { textAlign: 'center' })
                  }}
                >
                  {label}
                </Table.Th>
              ))}

              <Table.Th style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  onClick={handleToggleAllActions}
                  leftSection={<RefreshCw style={{ width: 12, height: 12 }} />}
                  style={{
                    height: '24px',
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0 8px',
                    minHeight: '0'
                  }}
                >
                  Actions
                </Button>
              </Table.Th>

              <Table.Th style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  disabled={loadingRepeatTracker}
                  onClick={() =>
                    !loadingRepeatTracker &&
                    onLoadRepeatTracker &&
                    onLoadRepeatTracker(undefined, repeatTrackerLookbackYears, 'manual')
                  }
                  leftSection={
                    loadingRepeatTracker ? <Loader size={10} /> : <Download style={{ width: 12, height: 12 }} />
                  }
                  style={{
                    height: '24px',
                    fontSize: 'var(--mantine-font-size-xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0 8px',
                    minHeight: '0'
                  }}
                >
                  {loadingRepeatTracker ? 'Syncing...' : 'Sync Tracker'}
                </Button>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <Table.Tr key={`shimmer-activity-${idx}`}>
                  {Array.from({ length: dateEditMode ? 19 : 16 }).map((_, cIdx) => (
                    <Table.Td key={cIdx} style={{ padding: '8px 12px' }}>
                      <div
                        className="shimmer-text"
                        style={{
                          width: '80%',
                          height: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '1px'
                        }}
                      />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : sortedRows.length === 0 ? (
              <Table.Tr>
                <Table.Td
                  colSpan={dateEditMode ? 19 : 16}
                  style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}
                >
                  No activity rows found.
                </Table.Td>
              </Table.Tr>
            ) : (
              <>
                {topSpacerHeight > 0 && (
                  <Table.Tr style={{ height: `${topSpacerHeight}px` }}>
                    <Table.Td colSpan={dateEditMode ? 19 : 16} style={{ padding: 0, border: 0 }} />
                  </Table.Tr>
                )}
                {visibleRows.map((row, relativeIdx) => {
                  const idx = startIndex + relativeIdx
                  const raStatus = activityRaStatus(row)
                  const mappedStatus = mapStatusDisplayName(raStatus)
                  const billingSummary = row.repeatTrackerBillingSummary || ''
                  const authId = Number(row.order_authorization_id)
                  const isDenied = ['Denied', 'Rejected'].includes(mappedStatus)
                  const isPartial = mappedStatus === 'Partial RA'
                  const isRepeatTrackerRow = rowHasRepeatTrackerMarker(row)
                  const rowBg = isDenied
                    ? 'rgba(230, 50, 50, 0.14)'
                    : isPartial
                      ? 'rgba(247, 120, 10, 0.14)'
                      : undefined

                  return (
                    <Table.Tr
                      key={idx}
                      style={{
                        backgroundColor: rowBg,
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        <CellText text={row.code || ''} />
                      </Table.Td>
                      <Table.Td
                        style={{
                          padding: '8px 12px',
                          fontSize: 'var(--mantine-font-size-sm)',
                          whiteSpace: 'nowrap',
                          minWidth: '35ch'
                        }}
                      >
                        <CellText text={row.order_name || ''} style={{ minWidth: '35ch' }} />
                      </Table.Td>

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        <Badge
                          size="xs"
                          variant="none"
                          style={{
                            height: '22px',
                            padding: '0 8px',
                            fontSize: 'var(--mantine-font-size-xs)',
                            textTransform: 'none',
                            borderRadius: '4px',
                            backgroundColor: ['Denied', 'Rejected'].includes(mappedStatus)
                              ? 'var(--badge-error-bg, rgba(239, 68, 68, 0.15))'
                              : mappedStatus === 'Full RA'
                                ? 'var(--badge-success-bg, rgba(16, 185, 129, 0.15))'
                                : mappedStatus === 'Partial RA'
                                  ? 'var(--badge-warning-bg, rgba(245, 158, 11, 0.15))'
                                  : mappedStatus === 'Submitted'
                                    ? 'rgba(2, 132, 199, 0.15)'
                                    : 'var(--badge-neutral-bg, rgba(148, 163, 184, 0.12))',
                            border: ['Denied', 'Rejected'].includes(mappedStatus)
                              ? '1px solid var(--badge-error-border, rgba(239, 68, 68, 0.3))'
                              : mappedStatus === 'Full RA'
                                ? '1px solid var(--badge-success-border, rgba(16, 185, 129, 0.3))'
                                : mappedStatus === 'Partial RA'
                                  ? '1px solid var(--badge-warning-border, rgba(245, 158, 11, 0.3))'
                                  : mappedStatus === 'Submitted'
                                    ? '1px solid rgba(2, 132, 199, 0.3)'
                                    : '1px solid var(--badge-neutral-border, rgba(148, 163, 184, 0.25))',
                            color: ['Denied', 'Rejected'].includes(mappedStatus)
                              ? 'var(--badge-error-text, #ef4444)'
                              : mappedStatus === 'Full RA'
                                ? 'var(--badge-success-text, #10b981)'
                                : mappedStatus === 'Partial RA'
                                  ? 'var(--badge-warning-text, #f59e0b)'
                                  : mappedStatus === 'Submitted'
                                    ? '#38bdf8'
                                    : 'var(--badge-neutral-text, #94a3b8)',
                            fontWeight: 600
                          }}
                        >
                          <CellText text={mappedStatus} />
                        </Badge>
                      </Table.Td>

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        {editingCell?.authId === authId && editingCell.field === 'code' ? (
                          <TextInput
                            size="xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveCell(authId, 'code', editValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCell(authId, 'code', editValue)
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            autoFocus
                            styles={{
                              input: {
                                height: '24px',
                                width: '110px',
                                fontSize: 'var(--mantine-font-size-sm)',
                                padding: '0 4px'
                              }
                            }}
                          />
                        ) : (
                          <Tooltip label="Click to edit Prior Auth #" disabled={!dateEditMode} position="top" withArrow>
                            <div
                              onClick={() => {
                                if (dateEditMode) {
                                  setEditingCell({ authId, field: 'code' })
                                  setEditValue(priorAuthCode(row))
                                }
                              }}
                              className={modifiedCells[`${authId}_code`] ? 'cell-modified-highlight' : ''}
                              style={{
                                display: 'inline-block',
                                fontSize: 'var(--mantine-font-size-sm)',
                                color: priorAuthCode(row) ? 'inherit' : 'var(--muted)',
                                textDecoration: dateEditMode ? 'underline' : 'none',
                                cursor: dateEditMode ? 'pointer' : 'default',
                                fontWeight: priorAuthCode(row) ? 500 : 400,
                                verticalAlign: 'middle'
                              }}
                            >
                              <CellText text={priorAuthCode(row) || (dateEditMode ? '[Add Auth]' : '-')} />
                            </div>
                          </Tooltip>
                        )}
                      </Table.Td>

                      {dateEditMode && (
                        <>
                          {(
                            [
                              {
                                field: 'start',
                                value: row.prior_auth_date_time || row.auth_item_date || '',
                                label: '[Add Start]'
                              },
                              { field: 'expiry', value: row.auth_item_date || '', label: '[Add Expiry]' },
                              {
                                field: 'activityStart',
                                value: (row as any).activity_start_date_time || '',
                                label: '[Add Activity Start]'
                              }
                            ] as const
                          ).map(({ field, value, label }) => (
                            <Table.Td
                              key={field}
                              style={{
                                padding: '8px 12px',
                                fontSize: 'var(--mantine-font-size-sm)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {editingCell?.authId === authId && editingCell.field === field ? (
                                <TextInput
                                  size="xs"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleSaveCell(authId, field, editValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell(authId, field, editValue)
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  autoFocus
                                  placeholder="DD/MM/YYYY HH:MM"
                                  styles={{
                                    input: { height: '24px', width: '110px', fontSize: 'var(--mantine-font-size-sm)' }
                                  }}
                                />
                              ) : (
                                <div
                                  onDoubleClick={() => {
                                    setEditingCell({ authId, field })
                                    setEditValue(value)
                                  }}
                                  className={modifiedCells[`${authId}_${field}`] ? 'cell-modified-highlight' : ''}
                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  <CellText text={value || label} />
                                </div>
                              )}
                            </Table.Td>
                          ))}
                        </>
                      )}

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        {(() => {
                          const qtyVal = Number(rcmStrVal(row.claim_qty) || rcmStrVal(row.claim_quantity)) || 0
                          return (
                            <CellText
                              text={String(qtyVal || '')}
                              style={qtyVal > 1 ? { fontWeight: 700 } : undefined}
                            />
                          )
                        })()}
                      </Table.Td>

                      <Table.Td
                        style={{
                          padding: '8px 12px',
                          fontSize: 'var(--mantine-font-size-sm)',
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Tooltip label="Clinical Evidence Observations & Attachments" position="top" withArrow>
                          <Button
                            size="xs"
                            variant="subtle"
                            color={(observationCounts[authId] || 0) > 0 ? 'green' : 'gray'}
                            onClick={() => handleOpenObservationsModal(row)}
                            style={{
                              height: '24px',
                              padding: '0 8px',
                              minWidth: '24px',
                              fontSize: 'var(--mantine-font-size-xs)',
                              minHeight: '0'
                            }}
                            aria-label="Clinical Evidence Observations & Attachments"
                          >
                            <CellText text={String(observationCounts[authId] || 0)} />
                          </Button>
                        </Tooltip>
                      </Table.Td>

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        <CellText text={rcmStrVal(row.claim_patient_pay) || ''} />
                      </Table.Td>
                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        <CellText text={rcmStrVal(row.claim_payer_pay) || ''} />
                      </Table.Td>
                      <Table.Td
                        style={{
                          padding: '8px 12px',
                          fontSize: 'var(--mantine-font-size-sm)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <CellText text={rcmStrVal(row.claim_net_pay) || rcmStrVal(row.claim_net_payable) || ''} />
                      </Table.Td>
                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        <CellText text={rcmStrVal(row.ra_pat_payable) || ''} />
                      </Table.Td>

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        {(() => {
                          const raPayerStr = rcmStrVal(row.ra_payer_payable) || ''
                          const isPayerRed =
                            (parseFloat(raPayerStr) || 0) <= 0 &&
                            (parseFloat(rcmStrVal(row.claim_payer_pay) || '') || 0) > 0
                          return (
                            <CellText
                              text={raPayerStr}
                              style={isPayerRed ? { color: 'var(--bad, #e03131)', fontWeight: 600 } : undefined}
                            />
                          )
                        })()}
                      </Table.Td>

                      <Table.Td
                        style={{
                          padding: '8px 12px',
                          fontSize: 'var(--mantine-font-size-sm)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <CellText text={rcmStrVal(row.ra_net_payable) || rcmStrVal(row.total_ra_amount) || ''} />
                      </Table.Td>

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        {(() => {
                          const rejStr = rcmStrVal(row.total_rej_amount) || ''
                          return (
                            <CellText
                              text={rejStr}
                              style={
                                (parseFloat(rejStr) || 0) > 0
                                  ? { color: 'var(--bad, #e03131)', fontWeight: 600 }
                                  : undefined
                              }
                            />
                          )
                        })()}
                      </Table.Td>

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        {(() => {
                          const codeStr = row.claim_denial_code || ''
                          if (!codeStr) return ''
                          const desc = getDenialDescription(codeStr)
                          const tooltipLabel = desc ? `${codeStr}: ${desc}` : codeStr
                          return (
                            <Tooltip label={tooltipLabel} position="top" withArrow>
                              <div style={{ display: 'inline-block', verticalAlign: 'middle', cursor: 'help' }}>
                                <Text
                                  size="sm"
                                  style={{
                                    fontWeight: isRepeatTrackerRow ? 800 : 500,
                                    color: isRepeatTrackerRow ? 'var(--bad, #e03131)' : 'inherit',
                                    fontSize: 'var(--mantine-font-size-sm)'
                                  }}
                                >
                                  <CellText text={codeStr} />
                                </Text>
                              </div>
                            </Tooltip>
                          )
                        })()}
                      </Table.Td>

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        {authId
                          ? (() => {
                              const rawStatus = (row.activity_status || row.status || '').trim()
                              const normalizedStatus = rawStatus.toLowerCase()
                              const isRaError = raStatus === 'RA Error'

                              if (normalizedStatus === 'closed') return null

                              const showActions = normalizedStatus === 'open' || (isRaError && raErrorExpanded[authId])

                              if (showActions) {
                                const isChipDisabled = !canSaveRaRemarks
                                const currentAction = rowActions[authId]

                                return (
                                  <Group gap="xs" wrap="nowrap" style={{ height: '24px', alignItems: 'center' }}>
                                    {isRaError && !raErrorExpanded[authId] ? null : (
                                      <>
                                        <Button
                                          {...getActionButtonProps('re-sub', currentAction, isChipDisabled)}
                                          onClick={() => setRowActions((prev) => ({ ...prev, [authId]: 're-sub' }))}
                                        >
                                          Re-sub
                                        </Button>
                                        <Button
                                          {...getActionButtonProps('w-off', currentAction, isChipDisabled)}
                                          onClick={() => setRowActions((prev) => ({ ...prev, [authId]: 'w-off' }))}
                                        >
                                          W-off
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant={currentAction === 'close' ? 'filled' : 'default'}
                                          color="red"
                                          onClick={() => setRowActions((prev) => ({ ...prev, [authId]: 'close' }))}
                                          disabled={isChipDisabled}
                                          style={{
                                            width: '24px',
                                            height: '24px',
                                            padding: 0,
                                            minHeight: '0'
                                          }}
                                        >
                                          <X style={{ width: 12, height: 12 }} />
                                        </Button>
                                      </>
                                    )}
                                  </Group>
                                )
                              }

                              if (isRaError) {
                                const isExpanded = !!raErrorExpanded[authId]
                                return (
                                  <Button
                                    size="xs"
                                    variant="subtle"
                                    color="gray"
                                    onClick={() =>
                                      setRaErrorExpanded((prev) => ({ ...prev, [authId]: !isExpanded }))
                                    }
                                    style={{ height: '24px', padding: '0 6px', minHeight: '0' }}
                                    leftSection={
                                      isExpanded ? (
                                        <ChevronDown style={{ width: 12, height: 12 }} />
                                      ) : (
                                        <ChevronRight style={{ width: 12, height: 12 }} />
                                      )
                                    }
                                  >
                                    Actions
                                  </Button>
                                )
                              }

                              let badgeColor = 'blue'
                              if (normalizedStatus.includes('written') || normalizedStatus.includes('write')) {
                                badgeColor = 'orange'
                              } else if (normalizedStatus.includes('resub') || normalizedStatus.includes('re-sub')) {
                                badgeColor = 'teal'
                              } else if (normalizedStatus.includes('pending')) {
                                badgeColor = 'yellow'
                              } else if (normalizedStatus.includes('submitted')) {
                                badgeColor = 'indigo'
                              }

                              return (
                                <Badge
                                  size="xs"
                                  variant="filled"
                                  color={badgeColor}
                                  style={{ padding: '0 8px', height: '22px', fontSize: 'var(--mantine-font-size-xs)' }}
                                >
                                  {rawStatus}
                                </Badge>
                              )
                            })()
                          : null}
                      </Table.Td>

                      <Table.Td
                        style={{ padding: '8px 12px', fontSize: 'var(--mantine-font-size-sm)', whiteSpace: 'nowrap' }}
                      >
                        {billingSummary ? (
                          <Tooltip label={billingSummary} position="top" withArrow>
                            <Text
                              size="sm"
                              color="dimmed"
                              style={{
                                fontStyle: 'italic',
                                display: 'inline-block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                verticalAlign: 'middle',
                                fontSize: 'var(--mantine-font-size-sm)',
                                cursor: 'help'
                              }}
                            >
                              {billingSummary}
                            </Text>
                          </Tooltip>
                        ) : isRepeatTrackerRow && loadingRepeatTracker ? (
                          <Group gap="xs" align="center" wrap="nowrap" style={{ height: '24px' }}>
                            <Loader size={10} />
                            <Text
                              size="sm"
                              color="dimmed"
                              style={{ fontStyle: 'italic', fontSize: 'var(--mantine-font-size-xs)' }}
                            >
                              Analyzing...
                            </Text>
                          </Group>
                        ) : isRepeatTrackerRow && !repeatTrackerLoaded ? (
                          <Text
                            size="sm"
                            color="dimmed"
                            style={{
                              fontStyle: 'italic',
                              whiteSpace: 'nowrap',
                              fontSize: 'var(--mantine-font-size-xs)',
                              verticalAlign: 'middle'
                            }}
                          >
                            Repeat Tracker not loaded.
                          </Text>
                        ) : (
                          ''
                        )}
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
                {bottomSpacerHeight > 0 && (
                  <Table.Tr style={{ height: `${bottomSpacerHeight}px` }}>
                    <Table.Td colSpan={dateEditMode ? 19 : 16} style={{ padding: 0, border: 0 }} />
                  </Table.Tr>
                )}
              </>
            )}
          </Table.Tbody>
        </Table>
      </div>
    </Card>
  )
}

export default React.memo(ActivityTable)
