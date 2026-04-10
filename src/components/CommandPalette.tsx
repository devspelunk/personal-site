"use client"

import * as React from "react"
import Fuse from "fuse.js"
import {
  Code2,
  FileText,
  LayoutDashboard,
  Swords,
  Terminal,
} from "lucide-react"
import { useRouter } from "next/navigation"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useCommandPalette } from "@/components/CommandPaletteContext"
import { useTerminal } from "@/components/TerminalContext"
import { cn } from "@/lib/utils"

type SearchEntryType =
  | "page"
  | "blog"
  | "project"
  | "journal"
  | "character"
  | "lore"
  | "homebrew"

type SearchEntry = {
  id: string
  type: SearchEntryType
  title: string
  description: string | null
  tags: string[]
  slug: string
  url: string
}

type GroupKey = "page" | "blog" | "project" | "ttrpg"

const groupMeta: Record<
  GroupKey,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  page: { label: "Pages", Icon: LayoutDashboard },
  blog: { label: "Blog", Icon: FileText },
  project: { label: "Projects", Icon: Code2 },
  ttrpg: { label: "TTRPG", Icon: Swords },
}

function toGroupKey(type: SearchEntryType): GroupKey {
  if (
    type === "journal" ||
    type === "character" ||
    type === "lore" ||
    type === "homebrew"
  ) {
    return "ttrpg"
  }
  return type
}

export function CommandPalette() {
  const router = useRouter()
  const { open, setOpen } = useCommandPalette()
  const { setOpen: setTerminalOpen } = useTerminal()

  const [query, setQuery] = React.useState("")
  const [index, setIndex] = React.useState<SearchEntry[] | null>(null)
  const [results, setResults] = React.useState<SearchEntry[]>([])
  const [indexLoadState, setIndexLoadState] = React.useState<
    "idle" | "loading" | "error" | "success"
  >("idle")

  const hasFetchedIndexRef = React.useRef(false)
  const fuseRef = React.useRef<Fuse<SearchEntry> | null>(null)

  React.useEffect(() => {
    if (!open || index !== null || hasFetchedIndexRef.current) return
    if (indexLoadState === "loading") return

    setIndexLoadState("loading")
    ;(async () => {
      const res = await fetch("/search-index.json")
      if (!res.ok) throw new Error("Failed to load search index")
      const entries = (await res.json()) as SearchEntry[]

      setIndex(entries)
      setResults(entries)
      fuseRef.current = new Fuse(entries, {
        keys: ["title", "description", "tags"],
        threshold: 0.35,
      })
      hasFetchedIndexRef.current = true
      setIndexLoadState("success")
    })().catch((error) => {
      console.error("[CommandPalette] Failed to load search index:", error)
      setResults([])
      fuseRef.current = null
      hasFetchedIndexRef.current = false
      setIndexLoadState("error")
    })
  }, [open, index, indexLoadState])

  React.useEffect(() => {
    const q = query.trim()
    if (!index) return

    if (!q) {
      setResults(index)
      return
    }

    const fuse = fuseRef.current
    if (!fuse) {
      setResults([])
      return
    }

    setResults(fuse.search(q).map((r) => r.item))
  }, [query, index])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
        return
      }

      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [setOpen])

  const grouped = React.useMemo(() => {
    const buckets: Record<GroupKey, SearchEntry[]> = {
      page: [],
      blog: [],
      project: [],
      ttrpg: [],
    }

    for (const entry of results) {
      buckets[toGroupKey(entry.type)].push(entry)
    }

    return buckets
  }, [results])

  const groupsInOrder: GroupKey[] = ["page", "blog", "project", "ttrpg"]

  function onSelectEntry(entry: SearchEntry) {
    router.push(entry.url)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="border-b border-[#21262d]">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search…"
        />
      </div>
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {groupsInOrder.map((key) => {
          const entries = grouped[key]
          if (!entries.length) return null

          const { Icon, label } = groupMeta[key]

          return (
            <CommandGroup
              key={key}
              heading={
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {label}
                </span>
              }
            >
              {entries.map((entry) => (
                <CommandItem
                  key={`${entry.type}:${entry.id}`}
                  value={entry.url}
                  onSelect={() => onSelectEntry(entry)}
                  className="items-start"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-foreground">
                        {entry.title}
                      </span>
                      {entry.tags.length ? (
                        <span className="hidden shrink-0 gap-1 text-[10px] text-muted-foreground sm:flex">
                          {entry.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded-none border border-[#21262d] px-1 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>
                    {entry.description ? (
                      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {entry.description}
                      </div>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}

        <CommandSeparator />
        <CommandItem
          onSelect={() => {
            setOpen(false)
            setTerminalOpen(true)
          }}
        >
          <Terminal className={cn("size-4 text-muted-foreground")} />
          Open Terminal
        </CommandItem>
      </CommandList>
    </CommandDialog>
  )
}
