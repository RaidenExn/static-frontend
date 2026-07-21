import React from 'react'
import { RcmHistory } from '../types'
import { rcmStrVal } from '../utils'

interface ClaimHistoryPanelProps {
  active: boolean
  historyCount: number
  historyRows: RcmHistory[]
}

export default function ClaimHistoryPanel({ active, historyCount, historyRows }: ClaimHistoryPanelProps) {
  return (
    <section className={active ? 'panel active' : 'panel'} id="historyPanel">
      <section className="panel-block">
        <div className="panel-head">
          <h2>Claim History</h2>
          <span id="historyCount" className="count-pill">
            {historyCount}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Encounter</th>
                <th>File</th>
                <th>Transact</th>
                <th>Payment ref</th>
                <th>Payer</th>
                <th>Code</th>
                <th>Item</th>
                <th>Denial</th>
                <th>Payable</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody id="historyBody">
              {historyRows.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="detail-empty">No claim history rows found.</div>
                  </td>
                </tr>
              ) : (
                historyRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row._encounter || ''}</td>
                    <td className="name-cell">{row.file_name || ''}</td>
                    <td>{row.transact_date || ''}</td>
                    <td>{row.payment_ref || ''}</td>
                    <td>{row.idPayer || row.ra_id_payer || ''}</td>
                    <td>{row.code || ''}</td>
                    <td className="name-cell">{row.itemName || row.item_name || ''}</td>
                    <td>{row.denialCode || row.ra_denial_code || ''}</td>
                    <td>{rcmStrVal(row.ra_payer_credit) || rcmStrVal(row.auth_payer_payable) || ''}</td>
                    <td className="name-cell">{row.ra_claim_comment || row.claim_denial_desc || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
