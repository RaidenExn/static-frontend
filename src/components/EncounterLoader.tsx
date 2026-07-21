import React from 'react'
import { TextInput, Button, Group, ActionIcon, Tooltip, Menu } from '@mantine/core'
import { Copy, Trash2, Zap, ChevronDown, History } from 'lucide-react'

interface EncounterLoaderProps {
  encounterInput: string
  setEncounterInput: (val: string) => void
  recentEncounters: string[]
  clearRecentEncounters: () => void
  onLoadEncounter: (val?: string) => void
  showToast?: (text: string, tone: string) => void
}

export default function EncounterLoader({
  encounterInput,
  setEncounterInput,
  recentEncounters,
  clearRecentEncounters,
  onLoadEncounter,
  showToast
}: EncounterLoaderProps) {
  const handleCopy = async () => {
    const text = encounterInput.trim()
    if (text) {
      try {
        await navigator.clipboard.writeText(text)
        showToast?.(`Copied input: "${text}"`, 'ok')
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    } else {
      showToast?.('Input is empty.', 'warning')
    }
  }

  const handlePasteAndLoad = async () => {
    try {
      let text = ''
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText()
      } else {
        showToast?.('Clipboard permission is restricted by browser policy.', 'error')
        return
      }
      const cleaned = text.trim()
      if (cleaned) {
        if (cleaned.includes('/ENC-') || cleaned.includes('-ENC-')) {
          setEncounterInput(cleaned)
          showToast?.(`Pasted and loading: "${cleaned}"`, 'ok')
          onLoadEncounter(cleaned)
        } else {
          showToast?.(`Invalid encounter format`, 'warning')
        }
      } else {
        showToast?.('Clipboard is empty.', 'warning')
      }
    } catch (err) {
      console.error('Failed to read clipboard: ', err)
      showToast?.('Clipboard permission denied or failed.', 'error')
    }
  }

  return (
    <Group gap="xs" align="center" style={{ flexWrap: 'nowrap' }}>
      <TextInput
        id="encounter"
        placeholder="Encounter number"
        size="xs"
        autoComplete="off"
        value={encounterInput}
        onChange={(e) => setEncounterInput(e.target.value)}
        styles={{
          root: { minWidth: '240px' },
          input: { height: '30px' }
        }}
        leftSection={
          <Tooltip label="Copy from input" position="top" withArrow>
            <ActionIcon
              variant="transparent"
              color="gray"
              onClick={handleCopy}
              aria-label="Copy input encounter number"
              style={{ width: 18, height: 18, minWidth: 18 }}
            >
              <Copy style={{ width: 14, height: 14 }} />
            </ActionIcon>
          </Tooltip>
        }
        rightSection={
          recentEncounters.length > 0 && (
            <Menu shadow="md" width={260} position="bottom-end" zIndex={10000}>
              <Menu.Target>
                <Tooltip label="Recent encounters" position="top" withArrow>
                  <ActionIcon
                    variant="transparent"
                    color="gray"
                    aria-label="Show search history"
                    style={{ width: 18, height: 18, minWidth: 18 }}
                  >
                    <ChevronDown style={{ width: 14, height: 14 }} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--line)' }}>
                <Menu.Label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>RECENT ENCOUNTERS</Menu.Label>
                {recentEncounters.map((enc) => (
                  <Menu.Item
                    key={enc}
                    leftSection={<History style={{ width: 13, height: 13 }} />}
                    onClick={() => {
                      setEncounterInput(enc)
                      onLoadEncounter(enc)
                    }}
                    style={{ fontSize: 'var(--mantine-font-size-xs)' }}
                  >
                    {enc}
                  </Menu.Item>
                ))}
                <Menu.Divider style={{ borderColor: 'var(--line)' }} />
                <Menu.Item
                  color="red"
                  leftSection={<Trash2 style={{ width: 13, height: 13 }} />}
                  onClick={clearRecentEncounters}
                  style={{ fontSize: 'var(--mantine-font-size-xs)' }}
                >
                  Clear Search History
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )
        }
      />

      {/* Load Button */}
      <Button id="loadButton" type="submit" size="xs" aria-label="Load active encounter" style={{ height: '30px' }}>
        Load
      </Button>

      {/* Paste & Load Button */}
      <Tooltip label="Paste from clipboard and load immediately" position="top" withArrow>
        <Button
          type="button"
          size="xs"
          variant="filled"
          color="teal"
          leftSection={<Zap style={{ width: 14, height: 14 }} />}
          onClick={handlePasteAndLoad}
          aria-label="Paste from clipboard and load active encounter"
          style={{ height: '30px' }}
        >
          Paste & Load
        </Button>
      </Tooltip>
    </Group>
  )
}
