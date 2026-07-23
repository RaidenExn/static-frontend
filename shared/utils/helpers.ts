export function rcmNumVal(val: any): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed === '') return null
    const parsed = parseFloat(trimmed)
    return isNaN(parsed) ? null : parsed
  }
  if (typeof val === 'object' && val !== null) {
    if ('Float64' in val) return Number(val.Float64)
    if ('Int64' in val) return Number(val.Int64)
    if ('Number' in val) return val.Number
    if ('String' in val) return parseFloat(val.String)
  }
  return null
}

export function parseDateLikeJs(value: any): number | null {
  const text = String(value || '').trim()
  if (!text) return null

  const isoSubMatch = text.match(/\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/)
  if (isoSubMatch) {
    const parsed = new Date(Number(isoSubMatch[1]), Number(isoSubMatch[2]) - 1, Number(isoSubMatch[3]))
    if (!isNaN(parsed.getTime())) return parsed.getTime()
  }

  const dmySubMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/)
  if (dmySubMatch) {
    const first = Number(dmySubMatch[1])
    const second = Number(dmySubMatch[2])
    const year = Number(dmySubMatch[3])
    const day = first > 12 ? first : second > 12 ? second : first
    const month = first > 12 ? second : second > 12 ? first : second
    let fullYear = year
    if (year < 100) {
      fullYear = year >= 50 ? 1900 + year : 2000 + year
    }
    const parsed = new Date(fullYear, month - 1, day)
    if (!isNaN(parsed.getTime())) return parsed.getTime()
  }

  const datePart = text.split(/[T\s]/)[0]
  const isoMatch = datePart.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/)
  if (isoMatch) {
    const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
    return isNaN(parsed.getTime()) ? null : parsed.getTime()
  }
  const dmyMatch = datePart.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/)
  if (dmyMatch) {
    const first = Number(dmyMatch[1])
    const second = Number(dmyMatch[2])
    const year = Number(dmyMatch[3])
    const day = first > 12 ? first : second > 12 ? second : first
    const month = first > 12 ? second : second > 12 ? first : second
    const parsed = new Date(year, month - 1, day)
    return isNaN(parsed.getTime()) ? null : parsed.getTime()
  }
  const parsed = new Date(text)
  return isNaN(parsed.getTime()) ? null : parsed.getTime()
}

export function currentServiceDate(): string {
  const now = new Date()
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
}

export function serviceDateMonthsAgo(months: number): string {
  const now = new Date()
  now.setMonth(now.getMonth() - months)
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
}

export function currentUsDate(): string {
  const now = new Date()
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
}

export function usDateMonthsAgo(months: number): string {
  const now = new Date()
  now.setMonth(now.getMonth() - months)
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
}

export function firstNonEmpty(values: (string | undefined | null)[]): string {
  for (const val of values) {
    if (val) {
      const text = val.trim()
      if (!text) continue
      const lower = text.toLowerCase()
      if (lower === '0' || lower === '0.0' || lower === '0.00' || lower === 'null' || lower === 'undefined') {
        continue
      }
      return text
    }
  }
  return ''
}

export function activityRaStatus(row: any): string {
  if (!row) return ''
  if (row.derived_ra_status) return row.derived_ra_status

  const claimPayer = rcmNumVal(row.claim_payer_pay) ?? 0.0
  const raPayer = rcmNumVal(row.ra_payer_payable) ?? 0.0

  const hasExplicitRa =
    !!row._has_ra ||
    !!row.ra_id_payer ||
    !!row.payment_ref ||
    raPayer > 0.0 ||
    raPayer < 0 ||
    ((row.claim_denial_code || '').trim() !== '' && (row.claim_denial_desc || '').trim() !== '')

  if (hasExplicitRa) {
    if (raPayer < 0) return 'Recovery'
    if (claimPayer > 0 && raPayer > claimPayer) return 'RA Error'
    if (claimPayer > 0 && raPayer > 0 && raPayer === claimPayer) return 'Full Remittance'
    if (claimPayer > 0 && raPayer > 0 && raPayer < claimPayer) return 'Partial Remittance'
    if (claimPayer > 0 && raPayer === 0) return 'Denied'
    if (raPayer > 0 && claimPayer <= 0) return 'RA Error'

    const isDenied =
      (row.claim_denial_code || '').trim() !== '' ||
      rcmNumVal(row.claim_auth_status) === 2.0
    if (isDenied) return 'Denied'

    return row.status || ''
  }

  const isSubmitted =
    !!row._has_submission ||
    Number(row.claim_resubmission_count || 0) > 0 ||
    !!row.submitted_date ||
    !!row.resubmission_date ||
    /subm/i.test(String(row.status || ''))

  if (isSubmitted) return 'Submitted'

  return 'Billed'
}

export function derivePriorAuthCode(row: any): string {
  if (!row) return ''
  if (row.code === '10.01' || row.code_id === '10.01') return ''
  if (row.derived_prior_auth && typeof row.derived_prior_auth === 'string') {
    const trimmed = row.derived_prior_auth.trim()
    if (trimmed && trimmed !== '-') return trimmed
  }

  const lineCandidates = [
    row.prior_auth_no,
    row.prior_auth_code,
    row.prior_auth_number,
    row.prior_authorization_number,
    row.payer_auth_id,
    row.idPayer,
    row.auth_number,
    row.authorization_number
  ]

  for (const c of lineCandidates) {
    if (c !== undefined && c !== null) {
      const s = String(c).trim()
      if (
        s === '' ||
        s === '0' ||
        s === '-' ||
        s.toLowerCase() === 'not authorized' ||
        s.toLowerCase() === 'null' ||
        s.toLowerCase() === 'undefined'
      ) {
        continue
      }
      if (
        s.toLowerCase().includes('.xml') ||
        s.toLowerCase().includes('.html') ||
        /^dha-/i.test(s) ||
        s.split('-').length >= 4 ||
        s.length > 50 ||
        /\b(approved|denied|pending|reject|remark|comment|reason|history|none|null|undefined|not required)\b/i.test(s)
      ) {
        continue
      }
      return s
    }
  }

  return ''
}

export function isSpecialRepeatTrackerRow(row: any): boolean {
  if (!row) return false
  const denial = String(row.claim_denial_code || '')
    .trim()
    .toUpperCase()
  if (denial !== 'PRCE-006' && denial !== 'DUPL-001' && denial !== 'MNEC-005') return false
  const rawCode = String(row.code || row.code_id || '').trim()
  const normalizedCode = rawCode.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return ['9', '9.02', '10', '10.02'].includes(rawCode) || ['9', '902', '10', '1002'].includes(normalizedCode)
}

export function rowHasRepeatTrackerMarker(row: any): boolean {
  if (!row) return false
  const hasMarker =
    /mnec[-\s]*0?05/i.test(String(row.claim_denial_code || '')) ||
    /repeat[-\s]*tracker/i.test(String(row.claim_denial_code || '')) ||
    /mnec[-\s]*0?05/i.test(String(row.code || '')) ||
    /repeat[-\s]*tracker/i.test(String(row.code || '')) ||
    /mnec[-\s]*0?05/i.test(String(row.code_id || '')) ||
    /repeat[-\s]*tracker/i.test(String(row.code_id || '')) ||
    /mnec[-\s]*0?05/i.test(String(row.repeatTrackerBillingSummary || '')) ||
    /repeat[-\s]*tracker/i.test(String(row.repeatTrackerBillingSummary || ''))
  return hasMarker || isSpecialRepeatTrackerRow(row)
}

export function remarkText(row: any): string {
  const statusId = rcmNumVal(row.status_id) ?? 0
  if (statusId === 1) return (row.remarks_ra || '').trim()
  if (statusId === 2) return (row.remarks_write_off || '').trim()
  if (statusId === 3) return (row.remarks_resub || '').trim()
  if (statusId === 4) return (row.remarks_pat_pay_ar || '').trim()
  return (row.remarks || row.remarks_ra || row.remarks_write_off || row.remarks_resub || row.remarks_pat_pay_ar || '').trim()
}

export function resubmissionReason(row: any, claimHistory?: any[]): string {
  const defaultReason = (
    row.reason || row.ra_claim_comment || row.remarks_resub || row.remarks ||
    row.note || row.comments || row.resubmit_reason_desc || row.resubmit_reason_captured || ''
  ).trim()
  if (defaultReason) return defaultReason

  if (claimHistory && claimHistory.length > 0) {
    for (const h of claimHistory) {
      const desc = h.ra_claim_comment || h.ra_claim_reason || h.reason || h.comments
      if (desc && String(desc).trim()) {
        return String(desc).trim()
      }
    }
  }
  return ''
}

export function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDateDDMMYYYY(value: any): string {
  const parsedMs = parseDateLikeJs(value)
  if (!parsedMs) return ''
  const d = new Date(parsedMs)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function calculateAge(dob?: string | null): string {
  if (!dob) return ''
  const parsedMs = parseDateLikeJs(dob)
  if (!parsedMs) return ''
  const now = Date.now()
  const diffYears = Math.floor((now - parsedMs) / (365.25 * 24 * 60 * 60 * 1000))
  return diffYears >= 0 ? `${diffYears}y` : ''
}

export function activityRaStatusClass(status: string, row?: any): string {
  if (status === 'Full Remittance') {
    if (row && (row.claim_denial_code || '').trim() !== '') {
      return 'status-badge status-warning'
    }
    return 'status-badge status-full'
  }
  if (status === 'Denied') return 'status-badge status-denied'
  if (status === 'Partial Remittance') return 'status-badge status-partial'
  if (status === 'Recovery') return 'status-badge status-recovery'
  if (status === 'RA Error') return 'status-badge status-ra-error'
  return 'status-badge'
}

export function calculateRcmFinances(
  activityRows: any[],
  rowActions: Record<number, string>,
  doubleAccumulationMode: boolean
) {
  let grossResub = 0, grossWriteOff = 0, pendingResub = 0

  ;(activityRows || []).forEach((row) => {
    const authId = Number(row.order_authorization_id)
    if (!authId) return
    const rejAmount = rcmNumVal(row.total_rej_amount) ?? 0.0
    const action = rowActions[authId]
    if (action === 're-sub') {
      grossResub += rejAmount
      pendingResub += rejAmount
      if (doubleAccumulationMode && Number(row.activity_status_id) === 3) {
        pendingResub += rejAmount
      }
    } else if (action === 'w-off') {
      if (Number(row.pending_for_write_off || 0) !== 2 && Number(row.maked_for_write_off || 0) !== 2) {
        grossWriteOff += rejAmount
      }
    }
  })

  const preExistingWriteOff = activityRows?.[0] ? (rcmNumVal(activityRows[0].write_off_amount) ?? 0.0) : 0.0

  return {
    grossResub,
    grossWriteOff,
    pendingResub,
    pendingWriteOff: Math.max(0.0, grossWriteOff - preExistingWriteOff)
  }
}

export function applyRowAction(row: any, action: string): any {
  if (action === 're-sub') {
    return {
      ...row,
      is_checked_for_resubmition: 1,
      marked_for_resubmition: 1,
      maked_for_write_off: 0,
      pending_for_write_off: 0,
      marked_closed: 0,
      isClosed: 0,
      activity_status_id: 3
    }
  }
  if (action === 'w-off') {
    return {
      ...row,
      is_checked_for_resubmition: 0,
      marked_for_resubmition: 0,
      maked_for_write_off: 1,
      pending_for_write_off: 1,
      marked_closed: 0,
      isClosed: 0,
      activity_status_id: 2
    }
  }
  if (action === 'written-off') {
    return {
      ...row,
      is_checked_for_resubmition: 0,
      marked_for_resubmition: 0,
      maked_for_write_off: 2,
      pending_for_write_off: 2,
      marked_closed: 0,
      isClosed: 0,
      activity_status_id: 9,
      activity_status: 'Write-Off',
      write_off_amount: row.total_rej_amount || row.write_off_amount
    }
  }
  if (action === 'close') {
    return {
      ...row,
      is_checked_for_resubmition: 0,
      marked_for_resubmition: 0,
      maked_for_write_off: 0,
      pending_for_write_off: 0,
      marked_closed: 1,
      isClosed: 1,
      activity_status_id: 5
    }
  }
  return { ...row }
}

export function normalizeEncounterValue(value: any): string {
  const val = String(value || '').trim()
  return val.replace(/ENC\//i, 'ENC-').toUpperCase()
}
