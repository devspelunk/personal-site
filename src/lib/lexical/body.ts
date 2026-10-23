import readingTime from "reading-time"

import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"

import {
  type Heading,
  type RenderLexicalOptions,
  isLexicalEmpty,
  lexicalToPlainText,
  renderLexical,
} from "./render"

/**
 * Article body module: the one place pages turn a richText value into what
 * they display. Owns four rules so no page re-derives them:
 *
 *  - **emptiness**: a null, absent or cleared body is empty (`isEmpty`).
 *  - **read time**: whole minutes (at least 1), or `null` for an empty body, so
 *    nothing ever shows "0 min read".
 *  - **excerpt**: the stored summary when it has text, else the body's plain
 *    text cut to {@link EXCERPT_LENGTH} characters on a word boundary.
 *  - **safety**: `html` is safe to inject as-is; see the output-safety note in
 *    ./render.ts. No page or client view sanitizes again.
 *
 * `renderBody` is for pages that show the body. `bodyReadTime` and
 * `bodyExcerpt` are the same rules for lists, metadata and the search index,
 * which only need one number or string and can fetch the body at depth 0.
 */

type RichText = SerializedEditorState | null | undefined

/** Upper bound for a derived excerpt, sized for meta descriptions. */
export const EXCERPT_LENGTH = 160

// A word boundary is only used when it keeps at least this much of the cut;
// otherwise one very long word would shrink the excerpt to almost nothing.
const MIN_WORD_BOUNDARY = EXCERPT_LENGTH / 2

export interface RenderedBody {
  /** Rendered markup, safe to inject (see ./render.ts). */
  html: string
  /** Headings with their ids, in document order, for the table of contents. */
  headings: Heading[]
  /** Whole minutes, or `null` when the body is empty. */
  readTime: number | null
  /** Stored summary, else derived from the body; `null` when neither has text. */
  excerpt: string | null
  isEmpty: boolean
}

/**
 * Read time in whole minutes, or `null` for an empty body. A body with content
 * but no words (image-only, divider-only) still reads as one minute, never 0.
 */
export function bodyReadTime(body: RichText): number | null {
  if (isLexicalEmpty(body)) return null
  return Math.max(1, Math.ceil(readingTime(lexicalToPlainText(body)).minutes))
}

/**
 * The excerpt rule: a stored summary (`excerpt`, `short_description`) wins when
 * it has text; otherwise the body's plain text, whitespace collapsed, cut to
 * {@link EXCERPT_LENGTH} characters on a word boundary with an ellipsis.
 */
export function bodyExcerpt(body: RichText, stored?: string | null): string | null {
  const summary = stored?.trim()
  if (summary) return summary

  const plain = lexicalToPlainText(body).replace(/\s+/g, " ").trim()
  if (!plain) return null
  if (plain.length <= EXCERPT_LENGTH) return plain

  const cut = plain.slice(0, EXCERPT_LENGTH - 1)
  const boundary = cut.lastIndexOf(" ")
  const kept = boundary >= MIN_WORD_BOUNDARY ? cut.slice(0, boundary) : cut
  return `${kept.trimEnd()}…`
}

/**
 * Renders a richText body for display. Fetch it at depth ≥1 (or pass
 * `populate`) so embedded uploads render; see `renderLexical`.
 */
export async function renderBody(
  body: RichText,
  options: RenderLexicalOptions & { excerpt?: string | null } = {},
): Promise<RenderedBody> {
  const { excerpt: stored, ...renderOptions } = options
  const { html, headings } = await renderLexical(body, renderOptions)

  return {
    html,
    headings,
    readTime: bodyReadTime(body),
    excerpt: bodyExcerpt(body, stored),
    isEmpty: isLexicalEmpty(body),
  }
}
