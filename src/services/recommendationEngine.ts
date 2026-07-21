/**
 * Triggers the combined compression and merging workflow on the backend.
 * Streams real-time NDJSON progress updates directly to premium toast notifications.
 */
export async function compressAndMergePdfsOnBackend(
  pdfs: { downloadUrl: string; fileName: string }[],
  encounter: string,
  showToast: (textOrPayload: any, tone?: string) => void,
  uploadEncounter?: string
): Promise<{ fileName: string; base64?: string; success?: boolean; beforeBytes?: number; afterBytes?: number } | null> {
  const toastId = 'pdf-compress-merge'
  const startTime = Date.now()

  showToast({
    id: toastId,
    title: '⚡ PDF Merge & Compression',
    message: `Preparing to merge and compress ${pdfs.length} PDFs for ${encounter}...`,
    tone: 'loading'
  })

  try {
    const payload: any = { pdfs, encounter }
    if (uploadEncounter) payload.uploadEncounter = uploadEncounter
    const response = await fetch('/api/compress-and-merge-pdfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => 'Unknown error')
      throw new Error(text || `HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let resultPayload: any = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const { stage, message } = JSON.parse(line)
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

          if (stage === 'downloading') {
            showToast({
              id: toastId,
              title: '⚡ PDF Merge & Compression',
              message: `📥 ${message} (${elapsed}s)`,
              tone: 'loading'
            })
          } else if (stage === 'merging') {
            showToast({
              id: toastId,
              title: '⚡ PDF Merge & Compression',
              message: `⚙️ ${message} (${elapsed}s)`,
              tone: 'loading'
            })
          } else if (stage === 'compressing') {
            showToast({
              id: toastId,
              title: '⚡ PDF Merge & Compression',
              message: `⚙️ ${message} (${elapsed}s)`,
              tone: 'loading'
            })
          } else if (stage === 'saving') {
            showToast({
              id: toastId,
              title: '⚡ PDF Merge & Compression',
              message: `💾 ${message} (${elapsed}s)`,
              tone: 'loading'
            })
          } else if (stage === 'done') {
            try {
              resultPayload = JSON.parse(message)
            } catch (_) {}
          } else if (stage === 'error') {
            showToast({
              id: toastId,
              title: '❌ Operation Failed',
              message: message,
              tone: 'error',
              duration: 6000
            })
            return null
          }
        } catch (_) {
          // Ignore invalid parse chunks
        }
      }
    }

    if (resultPayload && (resultPayload.base64 || resultPayload.success)) {
      return resultPayload
    } else {
      throw new Error('Merge & compress completed but returned no file payload')
    }
  } catch (err: any) {
    console.error('Failed to compress and merge PDFs:', err)
    showToast({
      id: toastId,
      title: '❌ Operation Failed',
      message: err.message || 'An unexpected error occurred during merge & compression.',
      tone: 'error',
      duration: 6000
    })
    return null
  }
}
