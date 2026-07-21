import React, { createContext, useContext } from 'react'
import { usePortalState } from '../hooks/usePortalState'
import { usePortalSync } from '../hooks/usePortalSync'

type PortalStateValue = ReturnType<typeof usePortalState>

const PortalContext = createContext<PortalStateValue | null>(null)

interface PortalProviderProps {
  children: React.ReactNode
}

function PortalSyncExecutor() {
  usePortalSync()
  return null
}

export function PortalProvider({ children }: PortalProviderProps) {
  const state = usePortalState()
  return (
    <PortalContext.Provider value={state}>
      <PortalSyncExecutor />
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider')
  }
  return context
}
