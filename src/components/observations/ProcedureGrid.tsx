import React from 'react'
import { RcmActivity } from '../../types'

interface ProcedureGridProps {
  activities: RcmActivity[]
  selectedActivity: RcmActivity | null
  setSelectedActivity: (activity: RcmActivity | null) => void
  observationCounts: Record<number, number>
}

export function ProcedureGrid({
  activities,
  selectedActivity,
  setSelectedActivity,
  observationCounts
}: ProcedureGridProps) {
  return (
    <section className="panel-block" style={{ padding: '12px' }}>
      <div className="panel-head" style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Procedure Codes & Services Grid</span>
          <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'rgba(255,255,255,0.6)' }}>
            (Select a row to manage observations)
          </span>
        </h2>
      </div>

      {activities.length === 0 ? (
        <div
          className="no-data-alert"
          style={{ textAlign: 'center', padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}
        >
          No procedure codes found for this encounter. Load an encounter to begin.
        </div>
      ) : (
        <div
          style={{
            maxHeight: '160px',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px'
          }}
        >
          <table className="rcm-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Service Code</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  Procedure / Order Name
                </th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Qty</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Claim Status</th>
                <th
                  style={{
                    padding: '6px 8px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'center'
                  }}
                >
                  Observations
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((row, idx) => {
                const authId = Number(row.order_authorization_id)
                const isSelected = selectedActivity && Number(selectedActivity.order_authorization_id) === authId
                const obsCount = observationCounts[authId] || 0

                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedActivity(row)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(59, 130, 246, 0.15)'
                        : idx % 2 === 0
                          ? 'rgba(0, 0, 0, 0.1)'
                          : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    className="hover-row"
                  >
                    <td style={{ padding: '6px 8px', fontWeight: 'bold', color: isSelected ? '#60a5fa' : '#38bdf8' }}>
                      {row.code || 'N/A'}
                    </td>
                    <td style={{ padding: '6px 8px' }}>{row.order_name}</td>
                    <td style={{ padding: '6px 8px' }}>{row.claim_qty || row.claim_quantity || 1}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span
                        className={`status-badge ${row.claim_status === 'Approved' ? 'approved' : 'pending'}`}
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                      >
                        {row.claim_status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      {obsCount > 0 ? (
                        <span
                          style={{
                            background: '#f97316',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            display: 'inline-block'
                          }}
                        >
                          {obsCount}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
