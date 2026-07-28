import { useState, useCallback } from 'react'

export interface ProcessPdfAttachmentParams {
  file?: File | null
  base64?: string | null
  downloadUrl?: string
  encounterId: string | number
  autoAttachSummary?: boolean
  compressLevel?: string | null
  fileName?: string
}

export interface ProcessPdfAttachmentResult {
  success: boolean
  fileName: string
  base64: string
  bytes: number
  pageCount: number
  tempUrl: string
  error?: string
}

export function usePdfPipeline() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processAttachment = useCallback(async (params: ProcessPdfAttachmentParams): Promise<ProcessPdfAttachmentResult | null> => {
    setIsProcessing(true)
    setError(null)

    try {
      let rawBase64 = params.base64 || null
      let resolvedFileName = params.fileName || params.file?.name || 'document.pdf'

      if (params.file && !rawBase64) {
        const arrayBuf = await params.file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuf)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        rawBase64 = btoa(binary)
      }

      const res = await fetch('/api/pdf/process-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: rawBase64,
          downloadUrl: params.downloadUrl,
          encounterId: params.encounterId,
          autoAttachSummary: params.autoAttachSummary,
          compressLevel: params.compressLevel,
          fileName: resolvedFileName
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Pipeline failed with HTTP ${res.status}`)
      }

      const data: ProcessPdfAttachmentResult = await res.json()
      setIsProcessing(false)
      return data
    } catch (err: any) {
      const msg = err.message || 'PDF processing failed'
      setError(msg)
      setIsProcessing(false)
      console.error('[usePdfPipeline] Error:', msg)
      return null
    }
  }, [])

  return {
    processAttachment,
    isProcessing,
    error
  }
}
