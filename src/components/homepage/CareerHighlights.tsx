"use client"

import Link from "next/link"
import { motion } from "framer-motion"

import { slideUp } from "@/lib/animations"
import type { CareerEntry } from "@/lib/types/directus"
import { cn } from "@/lib/utils"

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

export const CareerHighlights = ({ entries }: { entries: CareerEntry[] }) => (
  <div>
    <SectionHeading command="$ history --career" />

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
        </motion.div>
      ))}
    </div>

    <Link
      href="/about"
      className="mt-4 inline-block text-sm text-primary hover:underline"
    >
      View full career →
    </Link>
  </div>
)
