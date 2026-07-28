import React, { useState } from 'react'
import { ActionIcon, ActionIconProps } from '@mantine/core'
import { Copy, Check } from 'lucide-react'
import { LtTooltip } from './LtTooltip'

export interface LtCopyButtonProps extends Omit<ActionIconProps, 'children' | 'onClick'> {
  value: string
  tooltip?: string
  copiedTooltip?: string
  iconSize?: number
}

export function LtCopyButton({
  value,
  tooltip = 'Copy',
  copiedTooltip = 'Copied!',
  iconSize = 14,
  size = 'xs',
  variant = 'subtle',
  color = 'gray',
  ...rest
}: LtCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback for insecure context
      const el = document.createElement('textarea')
      el.value = value
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <LtTooltip label={copied ? copiedTooltip : tooltip} disabled={copied}>
      <ActionIcon
        size={size}
        variant={variant}
        color={copied ? 'green' : color}
        onClick={handleCopy}
        style={{
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        {...rest}
      >
        {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      </ActionIcon>
    </LtTooltip>
  )
}
