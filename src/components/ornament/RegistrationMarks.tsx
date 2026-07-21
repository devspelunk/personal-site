import { cn } from "@/lib/utils"

/**
 * Corner crop / registration marks (T8b ornament).
 *
 * Decorative only. Renders four small L-shaped brackets, one per corner, as an
 * absolutely-positioned, non-interactive overlay. Drop it inside any
 * `position: relative` container (card, section frame); it fills the container
 * via `inset-0` and hangs its brackets on the corners.
 *
 * Purely presentational (no hooks), so it is safe as a server component and is
 * unaffected by `prefers-reduced-motion`.
 */
export function RegistrationMarks({
  className,
  tone = "primary",
  /** Bracket arm length in px. */
  size = 9,
  /** Distance of each bracket from the container edge, in px. */
  inset = 5,
}: {
  className?: string
  tone?: "primary" | "accent" | "muted"
  size?: number
  inset?: number
}) {
  const color =
    tone === "accent"
      ? "border-accent"
      : tone === "muted"
        ? "border-muted-foreground"
        : "border-primary"

  const armStyle = { width: size, height: size }

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-10", className)}
    >
      <span
        className={cn("absolute border-t border-l", color)}
        style={{ top: inset, left: inset, ...armStyle }}
      />
      <span
        className={cn("absolute border-t border-r", color)}
        style={{ top: inset, right: inset, ...armStyle }}
      />
      <span
        className={cn("absolute border-b border-l", color)}
        style={{ bottom: inset, left: inset, ...armStyle }}
      />
      <span
        className={cn("absolute border-b border-r", color)}
        style={{ bottom: inset, right: inset, ...armStyle }}
      />
    </div>
  )
}
