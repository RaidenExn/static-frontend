import React, { useEffect } from 'react'
import ResubmissionTab from './rcm/ResubmissionTab'
import RaRemarksTab from './rcm/RaRemarksTab'
import WriteOffTab from './rcm/WriteOffTab'

interface RaFile {
  id: string
  name: string
}

interface RcmActionCenterProps {
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
  raRemarks: string
  setRaRemarks: (val: string) => void
  autoCopyRaRemarks: boolean
  setAutoCopyRaRemarks: (val: boolean) => void
  isSavingRaRemarks: boolean
  onSaveRaRemarks: () => void
  onClearRaRemarks: () => void
  writeOffRemarks: string
  setWriteOffRemarks: (val: string) => void
  isSavingWriteOff: boolean
  onSaveWriteOff: () => void
  onClearWriteOff: () => void
  doubleAccumulationMode: boolean
  setDoubleAccumulationMode: (val: boolean) => void
  grossResub: number
  grossWriteOff: number
  pendingResub: number
  pendingWriteOff: number
  preExistingWriteOff: number
  hasExistingReason: boolean
  showToast?: (text: string, tone: string) => void
  serverAttachments: any[]
  onDeleteServerAttachment: (id: number) => void
  suggestions?: string[]
  autoTransferToRaRemarks: boolean
  setAutoTransferToRaRemarks: (val: boolean) => void
  hasPreExistingRemarksOrComments: boolean
  autoAttachSummary: boolean
  setAutoAttachSummary: (val: boolean) => void
  allActivitiesWriteOff: boolean
  adaptiveCardColors?: boolean
  submissionStateColor?: string
}

export default function RcmActionCenter(props: RcmActionCenterProps) {
  const {
    loading,
    selectedRaFileId,
    raFilesList,
    setSelectedRaFileId,
    canSaveResubmission,
    pendingWriteOff,
    allActivitiesWriteOff
  } = props

  // Rule: automatically select the Associated RA File when loading a claim.
  useEffect(() => {
    if (!selectedRaFileId && raFilesList.length > 0) {
      setSelectedRaFileId(raFilesList[0].id)
    }
  }, [selectedRaFileId, raFilesList, setSelectedRaFileId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
      {/* Card 1: Write Resubmission */}
      <ResubmissionTab {...props} allActivitiesWriteOff={allActivitiesWriteOff} />

      {/* Card 2: Write RA Remarks */}
      <RaRemarksTab
        loading={loading}
        canSaveRaRemarks={props.canSaveRaRemarks}
        grossResub={props.grossResub}
        grossWriteOff={props.grossWriteOff}
        pendingResub={props.pendingResub}
        pendingWriteOff={props.pendingWriteOff}
        raRemarks={props.raRemarks}
        setRaRemarks={props.setRaRemarks}
        autoCopyRaRemarks={props.autoCopyRaRemarks}
        setAutoCopyRaRemarks={props.setAutoCopyRaRemarks}
        isSavingRaRemarks={props.isSavingRaRemarks}
        onSaveRaRemarks={props.onSaveRaRemarks}
        onClearRaRemarks={props.onClearRaRemarks}
        autoTransferToRaRemarks={props.autoTransferToRaRemarks}
        setAutoTransferToRaRemarks={props.setAutoTransferToRaRemarks}
        hasPreExistingRemarksOrComments={props.hasPreExistingRemarksOrComments}
      />

      {/* Card 3: Write off remarks */}
      <WriteOffTab
        loading={loading}
        writeOffRemarks={props.writeOffRemarks}
        setWriteOffRemarks={props.setWriteOffRemarks}
        isSavingWriteOff={props.isSavingWriteOff}
        onSaveWriteOff={props.onSaveWriteOff}
        onClearWriteOff={props.onClearWriteOff}
        pendingWriteOff={pendingWriteOff}
      />
    </div>
  )
}
