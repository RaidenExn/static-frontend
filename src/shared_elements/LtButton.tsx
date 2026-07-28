import React from 'react'
import { Button, ButtonProps, ActionIcon, ActionIconProps, MantineSize } from '@mantine/core'
import { LtTooltip } from './LtTooltip'

/* ============================================================================
 * 1. LtButton: Standard Icon + Text or Text-Only Button
 * ============================================================================ */
export interface LtButtonProps extends Omit<ButtonProps, 'children'> {
  /** Text or element inside button */
  children?: React.ReactNode
  /** Icon element on left side */
  leftIcon?: React.ReactNode
  /** Icon element on right side */
  rightIcon?: React.ReactNode
  /** Integrated tooltip label string or ReactNode */
  tooltip?: React.ReactNode
  /** Tooltip position (default: 'top') */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  /** HTML button element ID */
  id?: string
  /** ARIA label */
  ariaLabel?: string
  /** Click event handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset'
}

export function LtButton({
  children,
  leftIcon,
  rightIcon,
  tooltip,
  tooltipPosition = 'top',
  size = 'xs',
  radius = 'sm',
  variant = 'filled',
  color,
  loading = false,
  disabled = false,
  id,
  ariaLabel,
  onClick,
  type = 'button',
  style,
  ...rest
}: LtButtonProps) {
  const computedStyle: React.CSSProperties = {
    borderRadius: radius ? `var(--mantine-radius-${radius}, var(--mantine-radius-sm, 4px))` : 'var(--mantine-radius-sm, 4px)',
    fontSize: size === 'xs' ? 'var(--mantine-font-size-xs, 11px)' : undefined,
    fontWeight: 600,
    letterSpacing: '0.01em',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform, opacity',
    ...(style as React.CSSProperties)
  }

  const buttonNode = (
    <Button
      id={id}
      type={type}
      size={size}
      radius={radius}
      variant={variant}
      color={color}
      loading={loading}
      disabled={disabled}
      leftSection={leftIcon}
      rightSection={rightIcon}
      aria-label={ariaLabel}
      onClick={onClick}
      style={computedStyle}
      {...rest}
    >
      {children}
    </Button>
  )

  if (tooltip) {
    return (
      <LtTooltip label={tooltip} position={tooltipPosition} disabled={disabled}>
        {buttonNode}
      </LtTooltip>
    )
  }

  return buttonNode
}

/* ============================================================================
 * 2. LtIconButton: Icon-Only Action Button with Integrated Tooltip
 * ============================================================================ */
export interface LtIconButtonProps extends Omit<ActionIconProps, 'children'> {
  /** Lucide React Icon Component or ReactNode */
  icon: React.ComponentType<{ size?: number }> | React.ReactNode
  /** Icon size in px (default: 14) */
  iconSize?: number
  /** Integrated tooltip label string or ReactNode */
  tooltip?: React.ReactNode
  /** Tooltip position (default: 'top') */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  /** ARIA label for accessibility */
  ariaLabel?: string
  /** Click event handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function LtIconButton({
  icon,
  iconSize = 14,
  tooltip,
  tooltipPosition = 'top',
  size = 'xs',
  radius = 'sm',
  variant = 'subtle',
  color = 'gray',
  loading = false,
  disabled = false,
  ariaLabel,
  onClick,
  style,
  ...rest
}: LtIconButtonProps) {
  const IconComponent =
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && '$$typeof' in icon && !React.isValidElement(icon))
      ? (icon as React.ComponentType<{ size?: number }>)
      : null

  const computedStyle: React.CSSProperties = {
    borderRadius: radius ? `var(--mantine-radius-${radius}, var(--mantine-radius-sm, 4px))` : 'var(--mantine-radius-sm, 4px)',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform, opacity',
    ...(style as React.CSSProperties)
  }

  const iconNode = (
    <ActionIcon
      size={size}
      radius={radius}
      variant={variant}
      color={color}
      loading={loading}
      disabled={disabled}
      aria-label={ariaLabel || (typeof tooltip === 'string' ? tooltip : undefined)}
      onClick={onClick}
      style={computedStyle}
      {...rest}
    >
      {IconComponent ? <IconComponent size={iconSize} /> : (icon as React.ReactNode)}
    </ActionIcon>
  )

  if (tooltip) {
    return (
      <LtTooltip label={tooltip} position={tooltipPosition} disabled={disabled}>
        {iconNode}
      </LtTooltip>
    )
  }

  return iconNode
}

/* ============================================================================
 * 3. LtCompactButton: Micro Inline Table & Header Button
 * ============================================================================ */
export interface LtCompactButtonProps extends Omit<ButtonProps, 'children'> {
  /** Text or element inside micro button */
  children?: React.ReactNode
  /** Icon element on left side */
  leftIcon?: React.ReactNode
  /** Height in px (default: 20) */
  height?: number
  /** Integrated tooltip label */
  tooltip?: React.ReactNode
  /** Click event handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function LtCompactButton({
  children,
  leftIcon,
  height = 20,
  tooltip,
  variant = 'subtle',
  color = 'gray',
  loading = false,
  disabled = false,
  onClick,
  radius = 'xs',
  style,
  ...rest
}: LtCompactButtonProps) {
  const computedStyle: React.CSSProperties = {
    fontSize: 'var(--mantine-font-size-xs, 10px)',
    fontWeight: 600,
    letterSpacing: '0.01em',
    borderRadius: radius ? `var(--mantine-radius-${radius}, var(--mantine-radius-xs, 2px))` : 'var(--mantine-radius-xs, 2px)',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform, opacity',
    ...(style as React.CSSProperties)
  }

  const compactNode = (
    <Button
      size="xs"
      radius={radius}
      variant={variant}
      color={color}
      loading={loading}
      disabled={disabled}
      leftSection={leftIcon}
      onClick={onClick}
      h={height}
      p="0 6px"
      style={computedStyle}
      {...rest}
    >
      {children}
    </Button>
  )

  if (tooltip) {
    return (
      <LtTooltip label={tooltip} disabled={disabled}>
        {compactNode}
      </LtTooltip>
    )
  }

  return compactNode
}
