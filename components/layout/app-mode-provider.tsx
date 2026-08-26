'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type AppMode = 'personal' | 'work'

const STORAGE_KEY = 'pmd-app-mode'

type AppModeContextValue = {
  mode: AppMode
  setMode: (mode: AppMode) => void
}

const AppModeContext = createContext<AppModeContextValue | null>(null)

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('personal')

  useEffect(() => {
    const savedMode = window.localStorage.getItem(STORAGE_KEY)
    if (savedMode === 'personal' || savedMode === 'work') setModeState(savedMode)
  }, [])

  const setMode = useCallback((nextMode: AppMode) => {
    setModeState(nextMode)
    window.localStorage.setItem(STORAGE_KEY, nextMode)
  }, [])

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode])

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}

export function useAppMode() {
  const context = useContext(AppModeContext)
  if (!context) throw new Error('useAppMode must be used within AppModeProvider')
  return context
}
