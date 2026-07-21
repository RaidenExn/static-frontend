import React, { useRef } from 'react'
import { useAutosizeTextArea } from '../../hooks/useAutosizeTextArea'

interface AutosizeTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
}

export function AutosizeTextArea({ value, style, ...props }: AutosizeTextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useAutosizeTextArea(ref.current, value)

  return (
    <textarea
      ref={ref}
      value={value}
      style={{
        ...style,
        overflow: 'hidden', // Ensures no scrollbars show up at all
        resize: 'none' // Prevents manual resizing which can disrupt auto-height
      }}
      {...props}
    />
  )
}
