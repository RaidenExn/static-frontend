import { RcmVisit, RcmRemark } from './types'
import {
  rcmNumVal,
  parseDateLikeJs,
  currentServiceDate,
  serviceDateMonthsAgo,
  currentUsDate,
  usDateMonthsAgo,
  firstNonEmpty,
  activityRaStatus,
  isSpecialRepeatTrackerRow,
  rowHasRepeatTrackerMarker,
  remarkText,
  resubmissionReason,
  activityRaStatusClass,
  isoDate,
  calculateRcmFinances,
  applyRowAction,
  normalizeEncounterValue
} from '../../shared/utils/helpers.ts'

export { rcmNumVal, parseDateLikeJs, currentServiceDate, serviceDateMonthsAgo, currentUsDate, usDateMonthsAgo, activityRaStatus, isSpecialRepeatTrackerRow, rowHasRepeatTrackerMarker, remarkText, resubmissionReason, activityRaStatusClass, isoDate, calculateRcmFinances, applyRowAction, normalizeEncounterValue }

import dayjs from 'dayjs'
import { customFetch as fetch } from './config/backend'

export function rcmStrVal(val: any): string | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'string') {
    const trimmed = val.trim()
    return trimmed === '' ? null : trimmed
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val)
  }
  if (typeof val === 'object' && val !== null) {
    if ('String' in val) {
      const trimmed = String(val.String).trim()
      return trimmed === '' ? null : trimmed
    }
    if ('Number' in val) return String(val.Number)
    if ('Bool' in val) return String(val.Bool)
  }
  return null
}

export function priorAuthCode(row: any): string {
  return row.derived_prior_auth || ''
}



export function formatDate(value?: string | null): string {
  const parsedMs = parseDateLikeJs(value)
  if (!parsedMs) return String(value || '')
  return dayjs(parsedMs).format('MMM DD, YYYY')
}

export function safeFileName(value: string): string {
  const filtered = value
    .split('')
    .map((c) => {
      if (/[a-zA-Z0-9._-]/.test(c)) return c
      return '-'
    })
    .join('')
  return filtered.replace(/^-+|-+$/g, '')
}

export function openBlobUrl(blob: Blob, fileName: string): string {
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener')
  if (!win) {
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
  }
  return url
}

export function openPdfBase64(base64: string, fileName: string): void {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: 'application/pdf' })
  openBlobUrl(blob, fileName)
}

export async function sendExtensionMessage(extensionId: string, message: any): Promise<any> {
  const chrome = (window as any).chrome
  if (!chrome?.runtime?.sendMessage) {
    throw new Error('Chrome extension messaging is not available on this page.')
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(extensionId, message, (response: any) => {
      const runtimeError = chrome.runtime.lastError
      if (runtimeError) {
        reject(new Error(runtimeError.message || 'Extension messaging failed.'))
        return
      }
      if (!response?.success) {
        reject(new Error(response?.error?.message || 'Extension request failed.'))
        return
      }
      resolve(response)
    })
  })
}

export async function openPdfInExtension(
  urlOrBase64: string,
  fileName: string,
  isBase64: boolean,
  showToast?: (textOrPayload: any, tone?: string) => void,
  toastId = 'pdf-open'
): Promise<void> {
  const finalName = fileName
  if (showToast) {
    showToast({
      id: toastId,
      title: '📄 Opening PDF',
      message: `Preparing ${finalName} in temp folder...`,
      tone: 'loading'
    })
  }

  try {
    let fileUrl = ''

    if (isBase64) {
      const response = await fetch('/api/save-pdf-to-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: urlOrBase64, fileName: finalName })
      })
      if (!response.ok) {
        throw new Error((await response.text()) || `HTTP ${response.status}`)
      }
      const data = await response.json()
      fileUrl = data.fileUrl
    } else {
      const response = await fetch('/api/download-to-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl: urlOrBase64, fileName: finalName, preferCompressed: true })
      })
      if (!response.ok) {
        throw new Error((await response.text()) || `HTTP ${response.status}`)
      }
      const data = await response.json()
      fileUrl = data.fileUrl
    }

    if (!fileUrl) {
      throw new Error('Failed to save PDF on server (no URL returned).')
    }

    if (showToast) {
      showToast({
        id: toastId,
        title: '📄 PDF Document Opened',
        message: `Successfully opened ${finalName} in a new tab.`,
        tone: 'ok',
        duration: 4000
      })
    }

    if (fileUrl.startsWith('/')) {
      fileUrl = `${window.location.origin}${fileUrl}`
    }
    window.open(fileUrl, '_blank', 'noopener')
  } catch (err: any) {
    console.error('Failed to open PDF:', err)
    if (showToast) {
      showToast({
        id: toastId,
        title: '❌ Failed to Open PDF',
        message: err.message,
        tone: 'error',
        duration: 6000
      })
    }
  }
}

export async function compressPdfOnBackend(
  downloadUrl: string,
  fileName: string,
  showToast?: (textOrPayload: any, tone?: string) => void,
  skipFinalToast = false
): Promise<{
  filePath: string
  fileUrl: string
  fileName: string
  base64: string
  beforeBytes?: number
  afterBytes?: number
  source?: 'cache' | 'ehr' | null
} | null> {
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const shortenFileName = (name: string, maxLen = 22): string => {
    const clean = name.trim()
    if (clean.length <= maxLen) return clean
    const extIdx = clean.lastIndexOf('.')
    const ext = extIdx !== -1 ? clean.substring(extIdx) : '.pdf'
    const base = extIdx !== -1 ? clean.substring(0, extIdx) : clean
    const charsToShow = maxLen - ext.length - 3
    if (charsToShow <= 0) return clean.substring(0, maxLen)
    return `${base.substring(0, charsToShow)}...${ext}`
  }

  const startTime = Date.now()
  const finalName = /\.[a-zA-Z0-9]{2,4}$/.test(fileName) ? fileName : `${fileName}.pdf`
  const shortName = shortenFileName(finalName)

  const stageLabels: Record<string, string> = {
    download_ehr: '📥 Downloading PDF from EHR...',
    auth: '🔐 Authenticating with iLovePDF...',
    start: '🚀 Starting compression task...',
    upload: '⬆️ Uploading to iLovePDF...',
    upload_fallback: '⚠️ Cloud bypass failed. Retrying via standard upload...',
    process: '⚙️ Compressing PDF...',
    download: '⬇️ Downloading compressed file...',
    save: '💾 Saving compressed file...',
    done: '✅ Compression complete!',
    error: '❌ Compression failed'
  }

  const toastId = 'pdf-compression'

  if (showToast) {
    showToast({
      id: toastId,
      title: '⚡ PDF Compression',
      message: `Preparing to compress ${shortName}...`,
      tone: 'loading'
    })
  }

  let beforeBytes = 0
  let afterBytes = 0
  let sourceVal: 'cache' | 'ehr' | null = null

  try {
    const response = await fetch('/api/compress-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ downloadUrl, fileName: finalName })
    })

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => 'Unknown error')
      throw new Error(text || `HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let resultPayload: any = null
    let compressInfo: { server?: string; approach?: string; region?: string; keyAlias?: string } | null = null

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

          if (stage === 'source') {
            try {
              const data = JSON.parse(message)
              sourceVal = data.source
            } catch (_) {}
          } else if (stage === 'info') {
            try {
              compressInfo = JSON.parse(message)
            } catch (_) {}
          } else if (stage === 'done') {
            try {
              resultPayload = JSON.parse(message)
            } catch (_) {}
          } else if (stage === 'error') {
            if (showToast) {
              showToast({
                id: toastId,
                title: '❌ Compression Failed',
                message: message,
                tone: 'error',
                duration: 6000
              })
            }
          } else if (stage === 'process' && message.includes('Compressed:')) {
            const match = message.match(/Compressed:\s*(\d+)\s*→\s*(\d+)\s*bytes/)
            if (match) {
              beforeBytes = parseInt(match[1])
              afterBytes = parseInt(match[2])
            }
            const sourcePrefix = sourceVal ? `[${sourceVal === 'cache' ? 'Cache' : 'EHR Stream'}] ` : ''
            let activeInfo = ''
            if (compressInfo && compressInfo.server) {
              const approachName =
                compressInfo.approach === 'multipart'
                  ? 'Multipart'
                  : compressInfo.approach === 'cloud_pull'
                    ? 'Cloud Pull'
                    : compressInfo.approach === 'cache'
                      ? 'Cache'
                      : compressInfo.approach
              activeInfo = `\n[${approachName} | ${compressInfo.server}]`
            }
            if (showToast) {
              showToast({
                id: toastId,
                title: '⚡ PDF Compression',
                message: `${sourcePrefix}⚙️ ${message}${activeInfo} (${elapsed}s)`,
                tone: 'loading'
              })
            }
          } else {
            const label = stageLabels[stage] || message
            const sourcePrefix = sourceVal ? `[${sourceVal === 'cache' ? 'Cache' : 'EHR Stream'}] ` : ''
            let activeInfo = ''
            if (compressInfo && compressInfo.server) {
              const approachName =
                compressInfo.approach === 'multipart'
                  ? 'Multipart'
                  : compressInfo.approach === 'cloud_pull'
                    ? 'Cloud Pull'
                    : compressInfo.approach === 'cache'
                      ? 'Cache'
                      : compressInfo.approach
              activeInfo = `\n[${approachName} | ${compressInfo.server}]`
            }
            if (showToast) {
              showToast({
                id: toastId,
                title: '⚡ PDF Compression',
                message: `${sourcePrefix}${label}${activeInfo} (${elapsed}s)`,
                tone: stage === 'upload_fallback' ? 'warning' : 'loading'
              })
            }
          }
        } catch (_) {}
      }
    }

    if (resultPayload) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      let statsString = ''
      if (beforeBytes && afterBytes) {
        const beforeStr = formatBytes(beforeBytes)
        const afterStr = formatBytes(afterBytes)
        const savings = Math.round(((beforeBytes - afterBytes) / beforeBytes) * 100)
        statsString = `\nSaved ${savings}% (${beforeStr} → ${afterStr}) in ${elapsed}s`
      } else {
        statsString = `\nCompleted in ${elapsed}s`
      }

      const sourcePrefix = sourceVal === 'cache' ? ' [Cache Hit]' : ' [EHR Streamed]'
      let infoString = ''
      if (resultPayload.server) {
        const approachName =
          resultPayload.approach === 'multipart'
            ? 'Multipart (B)'
            : resultPayload.approach === 'cloud_pull'
              ? 'Cloud Pull (A)'
              : resultPayload.approach === 'cache'
                ? 'Cache Hit'
                : resultPayload.approach
        infoString = `\nMethod: ${approachName}\nServer: ${resultPayload.server} (${resultPayload.region ? resultPayload.region.toUpperCase() : ''})`
        if (resultPayload.keyAlias && resultPayload.keyAlias !== 'N/A') {
          infoString += `\nKey: ${resultPayload.keyAlias}`
        }
      }

      if (showToast && !skipFinalToast) {
        showToast({
          id: toastId,
          title: `⚡ PDF Compressed${sourcePrefix}`,
          message: `File: ${shortenFileName(resultPayload.fileName)}${statsString}${infoString}`,
          tone: 'ok',
          duration: 10000
        })
      }
    }
    return resultPayload ? { ...resultPayload, beforeBytes, afterBytes, source: sourceVal } : null
  } catch (err: any) {
    console.error('Backend PDF compression failed:', err)
    if (showToast) {
      showToast({
        id: toastId,
        title: '❌ Compression Failed',
        message: err.message,
        tone: 'error',
        duration: 6000
      })
    }
    return null
  }
}

export function getShortcode(shortcodes: Record<string, string | string[]>, code: string, description: string): string {
  const cleanCode = String(code || '').trim()
  const options = shortcodes[cleanCode]
  if (!options) return description
  if (Array.isArray(options)) {
    if (options.length === 1) return options[0]
    const descLower = String(description || '').toLowerCase()
    const match = options.find((opt) => {
      const optWords = opt.toLowerCase().split(/\s+/).filter(Boolean)
      return optWords.length > 0 && optWords.every((word) => descLower.includes(word))
    })
    return match || options[0]
  }
  return typeof options === 'string' ? options : description
}

export async function copyTextToClipboard(text: string): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('No text to copy')

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(trimmed)
      return
    }
  } catch {
    // Fall through to the legacy DOM copy path and server fallback.
  }

  const textarea = document.createElement('textarea')
  textarea.value = trimmed
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  const copied = document.execCommand('copy')
  textarea.remove()

  if (copied) {
    return
  }

  const response = await fetch('/api/system/clipboard/copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: trimmed })
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `HTTP ${response.status}`)
  }
}

export async function copyTextToClipboardFast(text: string, timeoutMs = 250): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('No text to copy')

  const serverFallback = async () => {
    const response = await fetch('/api/system/clipboard/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed })
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || `HTTP ${response.status}`)
    }
  }

  const browserWrite = async () => {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(trimmed)
  }

  try {
    await Promise.race([
      browserWrite(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Clipboard browser write timed out')), timeoutMs))
    ])
    return
  } catch (err) {
    console.warn('Clipboard browser path failed, using server fallback:', err)
    const textarea = document.createElement('textarea')
    textarea.value = trimmed
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    const copied = document.execCommand('copy')
    textarea.remove()
    if (copied) return

    await serverFallback()
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function showSystemNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body })
  } catch {
    // Ignore notification construction failures.
  }
}



