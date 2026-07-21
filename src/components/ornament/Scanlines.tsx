/**
 * CRT scanline overlay (T8b ornament).
 *
 * Decorative only. Renders a single fixed, full-viewport element that draws
 * faint horizontal scanlines over the whole page. It is purely presentational
 * (no state, no motion), so it is safe as a server component and renders
 * identically under `prefers-reduced-motion: reduce`.
 *
 * Positioning/interaction is defined by the `.ornament-scanlines` utility in
 * `globals.css`: `position: fixed`, `pointer-events: none`, and `z-index: 40`
 * — above page content but below the terminal/command-palette modals
 * (z-50/z-60), so it never intercepts clicks or dims their text.
 *
 * Mount once, near the root of the `(site)` layout.
 */
export function Scanlines() {
  return <div aria-hidden className="ornament-scanlines" />
}
