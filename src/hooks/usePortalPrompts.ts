import React from 'react'
import { RcmActivity } from '../types'
import { usePortal } from '../context/PortalContext'
import { customFetch as fetch } from '../config/backend'

export function usePortalPrompts() {
  const {
    encounterInput,
    rcmResult,
    rowActions,
    showToast,
    setResubComments,
    resubComments,
    aiModel,
    aiProvider,
    setChatInputCount,
    setCurrentModelInUse,
    setChatStats
  } = usePortal()
  const [followUpReply, setFollowUpReply] = React.useState('')

  const handleAutoPrompt = async () => {
    const activityRows: RcmActivity[] = rcmResult?.Ok?.rcm?.flattened?.activity || []
    if (activityRows.length === 0) return showToast('Load an encounter first.', 'error')

    const startTime = Date.now()
    const toastId = 'auto-prompt'

    showToast({
      id: toastId,
      title: 'Auto-Prompt AI',
      message: `Generating clinical justifications via ${aiProvider === 'gemini' ? 'Gemini' : 'OpenRouter'} API (${aiModel})...`,
      tone: 'loading'
    })

    try {
      const response = await fetch('/api/prompt/auto-justify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounter: encounterInput.trim(),
          rowActions,
          provider: aiProvider,
          model: aiModel
        })
      })
      if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`)

      const daemonData = await response.json()
      if (!daemonData?.success || !daemonData?.responseText) {
        throw new Error('Failed to generate medical justification response.')
      }

      setResubComments(daemonData.responseText)
      setChatInputCount((prev) => prev + 1)
      setCurrentModelInUse(daemonData.model || aiModel)
      setChatStats({
        latencyMs: daemonData.latencyMs || 0,
        attempts: daemonData.attempts || 1,
        usage: daemonData.usage || null
      })

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const tokens = daemonData.usage
      const statsStr = tokens
        ? `\nLatency: ${elapsed}s | Tokens: ${tokens.total_tokens} (${tokens.prompt_tokens}p/${tokens.completion_tokens}c) | ${daemonData.model || aiModel}`
        : `\nLatency: ${elapsed}s | ${daemonData.model || aiModel}`

      showToast({
        id: toastId,
        title: 'AI Justification Captured',
        message: `Captured response pasted into comments!${statsStr}`,
        tone: 'ok',
        duration: 6000
      })
    } catch (e: any) {
      showToast({
        id: toastId,
        title: 'Auto-Prompt Failed',
        message: e.message || 'Auto prompt failed.',
        tone: 'error',
        duration: 6000
      })
    }
  }

  const handleSendFollowUpReply = async () => {
    const activityRows: RcmActivity[] = rcmResult?.Ok?.rcm?.flattened?.activity || []
    if (activityRows.length === 0) return showToast('Load an encounter first.', 'error')
    const reply = followUpReply.trim()
    if (!reply) return showToast('Enter a follow-up reply first.', 'error')
    if (!resubComments.trim()) return showToast('Generate an AI response first.', 'error')

    const startTime = Date.now()
    const toastId = 'auto-prompt'

    showToast({
      id: toastId,
      title: 'Chat Follow-up',
      message: 'Sending follow-up reply to AI...',
      tone: 'loading'
    })

    try {
      const response = await fetch('/api/gpt-follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: reply, provider: aiProvider, model: aiModel })
      })
      if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`)
      const data = await response.json()
      const updated = String(data?.responseText || '').trim()
      if (!updated) throw new Error('Empty response returned.')
      setResubComments(updated)
      setFollowUpReply('')
      setChatInputCount((prev) => prev + 1)
      setCurrentModelInUse(data.model || aiModel)
      setChatStats({
        latencyMs: data.latencyMs || 0,
        attempts: data.attempts || 1,
        usage: data.usage || null
      })

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const tokens = data.usage
      const statsStr = tokens
        ? `\nLatency: ${elapsed}s | Tokens: ${tokens.total_tokens} (${tokens.prompt_tokens}p/${tokens.completion_tokens}c) | ${data.model || aiModel}`
        : `\nLatency: ${elapsed}s | ${data.model || aiModel}`

      showToast({
        id: toastId,
        title: 'Follow-up Captured',
        message: `Follow-up response captured successfully!${statsStr}`,
        tone: 'ok',
        duration: 6000
      })
    } catch (e: any) {
      showToast({
        id: toastId,
        title: 'Follow-up Failed',
        message: e.message || 'Follow-up failed.',
        tone: 'error',
        duration: 6000
      })
    }
  }

  const handleFollowUpReplyChange = (value: string) => {
    setFollowUpReply(value)
  }

  const handleNewChat = async () => {
    const toastId = 'auto-prompt'
    showToast({
      id: toastId,
      title: 'Resetting Chat',
      message: 'Resetting chat session...',
      tone: 'loading'
    })
    try {
      const response = await fetch('/api/gpt-new-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_chat: true })
      })
      if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`)
      setChatInputCount(0)
      setCurrentModelInUse(null)
      setChatStats(null)
      showToast({
        id: toastId,
        title: 'Chat Reset',
        message: 'Chat session reset successfully.',
        tone: 'ok',
        duration: 4000
      })
    } catch (e: any) {
      showToast({
        id: toastId,
        title: 'Reset Failed',
        message: e.message || 'Reset failed.',
        tone: 'error',
        duration: 6000
      })
    }
  }

  const handleCopyPrompt = async () => {
    const activityRows: RcmActivity[] = rcmResult?.Ok?.rcm?.flattened?.activity || []
    if (activityRows.length === 0) return showToast('Load an encounter first.', 'error')

    const toastId = 'auto-prompt'
    showToast({
      id: toastId,
      title: 'Generating Prompt',
      message: 'Compiling clinical prompt payload...',
      tone: 'loading'
    })

    try {
      const response = await fetch('/api/generate-advanced-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounter: encounterInput.trim(),
          rowActions
        })
      })
      if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`)
      const data = await response.json()
      if (!data.prompt) throw new Error('Empty prompt returned.')
      await navigator.clipboard.writeText(data.prompt)
      showToast({
        id: toastId,
        title: 'Prompt Copied',
        message: 'Clinical prompt payload copied to clipboard!',
        tone: 'ok',
        duration: 4000
      })
    } catch (e: any) {
      showToast({
        id: toastId,
        title: 'Copy Failed',
        message: e.message || 'Failed to copy prompt.',
        tone: 'error',
        duration: 6000
      })
    }
  }

  return {
    handleAutoPrompt,
    handleCopyPrompt,
    handleNewChat,
    handleSendFollowUpReply,
    handleFollowUpReplyChange,
    followUpReply
  }
}
