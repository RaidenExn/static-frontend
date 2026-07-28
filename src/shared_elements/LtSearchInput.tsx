import React, { useState, useEffect, useRef } from 'react'
import { TextInput, TextInputProps, ActionIcon } from '@mantine/core'
import { Search, X } from 'lucide-react'

export interface LtSearchInputProps
  extends Omit<TextInputProps, 'value' | 'onChange' | 'leftSection' | 'rightSection'> {
  value?: string
  onChange?: (value: string) => void
  debounceMs?: number
  icon?: React.ComponentType<{ size?: number }>
}

export function LtSearchInput({
  value: externalValue = '',
  onChange,
  debounceMs = 300,
  icon: Icon = Search,
  placeholder = 'Search...',
  ...rest
}: LtSearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setInternalValue(externalValue)
  }, [externalValue])

  useEffect(() => {
    if (debounceMs <= 0) {
      onChange?.(internalValue)
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange?.(internalValue)
    }, debounceMs)
    return () => clearTimeout(timerRef.current)
  }, [internalValue, debounceMs, onChange])

  return (
    <TextInput
      size="xs"
      placeholder={placeholder}
      value={internalValue}
      onChange={(e) => setInternalValue(e.currentTarget.value)}
      leftSection={<Icon size={14} />}
      rightSection={
        internalValue ? (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => setInternalValue('')}
            style={{ border: 'none' }}
          >
            <X size={12} />
          </ActionIcon>
        ) : undefined
      }
      styles={{
        input: {
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }}
      {...rest}
    />
  )
}
