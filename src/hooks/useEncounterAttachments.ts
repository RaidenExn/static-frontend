import { useState } from 'react'
import { customFetch as fetch } from '../config/backend'

interface UseEncounterAttachmentsProps {
  encounterInput: string
  showToast: (textOrPayload: any, tone?: string) => void
}

export function useEncounterAttachments({ encounterInput, showToast }: UseEncounterAttachmentsProps) {
  const [attachedFileBase64, setAttachedFileBase64] = useState<string>('')
  const [attachedFileName, setAttachedFileName] = useState<string>('')
  const [isSavingResub, setIsSavingResub] = useState<boolean>(false)
  const [serverAttachments, setServerAttachments] = useState<any[]>([])

  const fetchServerAttachments = async (enc: string) => {
    try {
      const res = await fetch(`/api/attachments?encounter=${encodeURIComponent(enc)}`)
      if (res.ok) {
        const data = await res.json()
        setServerAttachments(data || [])
      }
    } catch (e) {
      console.error('Failed to fetch server attachments:', e)
    }
  }

  const uploadFileToServer = async (fileName: string, base64: string, customToastId?: string) => {
    const enc = encounterInput.trim()
    if (!enc) {
      showToast('No active encounter loaded.', 'error')
      return
    }
    if (customToastId) {
      showToast({
        id: customToastId,
        title: '⚡ PDF Compression',
        message: `Uploading compressed PDF to server portfolio...`,
        tone: 'loading'
      })
    } else {
      showToast(`Uploading ${fileName} to server...`, 'loading')
    }
    try {
      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounter: enc,
          fileName,
          base64
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
      if (customToastId) {
        showToast({
          id: customToastId,
          title: '⚡ PDF Compression',
          message: `Uploaded compressed PDF to server portfolio successfully.`,
          tone: 'ok',
          duration: 6000
        })
      } else {
        showToast(`Uploaded ${fileName} to server portfolio successfully.`, 'ok')
      }
      fetchServerAttachments(enc)
    } catch (err: any) {
      if (customToastId) {
        showToast({
          id: customToastId,
          title: '❌ Upload Failed',
          message: `Failed to upload to server: ${err.message}`,
          tone: 'error',
          duration: 6000
        })
      } else {
        showToast(`Failed to upload to server: ${err.message}`, 'error')
      }
    }
  }

  const deleteServerAttachment = async (id: number) => {
    showToast('Deleting attachment from server...', 'loading')
    try {
      const res = await fetch(`/api/attachments?id=${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast('Attachment deleted from server portfolio.', 'ok')
      if (encounterInput.trim()) {
        fetchServerAttachments(encounterInput.trim())
      }
    } catch (err: any) {
      showToast(`Failed to delete from server: ${err.message}`, 'error')
    }
  }

  const exportZip = () => {
    const enc = encounterInput.trim()
    if (!enc) return showToast('Load an encounter first.', 'error')
    showToast('Compiling and downloading ZIP portfolio...', 'loading')
    const url = `/api/encounter/export?encounter=${encodeURIComponent(enc)}`
    window.open(url, '_blank')
    showToast('ZIP Portfolio compiled and downloaded.', 'ok')
  }

  return {
    attachedFileBase64,
    setAttachedFileBase64,
    attachedFileName,
    setAttachedFileName,
    isSavingResub,
    setIsSavingResub,
    serverAttachments,
    setServerAttachments,
    fetchServerAttachments,
    uploadFileToServer,
    deleteServerAttachment,
    exportZip
  }
}
