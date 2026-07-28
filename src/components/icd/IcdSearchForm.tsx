import React, { useState } from 'react'
import { TextInput, Checkbox, Stack, Popover, Text, ScrollArea, Group, Box } from '@mantine/core'
import { Search, Plus } from 'lucide-react'
import { useIcdSearch } from '../../hooks/useIcdSearch'
import { LtFormSectionCard } from '../../shared_elements'

interface IcdSearchFormProps {
  compact: boolean
  handleAddDiagnosis: (_icdCode: string, disDesc: string, isPrimary: boolean, onSaved: () => void) => void
  commentInput: string
  setCommentInput: (_v: string) => void
}

export function IcdSearchForm({ compact: _compact, handleAddDiagnosis, commentInput, setCommentInput }: IcdSearchFormProps) {
  const { searchQuery, setSearchQuery, searchResults, showDropdown, setShowDropdown, searching, searchContainerRef } =
    useIcdSearch()

  const [icdCodeInput, setIcdCodeInput] = useState('')
  const [descInput, setDisDescInput] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)

  const selectSearchResult = (item: any) => {
    setIcdCodeInput(item.code)
    setDisDescInput(item.shortDesc)
    setSearchQuery(`${item.code} - ${item.shortDesc}`)
    setShowDropdown(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAddDiagnosis(icdCodeInput, descInput, isPrimary, () => {
      setIcdCodeInput('')
      setDisDescInput('')
      setSearchQuery('')
      setIsPrimary(false)
    })
  }

  const isDirty = Boolean(icdCodeInput || descInput || commentInput || isPrimary)

  return (
    <LtFormSectionCard
      title="Add ICD-10 Diagnosis"
      icon={Search}
      isDirty={isDirty}
      onSubmit={handleSubmit}
      submitText="Add Diagnosis"
      submitIcon={Plus}
      submitColor="cyan"
      submitDisabled={!icdCodeInput || !descInput}
    >
      <Stack gap="xs">
        <Popover
          opened={showDropdown && (searchResults.length > 0 || searching)}
          onClose={() => setShowDropdown(false)}
          width="target"
          position="bottom-start"
          shadow="md"
          offset={4}
        >
          <Popover.Target>
            <div ref={searchContainerRef}>
              <TextInput
                label="Local ICD-10 Search"
                size="xs"
                leftSection={<Search size={14} />}
                placeholder="Type to search codes or terms..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
              />
            </div>
          </Popover.Target>
          <Popover.Dropdown p={0}>
            {searching ? (
              <Text size="xs" p="xs" c="dimmed">
                Searching ICD-10 index...
              </Text>
            ) : (
              <ScrollArea h={180} type="auto">
                <Stack gap={0}>
                  {searchResults.map((item, idx) => (
                    <Box
                      key={idx}
                      p="xs"
                      style={{ cursor: 'pointer', borderBottom: '1px solid var(--mantine-color-default-border)' }}
                      onClick={() => selectSearchResult(item)}
                    >
                      <Group gap="xs">
                        <Text size="xs" fw={800} c="cyan">
                          {item.code}
                        </Text>
                        <Text size="xs" style={{ flex: 1 }}>
                          {item.shortDesc}
                        </Text>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Popover.Dropdown>
        </Popover>

        <Group gap="xs" grow>
          <TextInput
            label="Selected ICD Code"
            size="xs"
            placeholder="e.g. E11.9"
            value={icdCodeInput}
            onChange={(e) => setIcdCodeInput(e.target.value)}
          />
          <TextInput
            label="Description"
            size="xs"
            placeholder="Diagnosis description"
            value={descInput}
            onChange={(e) => setDisDescInput(e.target.value)}
          />
        </Group>

        <TextInput
          label="Internal Comment / Audit Note"
          size="xs"
          placeholder="Add note..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
        />

        <Checkbox
          label="Mark as Primary Diagnosis"
          size="xs"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.currentTarget.checked)}
          mt={2}
        />
      </Stack>
    </LtFormSectionCard>
  )
}
