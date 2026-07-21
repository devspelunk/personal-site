import { cn } from "@/lib/utils"

/**
 * Deterministically format a technical index code like `BLOG-042` for the
 * DataStrip decal.
 *
 * - Pass a `number` seed (e.g. a list index) for a clean sequential code.
 * - Pass a `string` seed (e.g. a slug) to derive a stable 3-digit code via a
 *   small hash, so a given document always shows the same number.
 */
export function formatDataStripCode(
  prefix: string,
  seed: string | number
): string {
  let n: number
  if (typeof seed === "number") {
    n = Math.abs(Math.trunc(seed))
  } else {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0
    }
    n = Math.abs(hash)
  }
  return `${prefix.toUpperCase()}-${String(n % 1000).padStart(3, "0")}`
}

/**
 * Barcode / readout decal (T8b ornament).
 *
 * Decorative only. Renders a small mono strip: a CSS barcode motif (the
 * `.ornament-barcode` utility) followed by a technical index code and any
 * extra metadata items (slug, date, ...). The barcode + code lean on the
 * signal-orange `--accent` token to give the accent more presence.
 *
 * Purely presentational (no hooks) — safe as a server component, unaffected by
 * `prefers-reduced-motion`.
 */
export function DataStrip({
  code,
  items = [],
  className,
}: {
  /** Technical index code, e.g. `BLOG-042`. Build one via `formatDataStripCode`. */
  code: string
  /** Additional readout fields rendered after the code (slug, date, ...). */
  items?: string[]
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase",
        className
      )}
    >
      <span className="ornament-barcode h-3 w-8 shrink-0 text-accent" />
      <span className="shrink-0 text-accent">{code}</span>
      {items.map((item, i) => (
        <span key={i} className="flex min-w-0 items-center gap-2">
          <span className="text-border">/</span>
          <span className="truncate">{item}</span>
        </span>
      ))}
    </div>
  )
}
