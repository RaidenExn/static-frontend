import React from 'react'
import { Group, Text, Stack } from '@mantine/core'
import { Dropzone, DropzoneProps, DropzoneAccept, DropzoneReject, FileWithPath } from '@mantine/dropzone'
import { Upload, X, FileText } from 'lucide-react'

export interface LtFileDropzoneProps
  extends Omit<DropzoneProps, 'children' | 'loading'> {
  label?: React.ReactNode
  description?: React.ReactNode
  loading?: boolean
}

export function LtFileDropzone({
  onDrop,
  accept,
  maxSize,
  multiple = true,
  label,
  description,
  loading = false,
  disabled,
  ...rest
}: LtFileDropzoneProps) {
  return (
    <Dropzone
      onDrop={onDrop}
      accept={accept}
      maxSize={maxSize}
      multiple={multiple}
      loading={loading}
      disabled={disabled}
      styles={{
        root: {
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }
      }}
      {...rest}
    >
      <Group justify="center" align="center" py="lg" style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <Upload size={32} style={{ opacity: 0.5 }} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <X size={32} style={{ opacity: 0.5 }} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <FileText size={32} style={{ opacity: 0.3 }} />
        </Dropzone.Idle>

        <Stack gap={2} align="center">
          <Text size="sm" fw={600} ta="center">
            {label ?? (loading ? 'Uploading...' : 'Drag files here or click to browse')}
          </Text>
          {description && (
            <Text size="xs" c="var(--muted)" ta="center">
              {description}
            </Text>
          )}
        </Stack>
      </Group>
    </Dropzone>
  )
}
