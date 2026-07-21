"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

import { RegistrationMarks } from "./RegistrationMarks"

/**
 * Glitch / chromatic-aberration hover effects (T8b ornament).
 *
 * Decorative only. Both exports gate on framer-motion's `useReducedMotion()`:
 * when the visitor prefers reduced motion they render a plain, static element
 * with no hover motion (registration marks still render, since they are
 * static).
 */

type GlitchTag = "h1" | "h2" | "h3" | "span" | "div"

const motionTag = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  span: motion.span,
  div: motion.div,
} as const

const ghostTransition = { duration: 0.12, ease: "easeOut" as const }

/**
 * Wraps heading text and, on hover, splits two colour-offset ghost copies
 * (signal-orange + volt) out from behind the real text for a subtle RGB /
 * chromatic-aberration fringe. The real text stays fully opaque on top, so
 * legibility is never reduced.
 */
export function GlitchText({
  children,
  className,
  as = "span",
}: {
  children: React.ReactNode
  className?: string
  as?: GlitchTag
}) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  const Motion = motionTag[as] as React.ElementType

  return (
    <Motion
      className={cn("relative inline-block", className)}
      initial="rest"
      animate="rest"
      whileHover="hover"
    >
      <span className="relative z-10">{children}</span>
      <motion.span
        aria-hidden
        className="ornament-glitch-ghost pointer-events-none absolute inset-0 z-0 text-accent select-none"
        variants={{
          rest: { x: 0, y: 0, opacity: 0 },
          hover: { x: -2, y: 1, opacity: 0.75 },
        }}
        transition={ghostTransition}
      >
        {children}
      </motion.span>
      <motion.span
        aria-hidden
        className="ornament-glitch-ghost pointer-events-none absolute inset-0 z-0 text-primary select-none"
        variants={{
          rest: { x: 0, y: 0, opacity: 0 },
          hover: { x: 2, y: -1, opacity: 0.75 },
        }}
        transition={ghostTransition}
      >
        {children}
      </motion.span>
    </Motion>
  )
}

// Transparent -> tinted chromatic split drawn as two offset, blur-less
// box-shadows (right = signal-orange, left = volt). Structurally identical
// strings so framer-motion interpolates offset + opacity smoothly.
const REST_SHADOW = "2px 0 0 0 rgba(255, 77, 0, 0), -2px 0 0 0 rgba(200, 255, 0, 0)"
const HOVER_SHADOW =
  "3px 0 0 0 rgba(255, 77, 0, 0.55), -3px 0 0 0 rgba(200, 255, 0, 0.55)"

/**
 * Relative frame for a card. Provides the chromatic-aberration hover fringe and
 * (by default) corner registration marks. Intended to wrap a card's `<Link>`.
 */
export function GlitchCard({
  children,
  className,
  marks = true,
  markTone = "primary",
}: {
  children: React.ReactNode
  className?: string
  marks?: boolean
  markTone?: "primary" | "accent" | "muted"
}) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return (
      <div className={cn("relative", className)}>
        {children}
        {marks && <RegistrationMarks tone={markTone} />}
      </div>
    )
  }

  return (
    <motion.div
      className={cn("ornament-glitch-card relative", className)}
      style={{ boxShadow: REST_SHADOW }}
      whileHover={{ boxShadow: HOVER_SHADOW }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
      {marks && <RegistrationMarks tone={markTone} />}
    </motion.div>
  )
}
