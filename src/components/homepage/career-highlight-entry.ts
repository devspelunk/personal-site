import type { CareerEntry } from "@/payload-types"

/**
 * What the career timeline (`CareerHighlights`, a client component) shows.
 * Plain strings only: the richText `description` is rendered on the server and
 * arrives as `descriptionHtml`, so no Lexical JSON is sent to the browser.
 *
 * Lives outside the `"use client"` file so server pages can call the mapper.
 */
export type CareerHighlightEntry = Pick<
  CareerEntry,
  "id" | "role" | "company" | "date_start" | "date_end" | "highlight"
> & {
  /** Rendered description; omitted when the description is empty. */
  descriptionHtml?: string
}

/** Keeps only the fields the timeline shows. */
export const toCareerHighlightEntry = (
  { id, role, company, date_start, date_end, highlight }: CareerEntry,
  descriptionHtml?: string,
): CareerHighlightEntry => ({
  id,
  role,
  company,
  date_start,
  date_end,
  highlight,
  ...(descriptionHtml ? { descriptionHtml } : {}),
})
