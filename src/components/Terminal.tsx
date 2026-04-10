"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  type TerminalProps,
  type TerminalLine,
  isClearCommandResult,
  runTerminalCommand,
} from "@/components/terminalCommands"
import { useTerminal } from "@/components/TerminalContext"
import { cn } from "@/lib/utils"

export type { TerminalProps } from "@/components/terminalCommands"

function createWelcomeLine(): TerminalLine {
  return {
    id: crypto.randomUUID(),
    type: "output",
    content: "Welcome to michael.terminal — type 'help' for commands.",
  }
}

function makeInputLine(text: string): TerminalLine {
  return {
    id: crypto.randomUUID(),
    type: "input",
    content: (
      <>
        <span className="text-accent">visitor@michael:~$ </span>
        <span className="text-foreground">{text}</span>
      </>
    ),
  }
}

export function Terminal(props: TerminalProps) {
  const router = useRouter()
  const { open, setOpen } = useTerminal()

  const [lines, setLines] = React.useState<TerminalLine[]>(() => [
    createWelcomeLine(),
  ])
  const [inputValue, setInputValue] = React.useState("")

  const inputRef = React.useRef<HTMLInputElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [lines])

  React.useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  React.useEffect(() => {
    function isTypingInField() {
      const el = document.activeElement
      if (!el) return false
      const tag = el.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return true
      if (el instanceof HTMLElement && el.isContentEditable) return true
      return false
    }

    function onKeyDown(e: KeyboardEvent) {
      const isTerminalTrigger = e.key === "~" || e.key === "`"
      if (isTerminalTrigger && !open && !isTypingInField()) {
        e.preventDefault()
        setOpen(true)
        return
      }

      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, setOpen])

  function close() {
    setOpen(false)
  }

  function submitLine() {
    const raw = inputValue
    const trimmed = raw.trim()
    setInputValue("")

    if (!trimmed) {
      return
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean)

    const inputLine = makeInputLine(trimmed)

    const helpers = {
      navigate: (path: string) => {
        router.push(path)
      },
      close,
    }

    const output = runTerminalCommand(tokens, raw, props, helpers)

    if (isClearCommandResult(output)) {
      setLines([createWelcomeLine()])
      return
    }

    setLines((prev) => [...prev, inputLine, ...output])
  }

  function onKeyDownInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      submitLine()
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      close()
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="terminal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-background/80"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <motion.div
            key="terminal-panel"
            role="dialog"
            aria-label="Terminal"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed right-0 bottom-0 left-0 z-60 flex h-[60vh] max-h-[600px] flex-col rounded-t-lg border border-[#30363d] bg-[#0d1117] font-mono text-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#30363d] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#f85149]" />
                <span className="h-3 w-3 rounded-full bg-[#d29922]" />
                <span className="h-3 w-3 rounded-full bg-[#3fb950]" />
                <span className="ml-1 text-xs text-muted-foreground">
                  michael.terminal
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-[#21262d] hover:text-foreground"
                aria-label="Close terminal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    "py-0.5 wrap-break-word whitespace-pre-wrap",
                    line.type === "output" &&
                      (line.tone === "destructive"
                        ? "text-destructive"
                        : "text-foreground")
                  )}
                >
                  {line.content}
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-[#30363d] px-3 py-2">
              <div className="flex items-center gap-1">
                <span className="shrink-0 text-accent">
                  {"visitor@michael:~$ "}
                </span>
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={onKeyDownInput}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-foreground caret-transparent ring-0 outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Terminal input"
                />
                <span
                  className="inline-block h-4 w-1.5 shrink-0 bg-primary motion-safe:animate-[blink_1s_step-end_infinite]"
                  aria-hidden
                />
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
