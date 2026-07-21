import React, { useState, useRef, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { Check, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  title?: string
  message: string
  tone: 'ok' | 'error' | 'warning' | 'info' | 'loading'
  duration?: number
  action?: ToastAction
}

export interface ToastPayload {
  id?: string
  message: string
  title?: string
  tone?: 'ok' | 'error' | 'warning' | 'info' | 'loading'
  duration?: number
  action?: ToastAction
}

const LOADING_TOAST_ID = 'global-loading-toast'

export function usePortalToasts(initialSummaryLoading?: boolean, initialRcmLoading?: boolean) {
  const [summaryLoading, setSummaryLoading] = useState(initialSummaryLoading)
  const [rcmLoading, setRcmLoading] = useState(initialRcmLoading)

  // Track currently active notifications to decide between show/update
  const activeIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (initialSummaryLoading !== undefined) {
      setSummaryLoading(initialSummaryLoading)
    }
  }, [initialSummaryLoading])

  useEffect(() => {
    if (initialRcmLoading !== undefined) {
      setRcmLoading(initialRcmLoading)
    }
  }, [initialRcmLoading])

  // Automatically clear loading toasts when background processes finish
  useEffect(() => {
    if (!summaryLoading && !rcmLoading) {
      notifications.hide(LOADING_TOAST_ID)
      activeIdsRef.current.delete(LOADING_TOAST_ID)
    }
  }, [summaryLoading, rcmLoading])

  const dismissToast = (id: string) => {
    notifications.hide(id)
    activeIdsRef.current.delete(id)
  }

  const clearToast = () => {
    notifications.clean()
    activeIdsRef.current.clear()
  }

  const showToast = (textOrPayload: string | ToastPayload, toneOrOptions?: string, onUndo?: () => void) => {
    let rawMessage = ''
    let rawTitle: string | undefined = undefined
    let tone: 'ok' | 'error' | 'warning' | 'info' | 'loading' = 'info'
    let duration = 4000
    let action: ToastAction | undefined = undefined
    let id = ''

    if (typeof textOrPayload === 'string') {
      rawMessage = textOrPayload
      tone = (toneOrOptions as any) || 'info'
      id =
        tone === 'loading'
          ? LOADING_TOAST_ID
          : activeIdsRef.current.has(LOADING_TOAST_ID)
            ? LOADING_TOAST_ID
            : `${Date.now()}-${Math.random()}`
      if (onUndo) {
        action = {
          label: 'Undo',
          onClick: onUndo
        }
      }
    } else {
      rawMessage = textOrPayload.message
      rawTitle = textOrPayload.title
      tone = textOrPayload.tone || 'info'
      duration = textOrPayload.duration ?? 4000
      action = textOrPayload.action
      id =
        textOrPayload.id ||
        (tone === 'loading'
          ? LOADING_TOAST_ID
          : activeIdsRef.current.has(LOADING_TOAST_ID)
            ? LOADING_TOAST_ID
            : `${Date.now()}-${Math.random()}`)
    }

    const message = rawMessage || ''
    const title = rawTitle

    // Map custom tones to Mantine colors and Lucide icons
    let color = 'blue'
    let iconElement: React.ReactNode = null

    if (tone === 'ok') {
      color = 'teal'
      iconElement = React.createElement(Check, { size: 16, style: { color: 'var(--mantine-color-teal-6)' } })
    } else if (tone === 'error') {
      color = 'red'
      iconElement = React.createElement(AlertCircle, { size: 16, style: { color: 'var(--mantine-color-red-6)' } })
    } else if (tone === 'warning') {
      color = 'orange'
      iconElement = React.createElement(AlertTriangle, { size: 16, style: { color: 'var(--mantine-color-orange-6)' } })
    } else if (tone === 'info') {
      color = 'blue'
      iconElement = React.createElement(Info, { size: 16, style: { color: 'var(--mantine-color-blue-6)' } })
    } else if (tone === 'loading') {
      color = 'blue'
      iconElement = React.createElement(
        'div',
        { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement(
          'style',
          null,
          `
          @keyframes toast-spinner {
            100% { transform: rotate(360deg); }
          }
          .toast-spin-active {
            animation: toast-spinner 0.85s linear infinite;
          }
        `
        ),
        React.createElement(Loader2, {
          size: 16,
          className: 'toast-spin-active',
          style: { color: 'var(--mantine-color-blue-6)' }
        })
      )
    }

    // Build standard or action-based message content
    const renderedMessage = React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' } },
      React.createElement(
        'div',
        {
          style: { whiteSpace: 'pre-wrap', lineHeight: '1.4', fontSize: 'var(--mantine-font-size-xs)', fontWeight: 500 }
        },
        message
      ),
      action &&
        React.createElement(
          'button',
          {
            onClick: () => {
              if (action) action.onClick()
              notifications.hide(id)
              activeIdsRef.current.delete(id)
            },
            style: {
              alignSelf: 'flex-start',
              backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.04))',
              border: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
              color: 'var(--text-primary, var(--mantine-color-text))',
              padding: '4px 8px',
              borderRadius: 'var(--mantine-radius-default, var(--mantine-radius-sm, 4px))',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 700,
              marginTop: '4px',
              transition: 'all 0.15s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }
          },
          action.label
        )
    )

    const isExisting = activeIdsRef.current.has(id)
    const config = {
      id,
      title: title || undefined,
      message: renderedMessage,
      color,
      icon: iconElement,
      loading: false, // We supply our own gorgeous spinning animated Lucide loader
      autoClose: tone === 'loading' ? false : duration,
      onClose: () => {
        activeIdsRef.current.delete(id)
      }
    }

    if (isExisting) {
      notifications.update(config)
    } else {
      activeIdsRef.current.add(id)
      notifications.show(config)
    }
  }

  return {
    showToast,
    dismissToast,
    clearToast,
    toasts: [] as ToastItem[], // Backward compatibility for any length or iteration checks
    setSummaryLoading,
    setRcmLoading
  }
}
