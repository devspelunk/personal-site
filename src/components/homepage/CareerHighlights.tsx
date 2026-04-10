"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useMemo } from "react"
import DOMPurify from "isomorphic-dompurify"

import { slideUp } from "@/lib/animations"
import type { CareerEntry } from "@/lib/types/directus"
import { articleBodyClass, cn } from "@/lib/utils"

import { SectionHeading } from "./SectionHeading"

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T|\s|$)/

const formatDate = (value: string) => {
  if (ISO_DATE_RE.test(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    }
  }
  return value
}

export const CareerHighlights = ({
  entries,
  showViewAll = true,
  command = "$ history --career",
  variant = "home",
}: {
  entries: (CareerEntry & { descriptionHtml?: string })[]
  showViewAll?: boolean
  command?: string
  variant?: "home" | "about"
}) => {
  const sanitizedDescriptionHtmlById = useMemo(() => {
    if (variant !== "about") {
      return {} as Record<string, string>
    }
    const map: Record<string, string> = {}
    for (const e of entries) {
      if (e.descriptionHtml) {
        map[e.id] = DOMPurify.sanitize(e.descriptionHtml)
      }
    }
    return map
  }, [entries, variant])

  return (
    <div>
      <SectionHeading command={command} />

      <div className="relative ml-4 border-l border-border pl-6">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            variants={slideUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className={cn("relative", i < entries.length - 1 && "pb-8")}
          >
            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />

            <p className="text-xs text-muted-foreground">
              {formatDate(entry.date_start)} –{" "}
              {entry.date_end ? formatDate(entry.date_end) : "Present"}
            </p>

            <h3 className="mt-1 font-mono text-sm font-semibold text-foreground">
              {entry.role}
            </h3>

            <p className="text-sm text-primary">{entry.company}</p>

            {entry.highlight && (
              <p className="mt-2 text-sm text-muted-foreground">
                {entry.highlight}
              </p>
            )}

            {variant === "about" && entry.descriptionHtml && (
              <div
                className={cn("mt-3", articleBodyClass)}
                dangerouslySetInnerHTML={{
                  __html: sanitizedDescriptionHtmlById[entry.id],
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {showViewAll && (
        <Link
          href="/about"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          View full career →
        </Link>
      )}
    </div>
  )
}
