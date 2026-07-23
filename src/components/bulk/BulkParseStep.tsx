import React from 'react'
import { Tooltip } from '@mantine/core'

interface BulkParseStepProps {
  inputText: string
  setInputText: (val: string) => void
  encountersCount: number
  collectFromStorage: boolean
  setCollectFromStorage: (val: boolean) => void
  isExporting: boolean
  handleExportTemplate: () => void
  isProcessing: boolean
  handleForceResubmit: () => void
  isUploading: boolean
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function BulkParseStep({
  inputText,
  setInputText,
  encountersCount,
  collectFromStorage,
  setCollectFromStorage,
  isExporting,
  handleExportTemplate,
  isProcessing,
  handleForceResubmit,
  isUploading,
  handleFileUpload
}: BulkParseStepProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          backgroundColor: 'var(--panel-soft)',
          padding: '15px',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--line)'
        }}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 600 }}>Clipboard / Excel Column Paste</h3>
        <p style={{ margin: '0 0 15px', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Paste encounter numbers from your clipboard or copy an entire column directly from Excel.
        </p>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g.&#10;MK/2026/ENC-29323&#10;MK/2026/ENC-20343"
          style={{
            width: '100%',
            height: '150px',
            padding: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.85rem',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--line)',
            backgroundColor: 'var(--panel)',
            color: 'var(--ink)',
            resize: 'vertical'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
            Parsed: <strong>{encountersCount}</strong> encounter{encountersCount === 1 ? '' : 's'}
          </span>

          {/* Claude-style Clean Minimalist Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--ink)',
                fontWeight: 500
              }}
            >
              <input
                type="checkbox"
                checked={collectFromStorage}
                onChange={(e) => setCollectFromStorage(e.target.checked)}
                style={{
                  width: '15px',
                  height: '15px',
                  accentColor: 'var(--accent)',
                  cursor: 'pointer',
                  margin: 0
                }}
              />
              <span>Load from storage</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportTemplate}
              disabled={isExporting || encountersCount === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: encountersCount > 0 ? 'var(--accent)' : 'var(--line)',
                color: encountersCount > 0 ? '#fff' : 'var(--muted)',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                cursor: encountersCount > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 500,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s'
              }}
            >
              {isExporting ? 'Generating...' : '📥 Export Editable CSV Template'}
            </button>

            <Tooltip label="Force all denied items back to Resubmission mode directly without writing any comments or remarks" openDelay={0} closeDelay={0}>
              <button
                type="button"
                onClick={handleForceResubmit}
                disabled={encountersCount === 0}
                style={{
                  padding: '8px 14px',
                  backgroundColor: encountersCount > 0 ? 'rgba(217, 119, 6, 0.12)' : 'rgba(255,255,255,0.03)',
                  border: encountersCount > 0 ? '1px solid #d97706' : '1px solid var(--line)',
                  borderRadius: 'var(--mantine-radius-sm)',
                  color: encountersCount > 0 ? '#f59e0b' : 'var(--muted)',
                  cursor: encountersCount > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: encountersCount > 0 ? '0 2px 8px rgba(217, 119, 6, 0.2)' : 'none'
                }}
              >
                ⚡ Force Set to Resubmission Mode
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--line)',
          borderRadius: 'var(--border-radius)',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--panel-soft)'
        }}
      >
        <span style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📁</span>
        <h3 style={{ margin: '0 0 5px', fontSize: '1rem', fontWeight: 600 }}>Upload Populated CSV Sheet</h3>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '400px' }}>
          Once you have populated the new actionable columns in your CSV editor, upload your sheet here.
        </p>
        <label
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--border-radius)',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            fontSize: '0.85rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'background-color 0.2s'
          }}
        >
          {isUploading ? 'Uploading & Parsing...' : 'Choose CSV File (.csv)'}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  )
}
