import React from 'react'
import { TextInput, Group, Menu } from '@mantine/core'
import { Copy, Trash2, Zap, ChevronDown, History } from 'lucide-react'
import { LtButton, LtIconButton } from '../shared_elements'

interface EncounterLoaderProps {
  encounterInput: string
  setEncounterInput: (_val: string) => void
  recentEncounters: string[]
  clearRecentEncounters: () => void
  onLoadEncounter: (val?: string, mode?: 'force' | 'cache-first') => void
  showToast?: (_text: string, tone: string) => void
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
    <Group gap="xs" align="center" wrap="nowrap">
      <TextInput
        id="encounter"
        placeholder="Encounter number"
        size="xs"
        radius="sm"
        autoComplete="off"
        value={encounterInput}
        onChange={(e) => setEncounterInput(e.target.value)}
        w={240}
        leftSection={
          <LtIconButton
            icon={Copy}
            variant="transparent"
            color="gray"
            onClick={handleCopy}
            tooltip="Copy from input"
            ariaLabel="Copy input encounter number"
          />
        }
        rightSection={
          recentEncounters.length > 0 && (
            <Menu shadow="md" width={260} position="bottom-end" zIndex={10000}>
              <Menu.Target>
                <LtIconButton
                  icon={ChevronDown}
                  variant="transparent"
                  color="gray"
                  tooltip="Recent encounters"
                  ariaLabel="Show search history"
                />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label fs="10px" fw={700} c="dimmed">
                  RECENT ENCOUNTERS
                </Menu.Label>
                {recentEncounters.map((enc) => (
                  <Menu.Item
                    key={enc}
                    leftSection={<History size={13} />}
                    onClick={() => {
                      setEncounterInput(enc)
                      onLoadEncounter(enc, 'cache-first')
                    }}
                    fs="xs"
                  >
                    {enc}
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<Trash2 size={13} />}
                  onClick={clearRecentEncounters}
                  fs="xs"
                >
                  Clear Search History
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )
        }
      />

      {/* Load Button */}
      <LtButton id="loadButton" type="submit" ariaLabel="Load active encounter">
        Load
      </LtButton>

      {/* Paste & Load Button */}
      <LtButton
        type="button"
        color="teal"
        leftIcon={<Zap size={14} />}
        onClick={handlePasteAndLoad}
        tooltip="Paste from clipboard and load immediately"
        ariaLabel="Paste from clipboard and load active encounter"
      >
        Paste & Load
      </LtButton>
    </Group>
  )
}
