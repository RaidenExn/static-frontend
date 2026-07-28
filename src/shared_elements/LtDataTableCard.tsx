import React, { useState } from 'react'
import { Table, TextInput, Box, Text, ScrollArea, Skeleton } from '@mantine/core'
import { Search } from 'lucide-react'
import { LtAppCard } from './LtAppCard'

export interface LtDataTableColumn<T> {
  key: string
  header: React.ReactNode
  render: (row: T, index: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  width?: number | string
}

export interface LtDataTableCardProps<T> {
  title?: React.ReactNode
  icon?: React.ComponentType<{ size?: number }>
  badge?: React.ReactNode
  actions?: React.ReactNode
  columns: LtDataTableColumn<T>[]
  data: T[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  searchFilter?: (row: T, query: string) => boolean
  maxHeight?: number | string
  emptyText?: string
}

export function LtDataTableCard<T>({
  title,
  icon,
  badge,
  actions,
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search table...',
  searchFilter,
  maxHeight = 320,
  emptyText = 'No data available'
}: LtDataTableCardProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data
    return data.filter((row) => searchFilter(row, searchQuery.toLowerCase().trim()))
  }, [data, searchQuery, searchFilter])

  const headerDock = (
    <React.Fragment>
      {searchable && (
        <TextInput
          size="xs"
          placeholder={searchPlaceholder}
          leftSection={<Search size={12} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          w={180}
        />
      )}
      {actions}
    </React.Fragment>
  )

  return (
    <LtAppCard title={title} icon={icon} badge={badge} actions={headerDock} padding={0}>
      <Box style={{ overflowX: 'auto' }}>
        <ScrollArea mah={maxHeight} type="auto">
          <Table highlightOnHover verticalSpacing={4} horizontalSpacing="xs" fs="xs">
            <Table.Thead bg="var(--mantine-color-body)">
              <Table.Tr bd="0 0 1px solid var(--line)">
                {columns.map((col) => (
                  <Table.Th
                    key={col.key}
                    fs="9px"
                    fw={700}
                    tt="uppercase"
                    c="var(--muted)"
                    ta={col.align || 'left'}
                    w={col.width}
                  >
                    {col.header}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <Table.Tr key={idx}>
                    {columns.map((col) => (
                      <Table.Td key={col.key}>
                        <Skeleton height={12} radius="xs" />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : filteredData.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length}>
                    <Text size="xs" c="var(--muted)" ta="center" py="md">
                      {emptyText}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredData.map((row, rowIdx) => (
                  <Table.Tr key={rowIdx} bd="0 0 1px solid var(--line)">
                    {columns.map((col) => (
                      <Table.Td key={col.key} ta={col.align || 'left'}>
                        {col.render(row, rowIdx)}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Box>
    </LtAppCard>
  )
}
