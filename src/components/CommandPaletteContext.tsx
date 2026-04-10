"use client"

import * as React from "react"

type CommandPaletteContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const CommandPaletteContext = React.createContext<
  CommandPaletteContextValue | undefined
>(undefined)

function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  const value = React.useMemo(() => ({ open, setOpen }), [open])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider"
    )
  }
  return ctx
}

export { CommandPaletteProvider, useCommandPalette }
