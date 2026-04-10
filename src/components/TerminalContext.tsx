"use client"

import * as React from "react"

type TerminalContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const TerminalContext = React.createContext<TerminalContextValue | undefined>(
  undefined
)

function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  const value = React.useMemo(() => ({ open, setOpen }), [open])

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  )
}

function useTerminal() {
  const ctx = React.useContext(TerminalContext)
  if (!ctx) {
    throw new Error("useTerminal must be used within a TerminalProvider")
  }
  return ctx
}

export { TerminalProvider, useTerminal }
