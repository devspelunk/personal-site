"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { staggerChildren, staggerItem } from "@/lib/animations"
import type { TechStackItem } from "@/lib/types/directus"

import { SectionHeading } from "./SectionHeading"

const TechCard = ({ item }: { item: TechStackItem }) => {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const isOpen = expanded || hovered || focused

  return (
    <motion.div
      variants={staggerItem}
      layout
      tabIndex={0}
      role="button"
      aria-expanded={isOpen}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.key === " ") e.preventDefault()
          setExpanded((v) => !v)
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      whileHover={{ scale: 1.03 }}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-primary">
          {item.icon_slug
            ? item.icon_slug.slice(0, 2).toUpperCase()
            : item.name.slice(0, 2).toUpperCase()}
        </div>
        <span className="font-mono text-sm font-semibold text-foreground">
          {item.name}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1 border-t border-border pt-3">
              {item.experience_years && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary">{item.experience_years}</span>{" "}
                  years experience
                </p>
              )}
              {item.context && (
                <p className="text-xs text-muted-foreground">{item.context}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const InteractiveTechStack = ({ items }: { items: TechStackItem[] }) => (
  <div>
    <SectionHeading command="$ cat tech-stack.json" />

    <motion.div
      variants={staggerChildren}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
    >
      {items.map((item) => (
        <TechCard key={item.id} item={item} />
      ))}
    </motion.div>
  </div>
)
