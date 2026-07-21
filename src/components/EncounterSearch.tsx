import React, { useState } from 'react'
import { Tabs, Card, Box, Group, Badge, ActionIcon, Tooltip } from '@mantine/core'
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
import EncounterActions from './EncounterActions'
import EncounterLoader from './EncounterLoader'
import SubmissionBadgeGroup from './SubmissionBadgeGroup'
import { usePortal } from '../context/PortalContext'

interface EncounterSearchProps {
  encounterInput: string
  setEncounterInput: (val: string) => void
  loading: boolean
  onLoadEncounter: (val?: string) => void
  onForceReload: () => void
  onAutoPrompt: () => void
  onCopyPrompt: () => void
  onNewChat?: () => void

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
  chatInputCount?: number
  currentModelInUse?: string | null
  chatStats?: {
    latencyMs: number
    attempts: number
    usage: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    } | null
  } | null
  onOpenCeedValidator: () => void
}

export default function EncounterSearch({
  encounterInput,
  setEncounterInput,
  loading,
  onLoadEncounter,
  onForceReload,
  onAutoPrompt,
  onCopyPrompt,
  onNewChat,

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
  chatInputCount = 0,
  currentModelInUse = null,
  chatStats = null,
  onOpenCeedValidator
}: EncounterSearchProps) {
  const { theme, toggleTheme } = usePortal()
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
        gap: '4px',
        width: '100%',
        boxSizing: 'border-box',
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: '2px',
        paddingBottom: '2px'
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
            onCopyPrompt={onCopyPrompt}
            onNewChat={onNewChat}
            aiModel={aiModel}
            setAiModel={setAiModel}
            aiProvider={aiProvider}
            setAiProvider={setAiProvider}
            chatInputCount={chatInputCount}
            currentModelInUse={currentModelInUse}
            chatStats={chatStats}
            onAutoPrompt={onAutoPrompt}
            onOpenCeedValidator={onOpenCeedValidator}
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

      {/* ROW 3: Embedded Compact Tabs & Resubs Badge Group (On the same line!) */}
      <Group
        justify="space-between"
        align="center"
        wrap="nowrap"
        style={{
          paddingLeft: '12px',
          paddingRight: '12px',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <Tabs value={activeTab} onChange={(val) => val && onSelectTab(val)} style={{ flex: 1, minWidth: 0 }}>
          <Tabs.List
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
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
                // { id: 'afm', label: 'Apple Intelligence', icon: Sparkles }
              ] as const
            ).map((tab) => {
              const IconComponent = tab.icon
              return (
                <Tabs.Tab
                  key={tab.id}
                  value={tab.id}
                  leftSection={<IconComponent style={{ width: 12, height: 12 }} />}
                  style={{ whiteSpace: 'nowrap', padding: '6px 12px', height: '32px' }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: 'var(--mantine-font-size-xs)'
                    }}
                  >
                    {tab.label}
                    {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                      <Badge color="gray" size="xs" style={{ height: '14px', fontSize: '9px', padding: '0 4px' }}>
                        {tab.count}
                      </Badge>
                    )}
                  </span>
                </Tabs.Tab>
              )
            })}
          </Tabs.List>
        </Tabs>

        {/* Resubs indicator moved dynamically to this row, alongside theme switcher */}
        <Box style={{ flexShrink: 0, paddingLeft: '8px' }}>
          <Group gap="xs" align="center" wrap="nowrap">
            <SubmissionBadgeGroup
              isPaperClaim={isPaperClaim}
              resubmissionCount={resubmissionCount}
              claimHistory={claimHistory}
              submissionState={submissionState}
            />
            <Tooltip label="Open CEED Rules Engine & Validation Suite" position="top" withArrow>
              <ActionIcon
                onClick={onOpenCeedValidator}
                variant="light"
                color="cyan"
                size="sm"
                aria-label="Open CEED Validator"
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Cpu style={{ width: 14, height: 14 }} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} position="top" withArrow>
              <ActionIcon
                onClick={toggleTheme}
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Toggle theme mode"
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                {theme === 'dark' ? (
                  <Sun style={{ width: 14, height: 14 }} />
                ) : (
                  <Moon style={{ width: 14, height: 14 }} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>
      </Group>
    </Card>
  )
}
