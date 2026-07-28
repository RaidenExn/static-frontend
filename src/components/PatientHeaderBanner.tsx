import React from 'react'
import { Group, Text, Badge, Box, Grid, Divider } from '@mantine/core'
import { Copy, Check } from 'lucide-react'
import { LtInfoCard, LtTooltip } from '../shared_elements'

interface PatientHeaderBannerProps {
  isPaperClaim?: boolean
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
  copiedField: string | null
  onCopyField: (_text: string, fieldKey: string, label: string) => void
  upstreamLatencyMs?: number
  upstreamStatus?: 'ultra-fast' | 'healthy' | 'congested' | 'degraded'
  upstreamProtocol?: string
  upstreamConcurrency?: number
}

export default function PatientHeaderBanner({
  isPaperClaim = false,
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
  copiedField,
  onCopyField,
  upstreamLatencyMs,
  upstreamStatus = 'healthy',
  upstreamProtocol = 'HTTP/2',
  upstreamConcurrency = 4
}: PatientHeaderBannerProps) {
  let latencyBadgeColor = 'teal'
  let latencyDot = '🟢'
  if (upstreamStatus === 'degraded' || (upstreamLatencyMs && upstreamLatencyMs >= 1200)) {
    latencyBadgeColor = 'red'
    latencyDot = '🔴'
  } else if (upstreamStatus === 'congested' || (upstreamLatencyMs && upstreamLatencyMs >= 500)) {
    latencyBadgeColor = 'orange'
    latencyDot = '🟡'
  }

  // Determine gender display and label with a defensive fallback
  const rawGender = patientGender && patientGender !== '-' ? patientGender.trim() : 'Unknown'
  const genderDisplay = rawGender ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase() : 'Unknown'
  const genderLower = genderDisplay.trim().toLowerCase()

  let genderColor = 'gray'
  if (genderLower.startsWith('f')) {
    genderColor = 'pink'
  } else if (genderLower.startsWith('m')) {
    genderColor = 'blue'
  }

  return (
    <Box w="100%" p={0}>
      <Grid w="100%" m={0} {...({ gutter: 'xs' } as any)}>
        {/* SUBSECTION 1: PATIENT SECTION (Patient name, age, gender) */}
        <Grid.Col span={{ base: 12, md: 3.5 }}>
          <LtInfoCard height={38}>
            <Group gap="xs" align="center" justify="space-between" w="100%" wrap="nowrap">
              {/* Patient Name */}
              <Box style={{ flexGrow: 1, minWidth: 0 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Patient
                </Text>
                <Text size="xs" fw={700} truncate mt={1}>
                  {patientName || '--'}
                </Text>
              </Box>

              <Divider orientation="vertical" h={18} opacity={0.5} />

              {/* Patient Age */}
              <Box style={{ flexShrink: 0 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Age
                </Text>
                <Text size="xs" fw={700} mt={1}>
                  {patientAge || '--'}
                </Text>
              </Box>

              <Divider orientation="vertical" h={18} opacity={0.5} />

              {/* Patient Gender */}
              <Box style={{ flexShrink: 0 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Gender
                </Text>
                <LtTooltip label={`Gender: ${genderDisplay}`} position="top" withArrow>
                  <Badge variant="light" color={genderColor} size="xs" radius="xs" h={15} mt={2} fw={700} tt="capitalize">
                    {genderDisplay}
                  </Badge>
                </LtTooltip>
              </Box>

              {isPaperClaim && (
                <>
                  <Divider orientation="vertical" h={18} opacity={0.5} />
                  <LtTooltip label="Manual (Paper) Claim" position="top" withArrow>
                    <Badge variant="light" color="red" size="xs" radius="xs" h={15} fw={700}>
                      Paper
                    </Badge>
                  </LtTooltip>
                </>
              )}
            </Group>
          </LtInfoCard>
        </Grid.Col>

        {/* SUBSECTION 2: INSURANCE SECTION */}
        <Grid.Col span={{ base: 12, md: 5.5 }}>
          <LtInfoCard height={38}>
            <Group gap="xs" align="center" justify="space-between" w="100%" wrap="nowrap">
              {/* Insurance Card No */}
              <LtTooltip
                label={
                  copiedField === 'cardNo'
                    ? 'Copied!'
                    : insuranceCardNoSource && insuranceCardNoSource !== 'missing'
                      ? `Source: ${insuranceCardNoSource}`
                      : 'Click to copy card number'
                }
                position="top"
                withArrow
              >
                <Box
                  onClick={() => onCopyField(insuranceCardNo, 'cardNo', 'Card No')}
                  style={{ minWidth: 0, cursor: 'pointer' }}
                >
                  <Group gap={4} align="center">
                    <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                      Card No
                    </Text>
                    {insuranceCardNo &&
                      insuranceCardNo !== '--' &&
                      (copiedField === 'cardNo' ? (
                        <Check size={9} style={{ color: 'var(--mantine-color-teal-6)' }} />
                      ) : (
                        <Copy size={9} />
                      ))}
                  </Group>
                  <Text size="xs" fw={700} truncate mt={1}>
                    {insuranceCardNo || '--'}
                  </Text>
                </Box>
              </LtTooltip>

              <Divider orientation="vertical" h={18} opacity={0.5} />

              {/* Receiver Name */}
              <Box style={{ minWidth: 0, flexGrow: 1 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Receiver
                </Text>
                <LtTooltip label={receiverName || 'No receiver specified'} disabled={!receiverName} position="top" withArrow>
                  <Text size="xs" fw={700} truncate mt={1} style={{ cursor: receiverName ? 'help' : 'default' }}>
                    {receiverName || '--'}
                  </Text>
                </LtTooltip>
              </Box>

              <Divider orientation="vertical" h={18} opacity={0.5} />

              {/* Payer Name */}
              <Box style={{ minWidth: 0, flexGrow: 1.5 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Payer
                </Text>
                <LtTooltip label={payerName || 'No payer specified'} disabled={!payerName} position="top" withArrow>
                  <Text size="xs" fw={700} truncate mt={1} style={{ cursor: payerName ? 'help' : 'default' }}>
                    {payerName || '--'}
                  </Text>
                </LtTooltip>
              </Box>

              <Divider orientation="vertical" h={18} opacity={0.5} />

              {/* Network Name */}
              <Box style={{ minWidth: 0 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Network
                </Text>
                <LtTooltip label={networkName || 'No network specified'} disabled={!networkName} position="top" withArrow>
                  <Text size="xs" fw={700} truncate mt={1} style={{ cursor: networkName ? 'help' : 'default' }}>
                    {networkName || '--'}
                  </Text>
                </LtTooltip>
              </Box>

              <Divider orientation="vertical" h={18} opacity={0.5} />

              {/* Insurance Expiry Date */}
              <Box style={{ flexShrink: 0 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Expiry
                </Text>
                <Text size="xs" fw={700} mt={1}>
                  {expiryDate || '--'}
                </Text>
              </Box>
            </Group>
          </LtInfoCard>
        </Grid.Col>

        {/* SUBSECTION 3: CLAIM SECTION */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <LtInfoCard height={38}>
            <Group gap="xs" align="center" justify="space-between" w="100%" wrap="nowrap">
              {/* Resolved Encounter */}
              <Box style={{ minWidth: 0, flexShrink: 0 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Resolved
                </Text>
                <Text size="xs" fw={700} truncate mt={1}>
                  {resolvedEncounter || '--'}
                </Text>
              </Box>

              <Divider orientation="vertical" h={18} opacity={0.5} />

              {/* Doctor Name */}
              <Box style={{ minWidth: 0, flexGrow: 1 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Doctor
                </Text>
                <LtTooltip label={doctorName || 'No doctor assigned'} disabled={!doctorName} position="top" withArrow>
                  <Text size="xs" fw={700} truncate mt={1} style={{ cursor: doctorName ? 'help' : 'default' }}>
                    {doctorName || '--'}
                  </Text>
                </LtTooltip>
              </Box>

              <Divider orientation="vertical" h={18} opacity={0.5} />

              {/* Encounter Date */}
              <Box style={{ flexShrink: 0 }}>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                  Date
                </Text>
                <Text size="xs" fw={700} mt={1}>
                  {encounterDate || '--'}
                </Text>
              </Box>

              {typeof upstreamLatencyMs === 'number' && (
                <>
                  <Divider orientation="vertical" h={18} opacity={0.5} />
                  <Box style={{ flexShrink: 0 }}>
                    <Text size="10px" fw={700} c="dimmed" tt="uppercase" lts="0.5px" lh={1}>
                      EHR
                    </Text>
                    <LtTooltip
                      label={`Upstream EHR Latency: ${upstreamLatencyMs}ms (${upstreamStatus}) | Mode: ${upstreamProtocol} | Connections: ${upstreamConcurrency}`}
                      position="top"
                      withArrow
                      openDelay={0}
                      closeDelay={0}
                    >
                      <Badge size="xs" color={latencyBadgeColor} variant="light" mt={1} fw={700} style={{ cursor: 'help' }}>
                        {latencyDot} {upstreamLatencyMs}ms
                      </Badge>
                    </LtTooltip>
                  </Box>
                </>
              )}
            </Group>
          </LtInfoCard>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
