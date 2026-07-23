import { useEffect } from 'react'

interface UseUiTracingProps {
  activeEncounter?: string
  activeTab?: string
}

export function useUiTracing({ activeEncounter, activeTab }: UseUiTracingProps = {}) {
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      try {
        const target = event.target as HTMLElement | null
        if (!target) return

        // Find closest interactive element
        const interactiveEl = target.closest(
          'button, a, input, select, textarea, [role="button"], [role="tab"], [role="menuitem"], [data-clickable="true"], .mantine-UnstyledButton-root, .mantine-Tabs-tab'
        ) as HTMLElement | null

        if (!interactiveEl) return

        // Extract label or identifier
        const text = (
          interactiveEl.getAttribute('aria-label') ||
          interactiveEl.getAttribute('data-testid') ||
          interactiveEl.getAttribute('title') ||
          interactiveEl.innerText ||
          interactiveEl.textContent ||
          interactiveEl.id ||
          interactiveEl.tagName
        )
          .replace(/\s+/g, ' ')
          .trim()

        const truncatedText = text.length > 60 ? text.substring(0, 57) + '...' : text
        const tag = interactiveEl.tagName.toLowerCase()
        const role = interactiveEl.getAttribute('role') || tag

        const payload = {
          element: truncatedText || tag,
          tag,
          role,
          id: interactiveEl.id || undefined,
          activeEncounter: activeEncounter || '-',
          activeTab: activeTab || '-',
          timestamp: new Date().toISOString()
        }

        // Send telemetry using sendBeacon or non-blocking fetch
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/telemetry/click', blob)
        } else {
          fetch('/api/telemetry/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
          }).catch(() => {})
        }
      } catch (_) {
        // Silently swallow UI tracing errors to ensure core app never breaks
      }
    }

    window.addEventListener('click', handleGlobalClick, { capture: true, passive: true })
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true })
    }
  }, [activeEncounter, activeTab])
}
