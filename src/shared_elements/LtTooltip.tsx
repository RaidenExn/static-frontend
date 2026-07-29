import React from 'react'
import { Tooltip, TooltipProps, MantineColor, MantineRadius } from '@mantine/core'

export interface LtTooltipProps extends Omit<TooltipProps, 'children'> {
  /** Label content displayed inside tooltip */
  label: React.ReactNode
  /** Trigger element wrapped by tooltip */
  children: React.ReactNode
  /** Enable mouse-following floating tooltip mode */
  floating?: boolean
  /** Placement position (default: 'top') */
  position?: TooltipProps['position']
  /** Show tooltip arrow (default: true for standard tooltips) */
  withArrow?: boolean
  /** Arrow size in px (default: 4) */
  arrowSize?: number
  /** Delay before opening tooltip in ms (default: 0 for instant feel) */
  openDelay?: number
  /** Delay before closing tooltip in ms (default: 0) */
  closeDelay?: number
  /** Border radius token (default: 'md' following theme config) */
  radius?: MantineRadius
  /** Disable tooltip (default: false) */
  disabled?: boolean
  /** Enable multi-line wrapping (auto-detected if label string length > 40 or contains newlines) */
  multiline?: boolean
  /** Tooltip container width */
  w?: number | string
  /** Tooltip container max width (default: 280) */
  mw?: number | string
  /** Theme color token */
  color?: MantineColor
  /** Offset distance from trigger element in px */
  offset?: number
  /** Transition animation preset (default: 'pop') */
  transition?: 'pop' | 'pop-top-left' | 'pop-top-right' | 'pop-bottom-left' | 'pop-bottom-right' | 'fade' | 'skew-up' | 'skew-down' | 'slide-up' | 'slide-down' | 'scale'
  /** Transition duration in ms (default: 120) */
  transitionDuration?: number
  /** Threshold string length to automatically trigger multiline mode (default: 40) */
  autoMultilineThreshold?: number
}

export function LtTooltip({
  label,
  children,
  floating = false,
  position = 'top',
  withArrow = true,
  arrowSize = 4,
  openDelay = 0,
  closeDelay = 0,
  radius = 'md',
  disabled = false,
  multiline,
  w,
  mw = 280,
  color,
  offset,
  transition = 'pop',
  transitionDuration = 120,
  autoMultilineThreshold = 40,
  style,
  ...rest
}: LtTooltipProps) {
  if (disabled || !label) {
    return <>{children}</>
  }

  // 1. Auto adaptive multiline detection
  const isAutoMultiline =
    multiline ??
    (typeof label === 'string' && (label.length > autoMultilineThreshold || label.includes('\n')))

  // 2. Auto adaptive offset calculation
  const computedOffset = offset ?? (floating ? 12 : withArrow ? 6 : 4)

  // 3. Theme-aware design tokens styling
  const computedStyle: React.CSSProperties = {
    maxWidth: isAutoMultiline ? (mw ?? 280) : undefined,
    fontSize: 'var(--mantine-font-size-xs, 11px)',
    fontWeight: 600,
    letterSpacing: '0.02em',
    padding: '4px 8px',
    borderRadius: radius ? `var(--mantine-radius-${radius}, var(--mantine-radius-md, 6px))` : undefined,
    willChange: 'transform, opacity',
    ...(style as React.CSSProperties)
  }

  // 4. Floating mode delegation
  if (floating) {
    return (
      <Tooltip.Floating
        label={label}
        position={position}
        radius={radius}
        multiline={isAutoMultiline}
        w={w}
        color={color}
        offset={computedOffset}
        style={computedStyle}
        {...rest}
      >
        {children}
      </Tooltip.Floating>
    )
  }

  // 5. Standard tooltip with native Mantine pop transition
  return (
    <Tooltip
      label={label}
      position={position}
      withArrow={withArrow}
      arrowSize={arrowSize}
      openDelay={openDelay}
      closeDelay={closeDelay}
      radius={radius}
      multiline={isAutoMultiline}
      w={w}
      color={color}
      offset={computedOffset}
      transitionProps={{ transition, duration: transitionDuration }}
      style={computedStyle}
      {...rest}
    >
      {children}
    </Tooltip>
  )
}
