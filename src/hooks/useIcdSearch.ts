import { useState, useEffect, useRef } from 'react'
import { customFetch as fetch } from '../config/backend'

export interface IcdSearchResult {
  code: string
  shortDesc: string
  longDesc?: string
}

export function useIcdSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<IcdSearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Debounced search for ICD codes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    if (searchQuery.includes(' - ')) {
      // Avoid searching again if we just selected a result
      return
    }
    setSearching(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/encounter/diagnoses/search?query=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setSearchResults(data.results || [])
          }
        }
      } catch (err) {
        console.error('ICD autocomplete error:', err)
      } finally {
        setSearching(false)
      }
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    showDropdown,
    setShowDropdown,
    searching,
    setSearching,
    searchContainerRef
  }
}
