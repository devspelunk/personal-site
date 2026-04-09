"use client"

import { useEffect, useState } from "react"

import type { Heading } from "@/lib/markdown"

import { cn } from "@/lib/utils"

const indentForLevel = (level: number) => {
  if (level <= 2) return ""
  if (level === 3) return "pl-3"
  return "pl-6"
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null
  )

  useEffect(() => {
    if (headings.length === 0) return

    const article = document.getElementById("blog-post-content")
    if (!article) return

    const elements = Array.from(
      article.querySelectorAll("h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]")
    ) as HTMLElement[]

    if (elements.length === 0) return

    const updateActive = () => {
      const offset = 100
      let current = elements[0]?.id ?? null
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= offset) {
          current = el.id
        }
      }
      if (current) setActiveId(current)
    }

    const observer = new IntersectionObserver(updateActive, {
      rootMargin: "-80px 0px -55% 0px",
      threshold: [0, 1],
    })

    elements.forEach((el) => observer.observe(el))
    window.addEventListener("scroll", updateActive, { passive: true })
    updateActive()

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", updateActive)
    }
  }, [headings])

  if (headings.length === 0) return null

  const list = (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {headings.map((h) => (
        <li key={h.id} className={indentForLevel(h.level)}>
          <a
            href={`#${h.id}`}
            className={cn(
              "block border-l-2 border-transparent py-0.5 pl-2 transition-colors hover:text-foreground",
              activeId === h.id && "border-primary pl-2 text-primary"
            )}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="w-full shrink-0 lg:w-52">
      <div className="mb-8 lg:hidden">
        <details className="rounded-lg border border-border bg-card">
          <summary className="cursor-pointer px-3 py-2 font-mono text-sm text-primary">
            On this page
          </summary>
          <div className="border-t border-border px-3 py-3">{list}</div>
        </details>
      </div>

      <aside className="hidden lg:block">
        <nav
          aria-label="On this page"
          className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
        >
          <p className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            On this page
          </p>
          {list}
        </nav>
      </aside>
    </div>
  )
}
