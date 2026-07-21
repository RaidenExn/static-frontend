import React, { useEffect, useRef } from 'react'
import { Card, Group, Text, Select, Switch, Button, TextInput, Textarea, Stack } from '@mantine/core'
import { Zap } from 'lucide-react'
import ResubmissionShimmer from './ResubmissionShimmer'
import ResubmissionPdfSection from './ResubmissionPdfSection'

interface RaFile {
  id: string
  name: string
}

interface ResubmissionTabProps {
  onAutoPrompt?: () => void
  loading?: boolean
  canSaveResubmission: boolean
  canSaveRaRemarks: boolean
  resubmitType: string
  setResubmitType: (val: string) => void
  selectedRaFileId: string
  setSelectedRaFileId: (val: string) => void
  raFilesList: RaFile[]
  onAttachSummary?: () => void
  attachedFileName: string
  attachedFileBase64?: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  resubComments: string
  setResubComments: (val: string) => void
  isSavingResub: boolean
  onSaveResubmissionAndUpload: () => void
  onClearResubmission: () => void
  followUpReply: string
  onFollowUpReplyChange: (val: string) => void
  onSendFollowUpReply: () => void
  onRemoveAttachment?: () => void
  showToast?: (text: string, tone: string) => void
  serverAttachments?: any[]
  onDeleteServerAttachment: (id: number) => void
  suggestions?: string[]
  autoAttachSummary: boolean
  setAutoAttachSummary: (val: boolean) => void
  allActivitiesWriteOff: boolean
  adaptiveCardColors?: boolean
  submissionStateColor?: string
}

export default function ResubmissionTab({
  onAutoPrompt,
  loading,
  canSaveResubmission,
  canSaveRaRemarks,
  resubmitType,
  setResubmitType,
  selectedRaFileId,
  setSelectedRaFileId,
  raFilesList,
  onAttachSummary,
  attachedFileName,
  attachedFileBase64,
  fileInputRef,
  onFileChange,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  resubComments,
  setResubComments,
  isSavingResub,
  onSaveResubmissionAndUpload,
  onClearResubmission,
  followUpReply,
  onFollowUpReplyChange,
  onSendFollowUpReply,
  onRemoveAttachment,
  showToast,
  serverAttachments = [],
  onDeleteServerAttachment,
  suggestions = [],
  autoAttachSummary,
  setAutoAttachSummary,
  allActivitiesWriteOff,
  adaptiveCardColors = true,
  submissionStateColor = 'gray'
}: ResubmissionTabProps) {
  const resubCommentsRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = resubCommentsRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [resubComments])

  const handlePaste = async () => {
    try {
      let text = ''
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText()
      } else {
        text =
          window.prompt(
            'Your browser restricts clipboard access on insecure (HTTP) connections. Please paste the comments here:'
          ) || ''
      }
      if (text.trim()) {
        setResubComments(text.trim())
        showToast?.('Pasted comments from clipboard!', 'ok')
      } else {
        showToast?.('Clipboard is empty.', 'warning')
      }
    } catch (err) {
      console.error('Failed to read clipboard: ', err)
      showToast?.('Clipboard permission denied or failed.', 'error')
    }
  }

  const seenRaIds = new Set<string>()
  const raFileSelectData = raFilesList
    .filter((file) => {
      const fileIdStr = String(file.id)
      if (seenRaIds.has(fileIdStr)) return false
      seenRaIds.add(fileIdStr)
      return true
    })
    .map((file) => ({ value: String(file.id), label: file.name }))

  const adaptiveStyles = React.useMemo(() => {
    if (!adaptiveCardColors || submissionStateColor === 'gray') {
      return {
        bg: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
        border: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
      }
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

    const colors: Record<string, { lightBg: string; lightBorder: string; darkBg: string; darkBorder: string }> = {
      blue: {
        lightBg: 'rgba(231, 245, 255, 0.58)',
        lightBorder: 'rgba(51, 154, 240, 0.32)',
        darkBg: 'rgba(24, 100, 171, 0.16)',
        darkBorder: 'rgba(51, 154, 240, 0.38)'
      },
      teal: {
        lightBg: 'rgba(224, 242, 241, 0.58)',
        lightBorder: 'rgba(13, 148, 136, 0.32)',
        darkBg: 'rgba(13, 148, 136, 0.16)',
        darkBorder: 'rgba(13, 148, 136, 0.38)'
      },
      indigo: {
        lightBg: 'rgba(237, 242, 255, 0.58)',
        lightBorder: 'rgba(92, 124, 250, 0.32)',
        darkBg: 'rgba(54, 79, 199, 0.16)',
        darkBorder: 'rgba(92, 124, 250, 0.38)'
      },
      orange: {
        lightBg: 'rgba(255, 244, 230, 0.58)',
        lightBorder: 'rgba(253, 126, 20, 0.32)',
        darkBg: 'rgba(232, 114, 0, 0.16)',
        darkBorder: 'rgba(253, 126, 20, 0.38)'
      },
      red: {
        lightBg: 'rgba(255, 235, 235, 0.58)',
        lightBorder: 'rgba(250, 82, 82, 0.32)',
        darkBg: 'rgba(201, 42, 42, 0.16)',
        darkBorder: 'rgba(250, 82, 82, 0.38)'
      }
    }

    const set = colors[submissionStateColor] || colors.blue
    return {
      bg: isDark ? set.darkBg : set.lightBg,
      border: `1px solid ${isDark ? set.darkBorder : set.lightBorder}`
    }
  }, [adaptiveCardColors, submissionStateColor])

  return (
    <Card
      withBorder
      radius="sm"
      padding="md"
      style={{
        backgroundColor: adaptiveStyles.bg,
        backdropFilter: 'var(--backdrop-filter, blur(16px))',
        WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
        border: adaptiveStyles.border,
        opacity: allActivitiesWriteOff ? 0.45 : 1,
        pointerEvents: allActivitiesWriteOff ? 'none' : 'auto',
        filter: allActivitiesWriteOff ? 'grayscale(100%)' : 'none',
        transition: 'all 0.2s ease'
      }}
    >
      <Group
        justify="space-between"
        align="center"
        wrap="nowrap"
        style={{
          borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.05))',
          paddingBottom: '10px',
          marginBottom: '12px',
          width: '100%'
        }}
      >
        <Group gap="xs" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Text size="sm" fw={800} tt="uppercase" style={{ letterSpacing: '0.5px' }} c="var(--mantine-color-text)">
            Write Resub
          </Text>
          {onAutoPrompt && (
            <Button
              id="duplicateAutoPromptButton"
              type="button"
              size="xs"
              variant="filled"
              leftSection={<Zap style={{ width: 14, height: 14 }} />}
              onClick={onAutoPrompt}
              title="Send prompt to extension, submit automatically, and paste response here"
              aria-label="Send prompt automatically"
            >
              Auto Prompt
            </Button>
          )}
          {!loading && (
            <Select
              value={resubmitType}
              onChange={(val) => setResubmitType(val || '2')}
              disabled={!canSaveResubmission}
              data={[
                { value: '2', label: 'Internal Complaints' },
                { value: '1', label: 'Correction' },
                { value: '3', label: 'Reconciliation' }
              ]}
              size="xs"
              styles={{
                input: {
                  height: '28px',
                  fontSize: 'var(--mantine-font-size-sm)',
                  width: '160px',
                  backgroundColor: resubmitType === '1' ? 'rgba(253, 126, 20, 0.12)' : undefined,
                  borderColor: resubmitType === '1' ? 'var(--mantine-color-orange-filled, #fd7e14)' : undefined,
                  color: resubmitType === '1' ? 'var(--mantine-color-orange-filled, #fd7e14)' : undefined,
                  fontWeight: resubmitType === '1' ? 800 : undefined,
                  transition: 'all 0.2s ease'
                }
              }}
            />
          )}
        </Group>
        {!loading && (
          <Select
            placeholder="Select RA File"
            value={selectedRaFileId}
            onChange={(val) => setSelectedRaFileId(val || '')}
            disabled={!canSaveResubmission || raFilesList.length === 0}
            data={raFileSelectData}
            size="xs"
            styles={{ input: { height: '28px', fontSize: 'var(--mantine-font-size-sm)' } }}
            style={{ flex: 1, minWidth: '200px' }}
          />
        )}
      </Group>

      {loading ? (
        <ResubmissionShimmer />
      ) : (
        <Stack gap="sm">
          <Group gap="xs" align="center" wrap="nowrap" style={{ width: '100%' }}>
            <ResubmissionPdfSection
              canSaveResubmission={canSaveResubmission}
              isDragOver={isDragOver}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              fileInputRef={fileInputRef}
              onFileChange={onFileChange}
              attachedFileName={attachedFileName}
              attachedFileBase64={attachedFileBase64}
              serverAttachments={serverAttachments}
              onRemoveAttachment={onRemoveAttachment}
            />

            <Group gap="xs" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
              <Switch
                label={
                  <Text size="sm" fw={600} style={{ color: 'var(--muted)', cursor: 'pointer' }}>
                    Auto summary
                  </Text>
                }
                size="xs"
                checked={autoAttachSummary}
                onChange={(e) => setAutoAttachSummary(e.target.checked)}
                title="Automatically pre-fetch and merge/attach clinical summary PDF"
              />

              {onAttachSummary && (
                <Button
                  onClick={onAttachSummary}
                  variant="subtle"
                  size="xs"
                  disabled={!canSaveResubmission}
                  style={{ height: '28px', padding: '0 8px', fontSize: 'var(--mantine-font-size-xs)' }}
                  title="Get the encounter's summary PDF and auto attach it"
                >
                  Attach Summary
                </Button>
              )}

              <Button
                onClick={handlePaste}
                variant="subtle"
                size="xs"
                disabled={!canSaveResubmission && !canSaveRaRemarks}
                style={{ height: '28px', padding: '0', width: '28px', minWidth: '28px' }}
                title="Paste clipboard text into Comments"
              >
                📋
              </Button>
            </Group>
          </Group>

          <Stack gap={6}>
            {suggestions.length > 0 && (
              <Group
                gap="xs"
                style={{
                  backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
                  border: '1px dashed var(--line, rgba(255,255,255,0.05))',
                  borderRadius: 'var(--mantine-radius-sm)',
                  padding: '6px 12px',
                  marginBottom: '4px'
                }}
              >
                <Text size="xs" fw={600} style={{ color: 'var(--muted)' }}>
                  Suggestions:
                </Text>
                {suggestions.map((sug) => {
                  const isAlreadyAdded = resubComments.includes(sug)
                  return (
                    <Button
                      key={sug}
                      size="xs"
                      variant={isAlreadyAdded ? 'subtle' : 'light'}
                      color={isAlreadyAdded ? 'gray' : 'dark'}
                      onClick={() => {
                        if (isAlreadyAdded) return
                        const updated = resubComments.trim() ? `${resubComments.trim()} ${sug}` : sug
                        setResubComments(updated)
                      }}
                      disabled={isAlreadyAdded}
                      style={{
                        fontSize: 'var(--mantine-font-size-xs)',
                        fontWeight: 600,
                        padding: '4px 8px',
                        height: '24px',
                        minHeight: '0',
                        opacity: isAlreadyAdded ? 0.6 : 1,
                        transition: 'all 0.15s ease'
                      }}
                      title={isAlreadyAdded ? 'Already added to comments' : 'Click to add comment'}
                    >
                      {sug} {isAlreadyAdded && '✓'}
                    </Button>
                  )
                })}
              </Group>
            )}

            <Textarea
              ref={resubCommentsRef as any}
              minRows={2}
              autosize
              placeholder="Enter comments..."
              value={resubComments}
              onChange={(e) => setResubComments(e.target.value)}
              disabled={!canSaveResubmission}
              styles={{
                input: {
                  fontSize: 'var(--mantine-font-size-sm)',
                  marginTop: '4px',
                  backgroundColor: 'var(--panel-soft, rgba(0,0,0,0.02))',
                  color: 'var(--ink)'
                }
              }}
            />
          </Stack>

          <Group gap="xs" justify="flex-end" style={{ marginTop: '8px', width: '100%' }}>
            <TextInput
              value={followUpReply}
              onChange={(e) => onFollowUpReplyChange(e.target.value)}
              disabled={!canSaveResubmission}
              placeholder="Type a follow-up reply for the AI..."
              style={{ flex: 1 }}
              styles={{
                input: {
                  height: '36px',
                  fontSize: 'var(--mantine-font-size-sm)',
                  backgroundColor: 'var(--panel-soft, rgba(0,0,0,0.02))'
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onSendFollowUpReply()
                }
              }}
            />
            <Button
              onClick={onSendFollowUpReply}
              disabled={!canSaveResubmission || !followUpReply.trim()}
              style={{ height: '36px', fontSize: 'var(--mantine-font-size-sm)', padding: '0 16px' }}
            >
              Send
            </Button>
            <Button
              onClick={onClearResubmission}
              variant="light"
              color="gray"
              disabled={isSavingResub || !canSaveResubmission}
              style={{ height: '36px', fontSize: 'var(--mantine-font-size-sm)', padding: '0 16px' }}
            >
              Clear
            </Button>
            <Button
              onClick={onSaveResubmissionAndUpload}
              disabled={isSavingResub || !canSaveResubmission}
              className="rcm-save-resub"
              style={{ height: '36px', fontSize: 'var(--mantine-font-size-sm)', padding: '0 32px', flex: '0 0 auto' }}
            >
              {isSavingResub ? 'Saving...' : 'Save/Update'}
            </Button>
          </Group>
        </Stack>
      )}
    </Card>
  )
}
