import { cn } from "@/lib/utils"

type VectorShape = "star" | "arrow" | "chevron"

/**
 * Flat vector punctuation (T8b ornament).
 *
 * Decorative only. Renders a small, flat SVG glyph — a four-point star (`✦`),
 * an arrow, or a chevron — as inline punctuation for the hero and section
 * breaks. Colour follows `currentColor`, so set it with a text-colour utility
 * (e.g. `text-accent`, `text-primary`).
 *
 * Purely presentational (no hooks, no motion) — safe as a server component and
 * unaffected by `prefers-reduced-motion`.
 */
export function VectorAccent({
  shape = "star",
  className,
}: {
  shape?: VectorShape
  className?: string
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cn("inline-block size-3.5", className)}
    >
      {shape === "star" && (
        <path
          d="M12 1.5 14.4 9.6 22.5 12 14.4 14.4 12 22.5 9.6 14.4 1.5 12 9.6 9.6Z"
          fill="currentColor"
        />
      )}
      {shape === "arrow" && (
        <path
          d="M3 12h15m0 0-5.5-5.5M18 12l-5.5 5.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      )}
      {shape === "chevron" && (
        <path
          d="m8 4 8 8-8 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      )}
    </svg>
  )
}
