import { useState, useEffect } from 'react'
import { customFetch as fetch } from '../config/backend'

export function useShortcodes() {
  const [shortcodes, setShortcodes] = useState<Record<string, string | string[]>>({})
  const [shortcodesLoaded, setShortcodesLoaded] = useState<boolean>(false)

  useEffect(() => {
    fetch('/api/shortcodes')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        setShortcodes(data)
        setShortcodesLoaded(true)
      })
      .catch(() => {
        setShortcodesLoaded(true)
      })
  }, [])

  return { shortcodes, shortcodesLoaded }
}
