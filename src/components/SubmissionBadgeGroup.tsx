import React from 'react'
import { Group, Badge, Text, Tooltip } from '@mantine/core'

interface SubmissionBadgeGroupProps {
  isPaperClaim?: boolean
  resubmissionCount?: number
  claimHistory?: any[]
  submissionState?: { currentType: string; badgeColor: string; isFirstRA: boolean; isManual: boolean; manualCount: number; normalCount: number }
}

export default function SubmissionBadgeGroup({
  isPaperClaim = false,
  resubmissionCount = 0,
  claimHistory = [],
  submissionState
}: SubmissionBadgeGroupProps) {
  const [hovered, setHovered] = React.useState(false)

  const { currentType, badgeColor, isFirstRA, isManual, manualCount, normalCount } = submissionState || { currentType: 'No Sub', badgeColor: 'gray', isFirstRA: false, isManual: false, manualCount: 0, normalCount: 0 }

  // Format manual submission text string (e.g. "M", "2xM", "3xM")
  const manualText = manualCount === 1 ? 'M' : `${manualCount}xM`

  return (
    <Tooltip label={`Submission State: ${currentType}`} openDelay={0} closeDelay={0}>
      <Group
        className="submission-badge-group"
        gap="xs"
        align="center"
        wrap="nowrap"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: isFirstRA
            ? hovered
              ? '1px solid rgba(13, 148, 136, 0.45)'
              : '1px solid rgba(13, 148, 136, 0.25)'
            : '1px solid var(--line, rgba(255, 255, 255, 0.05))',
          backgroundColor: isFirstRA
            ? hovered
              ? 'var(--panel-soft, rgba(13, 148, 136, 0.14))'
              : 'var(--panel-soft, rgba(13, 148, 136, 0.08))'
            : 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
          borderRadius: 'var(--mantine-radius-default, var(--mantine-radius-sm, 4px))',
          height: '28px',
          padding: '0 10px',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'inline-flex',
          transform: hovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          verticalAlign: 'middle',
          boxShadow: isFirstRA
            ? hovered
              ? '0 4px 12px rgba(13, 148, 136, 0.3), 0 0 10px rgba(13, 148, 136, 0.25)'
              : '0 1px 3px rgba(13, 148, 136, 0.15), 0 0 4px rgba(13, 148, 136, 0.08)'
            : hovered
              ? '0 4px 12px var(--shadow-color, rgba(0,0,0,0.1))'
              : 'none',
          margin: '0'
        }}
      >
        {/* A. Manual Submission Indicator ("M" Badge) */}
        {isManual && (
          <Tooltip label={`Encounter submitted manually ${manualCount} time(s)`} openDelay={0} closeDelay={0}>
            <Badge
              color="red"
              variant="light"
              size="xs"
              style={{
                height: '16px',
                fontSize: 'var(--mantine-font-size-xs)',
                padding: '0 6px',
                fontWeight: 800,
                textTransform: 'uppercase',
                borderRadius: 'var(--mantine-radius-default, var(--mantine-radius-sm, 4px))'
              }}
            >
              {manualText}
            </Badge>
          </Tooltip>
        )}

        {/* Sleek Vertical Divider if both badges exist */}
        {isManual && (
          <div
            style={{
              width: '1px',
              height: '12px',
              backgroundColor: isFirstRA ? 'rgba(13, 148, 136, 0.25)' : 'var(--line)',
              opacity: 0.7
            }}
          />
        )}

        {/* B. Resubmission Count Badge */}
        <Tooltip label={`Normal Resubmission Count: ${normalCount}`} openDelay={0} closeDelay={0}>
          <Badge
            color={badgeColor}
            variant="filled"
            size="xs"
            style={{
              height: '16px',
              minWidth: '16px',
              fontSize: 'var(--mantine-font-size-xs)',
              fontWeight: 700,
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {normalCount}
          </Badge>
        </Tooltip>

        {/* C. Bold Status Label Text */}
        <Tooltip label={`Encounter Submission State: ${currentType}`} openDelay={0} closeDelay={0}>
          <Text
            size="xs"
            fw={800}
            c={badgeColor}
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: '1',
              fontSize: 'var(--mantine-font-size-xs)'
            }}
          >
            {currentType}
          </Text>
        </Tooltip>
      </Group>
    </Tooltip>
  )
}
