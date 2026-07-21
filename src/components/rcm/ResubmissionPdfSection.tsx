import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@mantine/core'

interface ResubmissionPdfSectionProps {
  canSaveResubmission: boolean
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  attachedFileName: string
  attachedFileBase64?: string
  serverAttachments?: any[]
  onRemoveAttachment?: () => void
}

export default function ResubmissionPdfSection({
  canSaveResubmission,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
  onFileChange,
  attachedFileName,
  attachedFileBase64,
  serverAttachments,
  onRemoveAttachment
}: ResubmissionPdfSectionProps) {
  const [showGlare, setShowGlare] = useState(false)
  const prevAttachedRef = useRef(attachedFileName)

  useEffect(() => {
    if (!prevAttachedRef.current && attachedFileName) {
      setShowGlare(true)
      const timer = setTimeout(() => setShowGlare(false), 1000)
      return () => clearTimeout(timer)
    }
    prevAttachedRef.current = attachedFileName
  }, [attachedFileName])

  const getAttachedFileSizeStr = () => {
    if (attachedFileBase64) {
      const bytes = Math.round((attachedFileBase64.length * 3) / 4)
      return formatBytes(bytes)
    }
    if (attachedFileName && serverAttachments) {
      const match = serverAttachments.find((a: any) => a.fileName === attachedFileName || a.name === attachedFileName)
      const sizeBytes = match?.fileSize || match?.size
      if (typeof sizeBytes === 'number' && sizeBytes > 0) {
        return formatBytes(sizeBytes)
      }
    }
    return ''
  }

  function formatBytes(bytes: number, decimals = 1) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  const openAttachedPdf = (e: React.MouseEvent) => {
    e.stopPropagation() // Stop from triggering fileInputRef click!
    if (attachedFileBase64) {
      try {
        const base64Content = attachedFileBase64.includes('base64,')
          ? attachedFileBase64.split('base64,')[1]
          : attachedFileBase64
        const binary = atob(base64Content)
        const len = binary.length
        const buffer = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
          buffer[i] = binary.charCodeAt(i)
        }
        const blob = new Blob([buffer], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
      } catch (err) {
        console.error('Failed to open base64 PDF:', err)
      }
    } else if (attachedFileName && serverAttachments) {
      const match = serverAttachments.find((a: any) => a.fileName === attachedFileName || a.name === attachedFileName)
      const downloadUrl = match?.downloadUrl || match?.url
      if (downloadUrl) {
        window.open(downloadUrl, '_blank')
      }
    }
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{ display: 'inline-flex', position: 'relative', width: '0', flex: '1 1 0%', minWidth: '150px' }}
    >
      {/* Dynamic Keyframes for Glare Animation */}
      <style>{`
        @keyframes glare-sweep {
          0% {
            left: -150%;
          }
          100% {
            left: 150%;
          }
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={onFileChange}
        style={{ display: 'none' }}
        disabled={!canSaveResubmission}
      />

      <Button
        variant={attachedFileName ? 'filled' : 'light'}
        color={isDragOver ? 'orange' : attachedFileName ? 'green' : 'gray'}
        style={{
          margin: 0,
          padding: '4px 12px',
          height: '24px',
          minHeight: '24px',
          fontSize: '11px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          border: isDragOver
            ? '1.5px dashed var(--accent, #a78bfa)'
            : attachedFileName
              ? '1px solid rgba(0, 0, 0, 0.15)'
              : '1px solid var(--line, rgba(255,255,255,0.05))',
          backgroundColor: isDragOver
            ? 'rgba(204, 113, 41, 0.08)'
            : attachedFileName
              ? '#2b8a3e'
              : 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
          color: isDragOver ? 'var(--accent, #a78bfa)' : attachedFileName ? '#ffffff' : 'inherit',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          maxWidth: '100%',
          position: 'relative',
          transition: 'all 0.3s ease'
        }}
        styles={{
          inner: { width: '100%', minWidth: 0 },
          label: attachedFileName
            ? {
                width: '100%',
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                overflow: 'hidden'
              }
            : {
                width: '100%',
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }
        }}
        onClick={() => canSaveResubmission && fileInputRef.current?.click()}
        disabled={!canSaveResubmission}
        title={attachedFileName ? `Click to change: ${attachedFileName}` : 'Select or Drop PDF'}
      >
        {isDragOver ? (
          'Drop PDF File'
        ) : attachedFileName ? (
          <>
            <span
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#ffffff',
                fontWeight: 600,
                minWidth: 0,
                flex: 1,
                textAlign: 'left'
              }}
            >
              {attachedFileName}
            </span>
            {getAttachedFileSizeStr() && (
              <span
                onClick={openAttachedPdf}
                title="Click to view/open attached PDF file"
                style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '9px',
                  fontWeight: 600,
                  flexShrink: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.65)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
                }}
              >
                {getAttachedFileSizeStr()}
              </span>
            )}
          </>
        ) : (
          'Select or Drop PDF'
        )}

        {/* Sliding Glare Sweep Overlay */}
        {showGlare && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '100%',
              width: '50%',
              background:
                'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%)',
              transform: 'skewX(-25deg)',
              animation: 'glare-sweep 1s ease-in-out forwards',
              pointerEvents: 'none'
            }}
          />
        )}
      </Button>
    </div>
  )
}
