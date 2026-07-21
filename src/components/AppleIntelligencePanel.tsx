import React, { useState, useEffect } from 'react'
import {
  Box,
  Group,
  Stack,
  SimpleGrid,
  Title,
  Text,
  Select,
  Button,
  ActionIcon,
  Textarea,
  Paper,
  Divider,
  Loader,
  Badge,
  Slider,
  Tooltip,
  Alert,
  Progress,
  Table,
  ScrollArea
} from '@mantine/core'
import { customFetch as fetch } from '../config/backend'
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  FileText,
  Eye,
  AlertCircle
} from 'lucide-react'

// Standard AFM system instructions to default
const DEFAULT_INSTRUCTIONS = `ROLE:
expert clinical documentation specialist optimizing insurance justifications.

TASK:
synthesize presentation and medical necessity into exactly one unbroken lowercase paragraph per patient. you must find a valid medical necessity justification for every single denied service without exception. never state that a service cannot be justified or is not indicated. must only justify the denied service(s).

FORMATTING & LINGUISTIC RULES:
- CASE: strictly lowercase letters only. no capitals anywhere.
- TIMELINES: if duration or time is not explicitly stated in patient_complaints or history_of_present_illness, completely omit the word "since" and do not include any temporal or duration phrases whatsoever. never use phrases like "since an unknown time", "since an unspecified time", "since baseline", or any variation. if a timeline is available, strictly convert it to "since [number] day/days" or "since [number] week/weeks".
- VOICE: active voice for narrative ("presented with"); third-person passive for service ("was done to").
- forbidden words: never use the word "or" (use "and" or commas). never use "investigate".
- stop rule: end sentence immediately after the core objective noun/phrase. no trailing clauses or prepositions.
- mention all the symptoms and details, timings (since when). if the input data contains lab values that justifies the denied tests directly, mention them

CLINICAL LOGIC RULES:
- TEMPLATE VARIATIONS: if time is available, use: [age] [gender] presented with [symptoms] since [time]. [service] was done to [simple objective]. if time is not available, strictly use: [age] [gender] presented with [symptoms]. [service] was done to [simple objective].
- INTERNAL REASONING PATHWAY: before generating the justification sentence, execute a mental multi-step deduction: 1. identify the specific organ system, pathological state, or metabolic process disrupted by the patient's symptoms. 2. identify the exact diagnostic or therapeutic capability of the service. 3. synthesize them into a direct, logical clinical bridge. do not use routine tracking or monitoring boilerplate; dynamically deduce a specific, simple clinical objective based on this reasoning.
- MANDATORY JUSTIFICATION: you must find a plausible medical reason for every single service. if a test seems unrelated to the primary complaint (e.g., an electrolyte panel for a respiratory infection), think critically and deduce a secondary clinical connection like evaluating dehydration or fluid imbalance from fever. never decline to justify a service.
- DATA GAPS: if history, duration, or core clinical symptoms are missing or sparse, never invent timelines or state that data is missing, unknown, or undocumented. confidently adapt by maximizing the available fragments to build the most direct, medically valid connection possible with absolute certainty.
- SYNTHESIS: use clinical umbrella terms for long symptom lists (e.g., "upper respiratory symptoms of..."). translate "h/o" strictly to "a history of". do not append unstated modifiers like "chronic" or "acute".
- BUNDLING: always merge delivery route procedures with the drug name into a single phrase (e.g., "maxigesic iv injection was done to"). never separate "iv injection" from the drug.
- COHESION: do not repeat symptoms, diagnoses, or anatomy in the justification clause if already stated in the presentation.
- HPI- you must always mention all the related data from hpi.
- EMPTY LAB LOGIC: If the encounter data does not contain any abnormal laboratory results, you must NOT include the phrase "and abnormal labs including..." in your output. Never invent, infer, or categorize vital signs as lab results.

ABBREVIATION STANDARDS:
- type 2 diabetes mellitus -> type 2 dm
- diabetes mellitus -> dm
- hypertension -> htn
- chronic kidney disease -> ckd

BANNED:
or, ago, for the past, investigate, hepatic involvement, systemic inflammatory response, neuromuscular weakness, electrolyte imbalance, was presented with, in the setting of, in light of, together, simultaneously, in a patient, requested, omitted, unspecified, yesterday, presentation, today, last night, tomorrow, baseline, perform, missing, unknown, undocumented, unavailable, unstated, generic, not justified, unjustified, clinical facts, supplied, support, specific need.`

interface AppleIntelligencePanelProps {
  active: boolean
  showToast?: (msg: string, tone: 'ok' | 'error' | 'warning' | 'loading') => void
}

export default function AppleIntelligencePanel({ active, showToast }: AppleIntelligencePanelProps) {
  const [encounters, setEncounters] = useState<string[]>([])
  const [selectedEncounter, setSelectedEncounter] = useState<string>('')
  
  const [instructions, setInstructions] = useState<string>(DEFAULT_INSTRUCTIONS)
  const [compiledInput, setCompiledInput] = useState<string>('')
  const [rawResponse, setRawResponse] = useState<string>('')
  const [cleanedResponse, setCleanedResponse] = useState<string>('')
  
  // Pipeline Intermediate States
  const [metaRules, setMetaRules] = useState<string>('')
  const [synthesizedSymptoms, setSynthesizedSymptoms] = useState<string>('')
  const [clinicalNecessityMap, setClinicalNecessityMap] = useState<string>('')

  const [temperature, setTemperature] = useState<number>(0.0)
  const [maxTokens, setMaxTokens] = useState<number>(500)
  const [samplingType, setSamplingType] = useState<string>('greedy')
  
  const [loading, setLoading] = useState<boolean>(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [compliance, setCompliance] = useState<any>(null)
  
  // Benchmark suite states
  const [benchmarking, setBenchmarking] = useState<boolean>(false)
  const [benchmarkProgress, setBenchmarkProgress] = useState<number>(0)
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([])

  useEffect(() => {
    if (active) {
      loadEncounters()
    }
  }, [active])

  const loadEncounters = async () => {
    try {
      const res = await fetch('/api/afm/encounters')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.encounters) {
          setEncounters(data.encounters)
          if (data.encounters.length > 0 && !selectedEncounter) {
            setSelectedEncounter(data.encounters[0])
          }
        }
      }
    } catch (err) {
      showToast?.('Failed to load encounters list.', 'error')
    }
  }

  const handleGenerate = async () => {
    if (!selectedEncounter) {
      showToast?.('Please select an encounter first.', 'warning')
      return
    }
    setLoading(true)
    setMetrics(null)
    setCompliance(null)
    setMetaRules('')
    setSynthesizedSymptoms('')
    setClinicalNecessityMap('')
    
    try {
      const res = await fetch('/api/afm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounter: selectedEncounter,
          instructions,
          temperature,
          maxTokens,
          samplingType
        })
      })
      
      const data = await res.json()
      if (res.ok && data.success) {
        setCompiledInput(data.compiled_input)
        setRawResponse(data.raw_response)
        setCleanedResponse(data.response)
        setCompliance(data.compliance)
        setMetrics(data.metrics)
        setMetaRules(data.meta_rules || '')
        setSynthesizedSymptoms(data.synthesized_symptoms || '')
        setClinicalNecessityMap(data.clinical_necessity_map || '')
        showToast?.('Medical justification compiled.', 'ok')
      } else {
        throw new Error(data.message || 'Generation failed.')
      }
    } catch (err: any) {
      showToast?.(`AFM Generation failed: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  };

  const handleResetInstructions = () => {
    setInstructions(DEFAULT_INSTRUCTIONS)
    showToast?.('Instructions reset to standard AFM defaults.', 'ok')
  }

  const runBulkBenchmark = async () => {
    if (encounters.length === 0) return
    setBenchmarking(true)
    setBenchmarkProgress(0)
    setBenchmarkResults([])
    showToast?.('Starting sequential AFM benchmark suite (35 encounters)...', 'loading')
    
    const results: any[] = []
    
    // We execute sequential chunks to respect macOS hardware constraints
    for (let i = 0; i < encounters.length; i++) {
      const encId = encounters[i]
      setBenchmarkProgress(Math.round(((i + 1) / encounters.length) * 100))
      
      try {
        const res = await fetch('/api/afm/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            encounter: encId,
            instructions,
            temperature,
            maxTokens,
            samplingType
          })
        })
        
        const data = await res.json()
        if (res.ok && data.success) {
          results.push({
            encounter: encId,
            success: true,
            latency: data.metrics?.latency_sec || 0,
            tokens: data.metrics?.total_tokens || 0,
            passed: data.compliance?.passed ?? false,
            violations: data.compliance?.violations || [],
            response: data.response || ''
          })
        } else {
          results.push({
            encounter: encId,
            success: false,
            error: data.message || 'HTTP error'
          })
        }
      } catch (err: any) {
        results.push({
          encounter: encId,
          success: false,
          error: err.message
        })
      }
      
      // Update dynamic array states sequentially to stream updates onto table
      setBenchmarkResults([...results])
    }
    
    setBenchmarking(false)
    showToast?.('Benchmark suite completed successfully.', 'ok')
  }

  if (!active) return null

  return (
    <Box component="section" id="appleIntelligencePanel" p="lg" bg="var(--mantine-color-body)" mih="100vh">
      {/* Dynamic Upper Banner with Sparkles */}
      <Group justify="space-between" align="center" pb="md" style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}>
        <Stack gap={4}>
          <Group gap="xs">
            <Sparkles size={24} style={{ color: 'var(--mantine-color-blue-4)' }} />
            <Title order={1} fz={26} fw={600} lts="-0.02em">
              On-Device Apple Intelligence Playground
            </Title>
          </Group>
          <Text size="xs" c="dimmed">
            Perfect, optimize and benchmark clinical justifications using macOS local System Language Models.
          </Text>
        </Stack>

        <Group gap="xs">
          <Select
            size="sm"
            w={240}
            radius="md"
            placeholder="Select test encounter"
            value={selectedEncounter}
            onChange={(val) => val && setSelectedEncounter(val)}
            data={encounters.map((enc) => ({ value: enc, label: enc }))}
            leftSection={<FileText size={14} />}
          />

          <Button
            size="sm"
            variant="gradient"
            gradient={{ from: 'blue', to: 'indigo', deg: 90 }}
            radius="md"
            onClick={handleGenerate}
            loading={loading}
            leftSection={<Play size={14} />}
          >
            Run AFM Model
          </Button>

          <Tooltip label="Reset instructions to system defaults" openDelay={0} closeDelay={0}>
            <ActionIcon variant="outline" color="gray" size={34} radius="md" onClick={handleResetInstructions}>
              <RotateCcw size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Main Grid: Settings & Compilation Panels */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mt="md">
        
        {/* Left Column: Instruction Editor & Sliders */}
        <Stack gap="md">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" align="center" mb="xs">
              <Group gap={6}>
                <Cpu size={16} style={{ color: 'var(--mantine-color-blue-4)' }} />
                <Text fw={600} size="sm">System Prompt Instructions</Text>
              </Group>
              <Badge variant="light" color="blue" size="sm">apple-intelligence-local</Badge>
            </Group>
            
            <Textarea
              size="xs"
              value={instructions}
              onChange={(e) => setInstructions(e.currentTarget.value)}
              minRows={16}
              maxRows={24}
              autosize
              styles={{ input: { fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.4' } }}
            />
          </Paper>

          {/* Model Parameter sliders */}
          <Paper withBorder p="md" radius="md">
            <Text fw={600} size="sm" mb="md">Generation Parameters</Text>
            
            <Stack gap="lg">
              <Box>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={500}>Temperature</Text>
                  <Text size="xs" c="blue" fw={600}>{temperature.toFixed(2)}</Text>
                </Group>
                <Slider
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={temperature}
                  onChange={setTemperature}
                  size="xs"
                  color="blue"
                />
              </Box>

              <SimpleGrid cols={2} spacing="md">
                <Box>
                  <Text size="xs" fw={500} mb={4}>Maximum Tokens</Text>
                  <Select
                    size="xs"
                    radius="md"
                    value={String(maxTokens)}
                    onChange={(val) => setMaxTokens(Number(val))}
                    data={[
                      { value: '100', label: '100 (Ultra Concise)' },
                      { value: '250', label: '250 (Medium)' },
                      { value: '500', label: '500 (Detailed)' },
                      { value: '1000', label: '1000 (Maximum)' }
                    ]}
                  />
                </Box>

                <Box>
                  <Text size="xs" fw={500} mb={4}>Sampling Mode</Text>
                  <Select
                    size="xs"
                    radius="md"
                    value={samplingType}
                    onChange={(val) => val && setSamplingType(val)}
                    data={[
                      { value: 'greedy', label: 'Greedy' },
                      { value: 'random', label: 'Random Sampling' }
                    ]}
                  />
                </Box>
              </SimpleGrid>
            </Stack>
          </Paper>
        </Stack>

        {/* Right Column: Compiled Prompts, Results & Compliance */}
        <Stack gap="md">
          {/* Space-Optimized Telemetry Box (Rule 5 of GEMINI.md) */}
          <Box style={{ border: '1px solid var(--mantine-color-dark-4)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--mantine-color-dark-8)' }}>
            <Group grow gap={0} style={{ textAlign: 'center' }}>
              <Box style={{ padding: '8px', borderRight: '1px solid var(--mantine-color-dark-4)' }}>
                <Text size="9px" fw={600} c="dimmed" lts="0.05em">LATENCY</Text>
                <Text fw={700} size="sm" c="blue">{metrics?.latency_sec ? `${metrics.latency_sec.toFixed(3)}s` : '--'}</Text>
              </Box>
              <Box style={{ padding: '8px', borderRight: '1px solid var(--mantine-color-dark-4)' }}>
                <Text size="9px" fw={600} c="dimmed" lts="0.05em">INPUT TOKENS</Text>
                <Text fw={700} size="sm">{metrics?.input_tokens ?? '--'}</Text>
              </Box>
              <Box style={{ padding: '8px', borderRight: '1px solid var(--mantine-color-dark-4)' }}>
                <Text size="9px" fw={600} c="dimmed" lts="0.05em">OUTPUT TOKENS</Text>
                <Text fw={700} size="sm">{metrics?.output_tokens ?? '--'}</Text>
              </Box>
              <Box style={{ padding: '8px', borderRight: '1px solid var(--mantine-color-dark-4)' }}>
                <Text size="9px" fw={600} c="dimmed" lts="0.05em">TOTAL TOKENS</Text>
                <Text fw={700} size="sm" c="teal">{metrics?.total_tokens ?? '--'}</Text>
              </Box>
              <Box style={{ padding: '8px' }}>
                <Text size="9px" fw={600} c="dimmed" lts="0.05em">CONTEXT REMAINING</Text>
                <Text fw={700} size="sm" c={metrics?.context_remaining && metrics.context_remaining < 1000 ? 'red' : 'dimmed'}>
                  {metrics?.context_remaining ?? '--'}
                </Text>
              </Box>
            </Group>
          </Box>

          {/* Compliance Audit Widget */}
          {compliance && (
            <Paper withBorder p="md" radius="md" bg={compliance.passed ? 'rgba(43, 138, 62, 0.05)' : 'rgba(250, 82, 82, 0.05)'}>
              <Group justify="space-between" align="center" mb="xs">
                <Text fw={600} size="sm" c={compliance.passed ? 'green' : 'red'}>
                  Clinical Compliance Audit
                </Text>
                <Badge color={compliance.passed ? 'green' : 'red'} variant="filled">
                  {compliance.passed ? 'PASS' : 'FAIL'}
                </Badge>
              </Group>
              
              {!compliance.passed && (
                <Stack gap={4}>
                  {compliance.violations.map((v: string, idx: number) => (
                    <Group gap="xs" key={idx} align="flex-start" wrap="nowrap">
                      <AlertCircle size={14} style={{ color: 'var(--mantine-color-red-5)', marginTop: '2px', flexShrink: 0 }} />
                      <Text size="xs" c="red">{v}</Text>
                    </Group>
                  ))}
                </Stack>
              )}
              {compliance.passed && (
                <Group gap="xs">
                  <CheckCircle2 size={16} style={{ color: 'var(--mantine-color-green-5)' }} />
                  <Text size="xs" c="green">Justification fully adheres to all linguistic, timeline and case formatting constraints.</Text>
                </Group>
              )}
            </Paper>
          )}

          {/* Justification Diff View */}
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="sm">Active Justification Result</Text>
              {cleanedResponse && (
                <Badge variant="outline" color="gray" size="sm">Cleaned</Badge>
              )}
            </Group>

            {loading ? (
              <Stack align="center" justify="center" p="xl">
                <Loader size="md" color="blue" />
                <Text size="xs" c="dimmed">On-device Apple Intelligence processing...</Text>
              </Stack>
            ) : cleanedResponse ? (
              <Stack gap="md">
                <Box>
                  <Text size="xs" c="dimmed" mb={4}>FINAL MERGED PARAGRAPH (STAGE 3 MERGE SYNTHESIS)</Text>
                  <Box p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-8)', borderRadius: '6px', border: '1px solid var(--mantine-color-dark-6)' }}>
                    <Text size="xs" style={{ fontFamily: 'monospace', lineHeight: '1.4' }}>{cleanedResponse}</Text>
                  </Box>
                </Box>
                
                {metaRules && (
                  <Box style={{ border: '1px solid var(--mantine-color-dark-5)', borderRadius: '6px', overflow: 'hidden' }}>
                    <Box p="xs" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)', backgroundColor: 'var(--mantine-color-dark-8)' }}>
                      <Text size="10px" fw={700} c="blue">STAGE 0: META-INSTRUCTION COMPILER (ON-DEVICE APPLE INTELLIGENCE)</Text>
                    </Box>
                    <Box p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-9)' }}>
                      <Text size="xs" style={{ fontFamily: 'monospace', lineHeight: '1.4' }}>{metaRules}</Text>
                    </Box>
                  </Box>
                )}

                {(synthesizedSymptoms || clinicalNecessityMap) && (
                  <SimpleGrid cols={2} spacing="xs">
                    {synthesizedSymptoms && (
                      <Box style={{ border: '1px solid var(--mantine-color-dark-5)', borderRadius: '6px', overflow: 'hidden' }}>
                        <Box p="xs" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)', backgroundColor: 'var(--mantine-color-dark-8)' }}>
                          <Text size="10px" fw={700} c="cyan">STAGE 1: CHRONOLOGICAL SYMPTOM TIMELINE</Text>
                        </Box>
                        <Box p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-9)' }}>
                          <Text size="xs" style={{ fontFamily: 'monospace', lineHeight: '1.4' }}>{synthesizedSymptoms}</Text>
                        </Box>
                      </Box>
                    )}
                    {clinicalNecessityMap && (
                      <Box style={{ border: '1px solid var(--mantine-color-dark-5)', borderRadius: '6px', overflow: 'hidden' }}>
                        <Box p="xs" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)', backgroundColor: 'var(--mantine-color-dark-8)' }}>
                          <Text size="10px" fw={700} c="violet">STAGE 2: CLINICAL NECESSITY INDICATORS</Text>
                        </Box>
                        <Box p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-9)' }}>
                          <Text size="xs" style={{ fontFamily: 'monospace', lineHeight: '1.4' }}>{clinicalNecessityMap}</Text>
                        </Box>
                      </Box>
                    )}
                  </SimpleGrid>
                )}

                {rawResponse !== cleanedResponse && rawResponse !== cleanedResponse + '.' && (
                  <Box>
                    <Text size="xs" c="dimmed" mb={4}>RAW AFM RESPONSE OUTPUT</Text>
                    <Box p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-9)', borderRadius: '6px' }}>
                      <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', lineHeight: '1.4' }}>{rawResponse}</Text>
                    </Box>
                  </Box>
                )}
              </Stack>
            ) : (
              <Text size="xs" c="dimmed" style={{ textAlign: 'center', padding: '2rem 0' }}>
                Run model or load encounter to view compiled justifications.
              </Text>
            )}
          </Paper>

          {/* Prompt input Preview */}
          {compiledInput && (
            <Paper withBorder p="md" radius="md">
              <Group gap="xs" mb="xs">
                <Eye size={14} />
                <Text fw={600} size="sm">Compiled Prompt Input Preview</Text>
              </Group>
              <ScrollArea h={120} offsetScrollbars>
                <Box p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-9)', borderRadius: '6px' }}>
                  <Text size="9px" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.4' }}>
                    {compiledInput}
                  </Text>
                </Box>
              </ScrollArea>
            </Paper>
          )}
        </Stack>
      </SimpleGrid>

      {/* Benchmarking and Optimization Suite */}
      <Paper withBorder p="md" radius="md" mt="lg">
        <Group justify="space-between" align="center" mb="md">
          <Stack gap={2}>
            <Group gap="xs">
              <Layers size={18} style={{ color: 'var(--mantine-color-blue-4)' }} />
              <Text fw={600} size="sm">Sequential Optimization Benchmark Suite</Text>
            </Group>
            <Text size="11px" c="dimmed">
              Executes the current instruction configuration sequentially over all 35 CSV test encounters to audit model behavior.
            </Text>
          </Stack>

          <Button
            size="sm"
            color="indigo"
            onClick={runBulkBenchmark}
            loading={benchmarking}
            leftSection={<Sparkles size={14} />}
          >
            Run All 35 Benchmarks
          </Button>
        </Group>

        {benchmarking && (
          <Box mb="md">
            <Group justify="space-between" mb={4}>
              <Text size="xs" fw={500}>Sequential Testing Progress</Text>
              <Text size="xs" fw={600}>{benchmarkProgress}%</Text>
            </Group>
            <Progress value={benchmarkProgress} color="indigo" animated />
          </Box>
        )}

        {benchmarkResults.length > 0 && (
          <Box style={{ border: '1px solid var(--mantine-color-dark-4)', borderRadius: '8px', overflow: 'hidden' }}>
            <Table highlightOnHover striped horizontalSpacing="xs" verticalSpacing="xs">
              <thead>
                <tr>
                  <th style={{ fontSize: '11px', width: '180px' }}>Encounter ID</th>
                  <th style={{ fontSize: '11px', width: '90px', textAlign: 'center' }}>Latency</th>
                  <th style={{ fontSize: '11px', width: '80px', textAlign: 'center' }}>Tokens</th>
                  <th style={{ fontSize: '11px', width: '90px', textAlign: 'center' }}>Compliance</th>
                  <th style={{ fontSize: '11px' }}>Justification</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkResults.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <Text size="xs" fw={500}>{row.encounter}</Text>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Text size="xs">{row.success ? `${row.latency.toFixed(2)}s` : '--'}</Text>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Text size="xs">{row.success ? row.tokens : '--'}</Text>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.success ? (
                        <Badge color={row.passed ? 'green' : 'red'} size="xs">
                          {row.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                      ) : (
                        <Badge color="yellow" size="xs">ERROR</Badge>
                      )}
                    </td>
                    <td>
                      <Text size="xs" lineClamp={1}>
                        {row.success ? row.response : (row.error || 'Unknown error')}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
