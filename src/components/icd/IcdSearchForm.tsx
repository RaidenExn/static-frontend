import React, { useState } from 'react'
import { Card, Title, TextInput, Checkbox, Button, Stack, Popover, Text, ScrollArea, Group, Box } from '@mantine/core'
import { Search, Plus } from 'lucide-react'
import { useIcdSearch } from '../../hooks/useIcdSearch'

interface IcdSearchFormProps {
  compact: boolean
  handleAddDiagnosis: (icdCode: string, disDesc: string, isPrimary: boolean, onSaved: () => void) => void
  commentInput: string
  setCommentInput: (v: string) => void
}

export function IcdSearchForm({ compact, handleAddDiagnosis, commentInput, setCommentInput }: IcdSearchFormProps) {
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

  return (
    <Card
      withBorder
      radius="sm"
      padding="xs"
      style={{
        backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.02))',
        backdropFilter: 'var(--backdrop-filter, blur(16px))',
        WebkitBackdropFilter: 'var(--backdrop-filter, blur(16px))',
        border: '1px solid var(--line, rgba(255, 255, 255, 0.05))'
      }}
    >
      <Title
        order={4}
        style={{
          fontSize: '11px',
          fontWeight: 800,
          color: 'var(--mantine-color-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '10px'
        }}
      >
        Add ICD-10 Diagnosis
      </Title>

      <Box component="form" onSubmit={handleSubmit}>
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
                  leftSection={<Search style={{ width: 14, height: 14 }} />}
                  placeholder="Type to search codes or terms..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  styles={{
                    label: {
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      marginBottom: '3px'
                    },
                    input: { borderColor: 'var(--accent)' }
                  }}
                />
              </div>
            </Popover.Target>
            <Popover.Dropdown p={0}>
              <ScrollArea.Autosize mah={200} type="scroll">
                <Box p="xs">
                  {searching ? (
                    <Text size="xs" color="dimmed" p="xs">
                      Searching...
                    </Text>
                  ) : (
                    searchResults.map((item, idx) => (
                      <Box
                        key={idx}
                        onClick={() => selectSearchResult(item)}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = 'var(--panel-soft, rgba(0,0,0,0.04))')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Group gap="xs" wrap="nowrap">
                          <Text size="xs" style={{ fontWeight: 800, color: 'var(--accent)' }}>
                            {item.code}
                          </Text>
                          <Text
                            size="xs"
                            color="dimmed"
                            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {item.shortDesc}
                          </Text>
                        </Group>
                      </Box>
                    ))
                  )}
                </Box>
              </ScrollArea.Autosize>
            </Popover.Dropdown>
          </Popover>

          <TextInput
            label="Transaction Comments"
            size="xs"
            placeholder="Audit trail comments (leave blank for default)..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            styles={{
              label: {
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '3px'
              }
            }}
          />

          <Checkbox
            size="xs"
            label="Mark as Primary Diagnosis"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            styles={{ label: { fontSize: '11px', fontWeight: 700 } }}
          />

          <Button
            type="submit"
            size="xs"
            leftSection={<Plus style={{ width: 14, height: 14 }} />}
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 800,
              marginTop: '4px'
            }}
          >
            Commit Diagnosis
          </Button>
        </Stack>
      </Box>
    </Card>
  )
}
