import React from 'react'
import { Tooltip } from '@mantine/core'
import { Attachment } from '../types'

function truncateMiddle(name: string, maxLength: number = 35): string {
  if (!name || name.length <= maxLength) return name
  const half = Math.floor((maxLength - 3) / 2)
  return name.substring(0, half) + '...' + name.substring(name.length - half)
}

interface ResultsPanelProps {
  active: boolean
  resultsCount: number
  resultFromDate: string
  setResultFromDate: (val: string) => void
  resultToDate: string
  setResultToDate: (val: string) => void
  onReloadResults: () => void
  attachments: Attachment[]
  onOpenPdf: (downloadUrl: string, fileName: string) => void
}

export default function ResultsPanel({
  active,
  resultsCount,
  resultFromDate,
  setResultFromDate,
  resultToDate,
  setResultToDate,
  onReloadResults,
  attachments,
  onOpenPdf
}: ResultsPanelProps) {
  return (
    <section className={active ? 'panel active' : 'panel'} id="resultsPanel">
      <section className="panel-block">
        <div className="panel-head">
          <h2>Results History</h2>
          <span id="resultsCount" className="count-pill">
            {resultsCount}
          </span>
        </div>
        <div className="inline-filters">
          <label>
            Result from
            <input
              id="resultFromDate"
              type="text"
              autoComplete="off"
              placeholder="MM/DD/YYYY"
              value={resultFromDate}
              onChange={(e) => setResultFromDate(e.target.value)}
            />
          </label>
          <label>
            Result to
            <input
              id="resultToDate"
              type="text"
              autoComplete="off"
              placeholder="MM/DD/YYYY"
              value={resultToDate}
              onChange={(e) => setResultToDate(e.target.value)}
            />
          </label>
          <button onClick={onReloadResults} id="resultsReloadButton" type="button" className="secondary">
            Reload results
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Reported</th>
                <th>Uploaded file</th>
                <th>Encounter</th>
                <th>Category</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody id="attachmentsBody">
              {attachments.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="detail-empty">No result PDFs found.</div>
                  </td>
                </tr>
              ) : (
                attachments.map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{row.reportedDate || ''}</td>
                    <td className="name-cell">
                      <Tooltip label={row.name || ''} openDelay={0} closeDelay={0}>
                        <span>{row.name ? truncateMiddle(row.name, 35) : ''}</span>
                      </Tooltip>
                    </td>
                    <td>{row.encounter || ''}</td>
                    <td>{row.category || ''}</td>
                    <td>
                      <a
                        href={row.downloadUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        download={row.name || ''}
                        onClick={(e) => {
                          if (row.downloadUrl) {
                            e.preventDefault()
                            onOpenPdf(row.downloadUrl, row.name || '')
                          }
                        }}
                      >
                        Open PDF
                      </a>
                    </td>
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
