import React from 'react'
import { Group, Text, Badge, Box, Tooltip, Grid, Paper, Divider } from '@mantine/core'
import { Copy, Check } from 'lucide-react'

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
  onCopyField: (text: string, fieldKey: string, label: string) => void
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
  onCopyField
}: PatientHeaderBannerProps) {
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
    <Box style={{ width: '100%', boxSizing: 'border-box', padding: '0px' }}>
      <Grid style={{ width: '100%', margin: 0 }} {...({ gutter: 'xs' } as any)}>
        {/* SUBSECTION 1: PATIENT SECTION (Patient name, age, gender) */}
        <Grid.Col span={{ base: 12, md: 3.5 }}>
          <Paper
            withBorder
            radius="sm"
            p="6px 12px"
            style={{
              backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
              borderColor: 'var(--line, rgba(255, 255, 255, 0.05))',
              backdropFilter: 'var(--backdrop-filter, blur(16px))',
              WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
              display: 'flex',
              alignItems: 'center',
              minHeight: '38px',
              transition: 'all 0.2s ease'
            }}
          >
            <Group
              gap="xs"
              align="center"
              style={{ flexWrap: 'nowrap', width: '100%', justifyContent: 'space-between' }}
            >
              {/* Patient Name */}
              <Box style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Patient
                </Text>
                <Text
                  fw={700}
                  style={{
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    marginTop: '1px',
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)'
                  }}
                >
                  {patientName || '--'}
                </Text>
              </Box>

              <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />

              {/* Patient Age */}
              <Box style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Age
                </Text>
                <Text
                  fw={700}
                  style={{
                    whiteSpace: 'nowrap',
                    marginTop: '1px',
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)'
                  }}
                >
                  {patientAge || '--'}
                </Text>
              </Box>

              <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />

              {/* Patient Gender - Dedicated section block */}
              <Box style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Gender
                </Text>
                <Tooltip label={`Gender: ${genderDisplay}`} position="top" withArrow>
                  <Badge
                    variant="light"
                    color={genderColor}
                    size="xs"
                    style={{
                      height: '15px',
                      fontSize: 'calc(var(--mantine-font-size-xs) * 0.85)',
                      padding: '0 6px',
                      textTransform: 'capitalize',
                      flexShrink: 0,
                      marginTop: '2px',
                      fontWeight: 700,
                      borderRadius: 'var(--mantine-radius-default, var(--mantine-radius-sm, 4px))',
                      cursor: 'help'
                    }}
                  >
                    {genderDisplay}
                  </Badge>
                </Tooltip>
              </Box>

              {isPaperClaim && (
                <>
                  <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />
                  <Tooltip label="Manual (Paper) Claim" position="top" withArrow>
                    <Badge
                      variant="light"
                      color="red"
                      size="xs"
                      style={{
                        height: '15px',
                        fontSize: 'calc(var(--mantine-font-size-xs) * 0.85)',
                        padding: '0 6px',
                        textTransform: 'capitalize',
                        flexShrink: 0,
                        borderRadius: 'var(--mantine-radius-default, var(--mantine-radius-sm, 4px))',
                        cursor: 'help'
                      }}
                    >
                      Paper
                    </Badge>
                  </Tooltip>
                </>
              )}
            </Group>
          </Paper>
        </Grid.Col>

        {/* SUBSECTION 2: INSURANCE SECTION (Card no, receiver, payer, Card number, expiry date, network) */}
        <Grid.Col span={{ base: 12, md: 5.5 }}>
          <Paper
            withBorder
            radius="sm"
            p="6px 12px"
            style={{
              backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
              borderColor: 'var(--line, rgba(255, 255, 255, 0.05))',
              backdropFilter: 'var(--backdrop-filter, blur(16px))',
              WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
              display: 'flex',
              alignItems: 'center',
              minHeight: '38px',
              transition: 'all 0.2s ease'
            }}
          >
            <Group
              gap="xs"
              align="center"
              style={{ flexWrap: 'nowrap', width: '100%', justifyContent: 'space-between' }}
            >
              {/* Insurance Card No */}
              <Tooltip
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
                  style={{ display: 'flex', flexDirection: 'column', minWidth: 0, cursor: 'pointer' }}
                >
                  <Text
                    fw={700}
                    c="dimmed"
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      lineHeight: 1,
                      fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                    }}
                  >
                    Card No{' '}
                    {insuranceCardNo &&
                      insuranceCardNo !== '--' &&
                      (copiedField === 'cardNo' ? (
                        <Check style={{ width: 9, height: 9, color: 'var(--good, #40c057)' }} />
                      ) : (
                        <Copy style={{ width: 9, height: 9 }} />
                      ))}
                  </Text>
                  <Text
                    fw={700}
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      marginTop: '1px',
                      fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)'
                    }}
                  >
                    {insuranceCardNo || '--'}
                  </Text>
                </Box>
              </Tooltip>

              <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />

              {/* Receiver Name */}
              <Box style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Receiver
                </Text>
                <Tooltip
                  label={receiverName || 'No receiver specified'}
                  disabled={!receiverName}
                  position="top"
                  withArrow
                >
                  <Text
                    fw={700}
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      marginTop: '1px',
                      fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)',
                      cursor: receiverName ? 'help' : 'default'
                    }}
                  >
                    {receiverName || '--'}
                  </Text>
                </Tooltip>
              </Box>

              <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />

              {/* Payer Name */}
              <Box style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1.5 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Payer
                </Text>
                <Tooltip label={payerName || 'No payer specified'} disabled={!payerName} position="top" withArrow>
                  <Text
                    fw={700}
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      marginTop: '1px',
                      fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)',
                      cursor: payerName ? 'help' : 'default'
                    }}
                  >
                    {payerName || '--'}
                  </Text>
                </Tooltip>
              </Box>

              <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />

              {/* Network Name */}
              <Box style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Network
                </Text>
                <Tooltip label={networkName || 'No network specified'} disabled={!networkName} position="top" withArrow>
                  <Text
                    fw={700}
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      marginTop: '1px',
                      fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)',
                      cursor: networkName ? 'help' : 'default'
                    }}
                  >
                    {networkName || '--'}
                  </Text>
                </Tooltip>
              </Box>

              <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />

              {/* Insurance Expiry Date */}
              <Box style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Expiry
                </Text>
                <Text
                  fw={700}
                  style={{
                    whiteSpace: 'nowrap',
                    marginTop: '1px',
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)'
                  }}
                >
                  {expiryDate || '--'}
                </Text>
              </Box>
            </Group>
          </Paper>
        </Grid.Col>

        {/* SUBSECTION 3: CLAIM SECTION (Resolved encounter ID, Doctor, encounter start date) - No Resubs */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper
            withBorder
            radius="sm"
            p="6px 12px"
            style={{
              backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
              borderColor: 'var(--line, rgba(255, 255, 255, 0.05))',
              backdropFilter: 'var(--backdrop-filter, blur(16px))',
              WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
              display: 'flex',
              alignItems: 'center',
              minHeight: '38px',
              transition: 'all 0.2s ease'
            }}
          >
            <Group
              gap="xs"
              align="center"
              style={{ flexWrap: 'nowrap', width: '100%', justifyContent: 'space-between' }}
            >
              {/* Resolved Encounter */}
              <Box style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexShrink: 0 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Resolved
                </Text>
                <Text
                  fw={700}
                  style={{
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    marginTop: '1px',
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)'
                  }}
                >
                  {resolvedEncounter || '--'}
                </Text>
              </Box>

              <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />

              {/* Doctor Name */}
              <Box style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Doctor
                </Text>
                <Tooltip label={doctorName || 'No doctor assigned'} disabled={!doctorName} position="top" withArrow>
                  <Text
                    fw={700}
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      marginTop: '1px',
                      fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)',
                      cursor: doctorName ? 'help' : 'default'
                    }}
                  >
                    {doctorName || '--'}
                  </Text>
                </Tooltip>
              </Box>

              <Divider orientation="vertical" style={{ height: '18px', opacity: 0.5 }} />

              {/* Encounter Date */}
              <Box style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <Text
                  fw={700}
                  c="dimmed"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.82)'
                  }}
                >
                  Date
                </Text>
                <Text
                  fw={700}
                  style={{
                    whiteSpace: 'nowrap',
                    marginTop: '1px',
                    fontSize: 'calc(var(--mantine-font-size-xs) * 0.95)'
                  }}
                >
                  {encounterDate || '--'}
                </Text>
              </Box>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  )
}
