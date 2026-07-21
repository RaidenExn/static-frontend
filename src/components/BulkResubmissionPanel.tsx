import React from 'react'
import { Card, Text, Group, Stack, Stepper, Badge } from '@mantine/core'
import { RefreshCw } from 'lucide-react'
import { useBulkResubmission } from './bulk/hooks/useBulkResubmission'
import { BulkParseStep } from './bulk/BulkParseStep'
import { BulkPreviewStep } from './bulk/BulkPreviewStep'
import { BulkQueueConsole } from './bulk/BulkQueueConsole'
import { ExportProgressModal } from './bulk/ExportProgressModal'

interface BulkResubmissionPanelProps {
  active: boolean
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function BulkResubmissionPanel({ active, showToast }: BulkResubmissionPanelProps) {
  if (!active) return null

  const {
    step,
    setStep,
    inputText,
    setInputText,
    encounters,
    isExporting,
    isUploading,
    collectFromStorage,
    setCollectFromStorage,
    exportProgress,
    isExportProgressModalOpen,
    rows,
    errors,
    isProcessing,
    progress,
    processLogs,
    logTerminalEndRef,
    handleExportTemplate,
    handleForceResubmit,
    handleFileUpload,
    handleStartProcessing,
    resetState
  } = useBulkResubmission(showToast)

  return (
    <Card withBorder padding="md">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-wait {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.98); }
        }
        .shimmer-progress {
          background: linear-gradient(90deg, var(--accent) 0%, #60a5fa 50%, var(--accent) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        .pulse-waiting {
          animation: pulse-wait 1.8s infinite ease-in-out;
        }
        .sleek-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .sleek-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 4px;
        }
        .sleek-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }
        .sleek-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .preview-table-row:hover {
          background-color: var(--panel-soft) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.03);
        }
        .stat-card {
          flex: 1;
          min-width: 140px;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: var(--border-radius);
          padding: 14px 18px;
          transition: all 0.25s ease;
        }
        .stat-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <RefreshCw size={20} color="var(--mantine-color-blue-filled)" />
            <Text fw={700} size="sm" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Bulk Resubmission Center
            </Text>
          </Group>
          <Stepper active={step - 1} size="xs" allowNextStepsSelect={false}>
            <Stepper.Step label="Paste & Export" />
            <Stepper.Step label="Visual Preview" />
            <Stepper.Step label="Execution" />
          </Stepper>
        </Group>

        {/* STEP 1: Paste & Export */}
        {step === 1 && (
          <BulkParseStep
            inputText={inputText}
            setInputText={setInputText}
            encountersCount={encounters.length}
            collectFromStorage={collectFromStorage}
            setCollectFromStorage={setCollectFromStorage}
            isExporting={isExporting}
            handleExportTemplate={handleExportTemplate}
            isProcessing={isProcessing}
            handleForceResubmit={handleForceResubmit}
            isUploading={isUploading}
            handleFileUpload={handleFileUpload}
          />
        )}

        {/* STEP 2: Live Preview */}
        {step === 2 && (
          <BulkPreviewStep
            rows={rows}
            errors={errors}
            setStep={setStep}
            handleStartProcessing={handleStartProcessing}
          />
        )}

        {/* STEP 3: Progress & SSE Console */}
        {step === 3 && (
          <BulkQueueConsole
            progress={progress}
            processLogs={processLogs}
            isProcessing={isProcessing}
            logTerminalEndRef={logTerminalEndRef}
            resetState={resetState}
          />
        )}

        {/* Clean Minimalist Export Progress Modal */}
        <ExportProgressModal isOpen={isExportProgressModalOpen} progress={exportProgress} />
      </Stack>
    </Card>
  )
}
