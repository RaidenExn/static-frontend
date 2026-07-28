import React, { useState } from 'react'
import { Tabs, Card, Box, Group, Paper, Text, Divider } from '@mantine/core'
import { LtChip } from '../shared_elements'
import {
  FileText,
  Clipboard,
  Clock,
  MessageSquare,
  Database,
  BookOpen,
  Settings,
  Layers,
  FileSpreadsheet,
  Sun,
  Moon,
  Cpu,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import PatientHeaderBanner from './PatientHeaderBanner'
import { LtInfoCard, LtIconButton } from '../shared_elements'
import EncounterActions from './EncounterActions'
import EncounterLoader from './EncounterLoader'
import SubmissionBadgeGroup from './SubmissionBadgeGroup'
import { usePortal } from '../context/PortalContext'

import { resolveClaimQueueStatus } from '../utils'

interface EncounterSearchProps {
  encounterInput: string
  setEncounterInput: (val: string) => void
  loading: boolean
  onLoadEncounter: (val?: string, mode?: 'force' | 'cache-first') => void
  onForceReload: () => void


  recentEncounters: string[]

  clearRecentEncounters: () => void
  resolvedEncounter: string
  patientName: string
  patientAge: string
  patientGender?: string
  doctorName: string
  encounterDate: string
  insuranceCardNo?: string
  insuranceCardNoSource?: string
  receiverName?: string
  payerName?: string
  networkName?: string
  expiryDate?: string
  resubmissionCount?: number
  claimHistory?: any[]
  submissionState?: { currentType: string; badgeColor: string; isFirstRA: boolean; isManual: boolean; manualCount: number; normalCount: number }
  activeTab: string
  onSelectTab: (id: string) => void
  showToast?: (text: string, tone: string) => void
  activityCount?: number
  visitCount?: number
  isPaperClaim?: boolean
  onDownloadXml: () => void
  dateEditMode: boolean
  setDateEditMode: (val: boolean) => void
  aiModel?: string
  setAiModel?: (val: string) => void
  aiProvider?: string
  setAiProvider?: (val: string) => void
  onOpenCeedValidator: () => void
  onAutoPrompt?: () => void
  onCopyPrompt?: () => void
  onNewChat?: () => void
}

export default function EncounterSearch({
  encounterInput,
  setEncounterInput,
  loading,
  onLoadEncounter,
  onForceReload,

  recentEncounters,

  clearRecentEncounters,
  resolvedEncounter,
  patientName,
  patientAge,
  patientGender = '-',
  doctorName,
  encounterDate,
  insuranceCardNo = '-',
  insuranceCardNoSource,
  receiverName = '-',
  payerName = '-',
  networkName = '-',
  expiryDate = '-',
  resubmissionCount = 0,
  claimHistory = [],
  submissionState,
  activeTab,
  onSelectTab,
  showToast,
  activityCount = 0,
  visitCount = 0,
  isPaperClaim = false,
  onDownloadXml,
  dateEditMode,
  setDateEditMode,
  aiModel = 'openrouter/auto',
  setAiModel,
  aiProvider = 'openrouter',
  setAiProvider,

  onOpenCeedValidator,
  onAutoPrompt,
  onCopyPrompt,
  onNewChat
}: EncounterSearchProps) {
  const { theme, toggleTheme, summaryResult, rcmResult, upstreamHealth } = usePortal()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const selected = summaryResult?.Ok?.selected || rcmResult?.Ok?.rcm?.selected
  const detail = rcmResult?.Ok?.rcm?.detail || {}
  const flattened = rcmResult?.Ok?.rcm?.flattened || {}
  const activeClaimHistory = detail.claimHistory || flattened.history || claimHistory || []
  const activityRows = detail.activityWiseStatus || flattened.activity || []

  const rawMpi = selected?.mpi || selected?.MPI || selected?.patient_mpi || '-'
  const rawApptStatus = selected?.appointment_status || selected?.app_status_desc || '-'

  const rawClaimQueueStatus = React.useMemo(() => {
    return resolveClaimQueueStatus({
      selected,
      rcm: rcmResult?.Ok?.rcm,
      claimHistory: activeClaimHistory,
      activities: activityRows,
      submissionState
    })
  }, [selected, rcmResult, activeClaimHistory, activityRows, submissionState])

  const handleCopyField = async (text: string, fieldKey: string, label: string) => {
    if (!text || text === '--' || text === 'None' || text === '-') return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldKey)
      setTimeout(() => setCopiedField(null), 1500)
      showToast?.(`Copied ${label}: "${text}"`, 'ok')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Card
      withBorder
      shadow="none"
      radius="sm"
      style={{
        backgroundColor: 'var(--bg-translucent)',
        backdropFilter: 'var(--backdrop-filter, blur(16px))',
        WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '10px'
      }}
    >
      {/* ROW 1: Patient & Encounter Metadata Strip (Delegated to PatientHeaderBanner) */}
      <PatientHeaderBanner
        isPaperClaim={isPaperClaim}
        resolvedEncounter={resolvedEncounter}
        patientName={patientName}
        patientAge={patientAge}
        patientGender={patientGender}
        doctorName={doctorName}
        encounterDate={encounterDate}
        insuranceCardNo={insuranceCardNo}
        insuranceCardNoSource={insuranceCardNoSource}
        receiverName={receiverName}
        payerName={payerName}
        networkName={networkName}
        expiryDate={expiryDate}
        resubmissionCount={resubmissionCount}
        claimHistory={claimHistory}
        copiedField={copiedField}
        onCopyField={handleCopyField}
        upstreamLatencyMs={upstreamHealth?.latencyMs}
        upstreamStatus={upstreamHealth?.status}
      />

      {/* ROW 2: Left Actions & Right Loader Controls inside native component form */}
      <Box
        component="form"
        id="encounterForm"
        onSubmit={(e) => {
          e.preventDefault()
          onLoadEncounter()
        }}
        style={{ display: 'flex', width: '100%', paddingLeft: '12px', paddingRight: '12px', boxSizing: 'border-box' }}
      >
        <Group justify="space-between" align="center" style={{ width: '100%', flexWrap: 'wrap', gap: '8px' }}>
          {/* Left Actions (Delegated to EncounterActions) */}
          <EncounterActions
            onDownloadXml={onDownloadXml}
            dateEditMode={dateEditMode}
            setDateEditMode={setDateEditMode}
            onForceReload={onForceReload}
            aiModel={aiModel}
            setAiModel={setAiModel}
            aiProvider={aiProvider}
            setAiProvider={setAiProvider}
            onOpenCeedValidator={onOpenCeedValidator}
            onAutoPrompt={onAutoPrompt}
            onCopyPrompt={onCopyPrompt}
            onNewChat={onNewChat}
          />

          {/* Right Loader Controls (Delegated to EncounterLoader) */}
          <EncounterLoader
            encounterInput={encounterInput}
            setEncounterInput={setEncounterInput}
            recentEncounters={recentEncounters}
            clearRecentEncounters={clearRecentEncounters}
            onLoadEncounter={onLoadEncounter}
            showToast={showToast}
          />

        </Group>
      </Box>

      {/* ROW 3: Embedded Compact Tabs & Status / Resubs Group */}
      <Group justify="space-between" align="center" wrap="nowrap" px="xs" w="100%">
        <Tabs value={activeTab} onChange={(val) => val && onSelectTab(val)} style={{ flex: 1, minWidth: 0 }}>
          <Tabs.List style={{ border: 'none', backgroundColor: 'transparent', flexWrap: 'nowrap', overflowX: 'auto' }}>
            {(
              [
                { id: 'summary', label: 'Summary', icon: FileText },
                { id: 'activity', label: 'Activity Wise Status', icon: Clipboard, count: activityCount },
                { id: 'visit', label: 'Visit History', icon: Clock, count: visitCount },
                { id: 'prompt', label: 'Prompt', icon: MessageSquare },
                { id: 'storage', label: 'Storage', icon: Database },
                { id: 'logs', label: 'System Logs', icon: BookOpen },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'bulk', label: 'Bulk Operations', icon: Layers },
                { id: 'workshop', label: 'Excel Workshop', icon: FileSpreadsheet }
              ] as const
            ).map((tab) => {
              const IconComponent = tab.icon
              return (
                <Tabs.Tab
                  key={tab.id}
                  value={tab.id}
                  leftSection={<IconComponent size={12} />}
                  h={32}
                  px="xs"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Group gap={4} align="center" wrap="nowrap">
                    <Text size="xs" fw={600}>{tab.label}</Text>
                    {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                      <LtChip color="gray" size="xs" style={{ height: 14, padding: '0 4px', fontSize: 9 }}>
                        {tab.count}
                      </LtChip>
                    )}
                  </Group>
                </Tabs.Tab>
              )
            })}
          </Tabs.List>
        </Tabs>

        {/* Status Card, Resubs indicator, CEED, Theme Switcher */}
        <Box style={{ flexShrink: 0 }} pl="xs">
          <Group gap="xs" align="center" wrap="nowrap">
            {/* Outlined status card with MPI, Appointment Status, Claim Queue */}
            <LtInfoCard height={28} style={{ width: 'auto' }}>
              <Group gap="xs" align="center" wrap="nowrap">
                <Text size="xs" fw={400} style={{ whiteSpace: 'nowrap' }}>
                  MPI:{' '}
                  <Text component="span" fw={600}>
                    {rawMpi}
                  </Text>
                </Text>

                <Divider orientation="vertical" h={14} opacity={0.5} />

                <Text size="xs" fw={400} style={{ whiteSpace: 'nowrap' }}>
                  Appointment Status:{' '}
                  <Text component="span" fw={600}>
                    {rawApptStatus}
                  </Text>
                </Text>

                <Divider orientation="vertical" h={14} opacity={0.5} />

                <Text size="xs" fw={400} style={{ whiteSpace: 'nowrap' }}>
                  Claim Queue:{' '}
                  <Text component="span" fw={600}>
                    {rawClaimQueueStatus}
                  </Text>
                </Text>
              </Group>
            </LtInfoCard>

            <SubmissionBadgeGroup
              isPaperClaim={isPaperClaim}
              resubmissionCount={resubmissionCount}
              claimHistory={claimHistory}
              submissionState={submissionState}
            />
            <LtIconButton
              icon={Cpu}
              onClick={onOpenCeedValidator}
              variant="light"
              color="cyan"
              size="sm"
              tooltip="Open CEED Rules Engine & Validation Suite"
            />

            <LtIconButton
              icon={theme === 'dark' ? Sun : Moon}
              onClick={toggleTheme}
              variant="subtle"
              color="gray"
              size="sm"
              tooltip={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            />
          </Group>
        </Box>
      </Group>
    </Card>
  )
}
