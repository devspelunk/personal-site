"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"

import { getAssetUrl } from "@/lib/assets"
import type { Testimonial } from "@/lib/types/directus"

import { SectionHeading } from "./SectionHeading"

const ROTATION_INTERVAL_MS = 6000

export const Testimonials = ({
  testimonials,
}: {
  testimonials: Testimonial[]
}) => {
  const [activeIndex, setActiveIndex] = useState(0)

  const advance = useCallback(
    () => setActiveIndex((i) => (i + 1) % testimonials.length),
    [testimonials.length]
  )

  useEffect(() => {
    if (testimonials.length <= 1) return
    const timer = setInterval(advance, ROTATION_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [advance, testimonials.length])

  if (testimonials.length === 0) return null

  const current = testimonials[activeIndex]

  return (
    <div>
      <SectionHeading command="$ cat testimonials.json" />

      <div className="relative min-h-[180px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-lg border border-border border-l-primary bg-card p-6"
            style={{ borderLeftWidth: 3 }}
          >
            <blockquote className="mb-4 text-sm leading-relaxed text-foreground italic">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            <div className="flex items-center gap-3">
              {current.author_photo && (
                <Image
                  src={getAssetUrl(current.author_photo)}
                  alt={current.author_name}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {current.author_name}
                </p>
                {current.author_role && (
                  <p className="text-xs text-muted-foreground">
                    {current.author_role}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {testimonials.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === activeIndex ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
