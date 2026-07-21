import { useState, useEffect } from 'react'
import { Tab } from '../types'
import { serviceDateMonthsAgo, currentServiceDate, usDateMonthsAgo, currentUsDate } from '../utils'

export function usePortalTabsAndTheme() {
  const [encounterInput, setEncounterInput] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('encounter') || localStorage.getItem('lifetrenz.lastEncounter') || ''
  })
  const [searchFromDate, setSearchFromDate] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.lastSearchFromDate') || serviceDateMonthsAgo(12)
  })
  const [searchToDate, setSearchToDate] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.lastSearchToDate') || currentServiceDate()
  })
  const [resultFromDate, setResultFromDate] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.lastResultFromDate') || usDateMonthsAgo(24)
  })
  const [resultToDate, setResultToDate] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.lastResultToDate') || currentUsDate()
  })
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search)
    const localTab = localStorage.getItem('lifetrenz.lastTab') as Tab | null
    if (
      localTab &&
      [
        'summary',
        'icdedits',
        'activity',
        'visit',
        'history',
        'results',
        'historic',
        'preload',
        'logs',
        'prompt',
        'api',
        'storage',
        'settings',
        'bulkxml',
        'bulkresub',
        'bypass',
        'bulkmnec',
        'raexcel'
      ].includes(localTab)
    )
      return localTab
    return 'summary'
  })

  const [theme, setTheme] = useState<string>(() => {
    const local = localStorage.getItem('lifetrenz.theme')
    if (local === 'dark' || local === 'hospital-dark' || local === 'google-material-dark') {
      return 'dark'
    }
    return 'light'
  })

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.primaryColor') || 'dark'
  })
  const [bgPalette, setBgPalette] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.bgPalette') || 'charcoal'
  })
  const [cornerRadius, setCornerRadius] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.cornerRadius') || 'sm'
  })
  const [activeFont, setActiveFont] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.activeFont') || 'Inter'
  })
  const [fontScale, setFontScale] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.fontScale') || 'standard'
  })
  const [spacingScale, setSpacingScale] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.spacingScale') || 'xs'
  })
  const [visualStyle, setVisualStyle] = useState<string>(() => {
    return localStorage.getItem('lifetrenz.visualStyle') || 'glassmorphic'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('lifetrenz.theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-primary-color', primaryColor)
    localStorage.setItem('lifetrenz.primaryColor', primaryColor)
  }, [primaryColor])

  useEffect(() => {
    document.documentElement.setAttribute('data-corner-radius', cornerRadius)
    localStorage.setItem('lifetrenz.cornerRadius', cornerRadius)
  }, [cornerRadius])

  useEffect(() => {
    document.documentElement.setAttribute('data-active-font', activeFont)
    localStorage.setItem('lifetrenz.activeFont', activeFont)
  }, [activeFont])

  useEffect(() => {
    localStorage.setItem('lifetrenz.fontScale', fontScale)
  }, [fontScale])

  useEffect(() => {
    localStorage.setItem('lifetrenz.spacingScale', spacingScale)
  }, [spacingScale])

  useEffect(() => {
    document.documentElement.setAttribute('data-visual-style', visualStyle)
    localStorage.setItem('lifetrenz.visualStyle', visualStyle)
  }, [visualStyle])

  useEffect(() => {
    const palettes: Record<
      string,
      {
        lightBg: string
        lightPanel: string
        lightSecondaryBg: string
        darkBg: string
        darkPanel: string
        darkSecondaryBg: string
      }
    > = {
      charcoal: {
        lightBg: '#fcfcfb',
        lightPanel: '#ffffff',
        lightSecondaryBg: '#ffffff',
        darkBg: '#141413',
        darkPanel: '#1e1e1e',
        darkSecondaryBg: '#2d2d2c'
      },
      slate: {
        lightBg: '#f1f3f5',
        lightPanel: '#ffffff',
        lightSecondaryBg: '#ffffff',
        darkBg: '#1a1b1e',
        darkPanel: '#25262b',
        darkSecondaryBg: '#2c2e33'
      },
      warm: {
        lightBg: '#fbfaf7',
        lightPanel: '#ffffff',
        lightSecondaryBg: '#ffffff',
        darkBg: '#1c1a16',
        darkPanel: '#24221d',
        darkSecondaryBg: '#2f2b25'
      },
      forest: {
        lightBg: '#f4f6f4',
        lightPanel: '#ffffff',
        lightSecondaryBg: '#ffffff',
        darkBg: '#141815',
        darkPanel: '#1b221d',
        darkSecondaryBg: '#232a25'
      }
    }

    const p = palettes[bgPalette] || palettes.charcoal
    const bgAppVal = theme === 'dark' ? p.darkBg : p.lightBg
    const bgPanelVal = theme === 'dark' ? p.darkPanel : p.lightPanel
    const secBgVal = theme === 'dark' ? p.darkSecondaryBg : p.lightSecondaryBg

    document.documentElement.style.setProperty('--bg-app', bgAppVal)
    document.documentElement.style.setProperty('--bg-panel', bgPanelVal)
    document.documentElement.style.setProperty('--action-secondary-bg', secBgVal)

    if (visualStyle === 'flat') {
      document.documentElement.style.setProperty('--backdrop-filter', 'none')
      document.documentElement.style.setProperty('--bg-translucent', bgPanelVal)
    } else {
      // Restore extremely efficient, GPU-optimized backdrop blur filter
      document.documentElement.style.setProperty('--backdrop-filter', 'blur(10px)')

      // Compute high-fidelity, high-performance alpha transparency based on selected palette
      let bgTranslucentVal = 'rgba(255, 255, 255, 0.65)'
      if (theme === 'dark') {
        if (bgPalette === 'slate') bgTranslucentVal = 'rgba(37, 38, 43, 0.6)'
        else if (bgPalette === 'warm') bgTranslucentVal = 'rgba(36, 34, 29, 0.6)'
        else if (bgPalette === 'forest') bgTranslucentVal = 'rgba(27, 34, 29, 0.6)'
        else bgTranslucentVal = 'rgba(30, 30, 30, 0.6)' // charcoal
      }
      document.documentElement.style.setProperty('--bg-translucent', bgTranslucentVal)
    }

    localStorage.setItem('lifetrenz.bgPalette', bgPalette)
  }, [bgPalette, theme, visualStyle])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const selectTab = (tab: Tab) => {
    setActiveTab(tab)
    localStorage.setItem('lifetrenz.lastTab', tab)
  }

  return {
    encounterInput,
    setEncounterInput,
    searchFromDate,
    setSearchFromDate,
    searchToDate,
    setSearchToDate,
    resultFromDate,
    setResultFromDate,
    resultToDate,
    setResultToDate,
    activeTab,
    setActiveTab,
    selectTab,
    theme,
    setTheme,
    toggleTheme,
    primaryColor,
    setPrimaryColor,
    bgPalette,
    setBgPalette,
    cornerRadius,
    setCornerRadius,
    activeFont,
    setActiveFont,
    fontScale,
    setFontScale,
    spacingScale,
    setSpacingScale,
    visualStyle,
    setVisualStyle
  }
}
