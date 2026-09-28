import readingTime from "reading-time"

import {
  convertLexicalToHTMLAsync,
  defaultHTMLConvertersAsync,
  LinkHTMLConverterAsync,
  type HTMLConvertersAsync,
} from "@payloadcms/richtext-lexical/html-async"
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"

import { detailPathFor } from "@/lib/revalidate-paths"

import { type Heading, createUniqueSlug, highlightCodeToHtml } from "./rehype"

/**
 * Lexical → HTML render path (workstream B). Mirrors `renderMarkdown`'s
 * `{ html, headings, readTime }` contract so each page swaps a single call and
 * keeps `dangerouslySetInnerHTML` + `<TableOfContents>` unchanged.
 *
 * Built on `@payloadcms/richtext-lexical/html-async`'s `convertLexicalToHTMLAsync`
 * (the async variant lives under `/html-async`, not `/html`) with custom
 * converters for the pieces the defaults don't cover: the `CodeBlock` block,
 * the custom inline-image node, internal links, and heading ids/TOC.
 */

// Minimal HTML-attribute escaper. `escape-html` (used by Payload's own
// converters) is not a resolvable dependency here, so we inline the same
// five-character replacement Payload uses.
const escapeHTML = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const ALLOWED_HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"])

type LexicalNodeLike = {
  type?: string
  text?: string
  alt?: string
  fields?: { blockType?: string; code?: string; language?: string | null }
  children?: LexicalNodeLike[]
}

// Inline element nodes whose text flows into the surrounding sentence. Any
// other element (list, listitem, quote, table cell, …) is block-level, so its
// text is fenced with newlines — otherwise adjacent items run together
// ("Fire" + "Ice" → "FireIce") and skew word counts, slugs, and excerpts.
const INLINE_ELEMENT_TYPES = new Set(["link", "autolink"])

// Concatenates the readable text of a Lexical subtree: text nodes, inline-image
// alt text, and stored code, with line breaks/tabs and block boundaries kept as
// whitespace. Feeds heading slugs, reading-time, and plain-text excerpts.
const collectText = (node: LexicalNodeLike | undefined, out: string[]): void => {
  if (!node) return

  if (node.type === "text" && typeof node.text === "string") {
    out.push(node.text)
    return
  }
  if (node.type === "linebreak") {
    out.push("\n")
    return
  }
  if (node.type === "tab") {
    out.push("\t")
    return
  }
  if (node.type === "inlineImage" && node.alt) {
    out.push(node.alt)
    return
  }
  if (node.type === "block" && node.fields?.blockType === "Code" && node.fields.code) {
    out.push("\n", node.fields.code, "\n")
    return
  }
  if (Array.isArray(node.children)) {
    const isBlock = !INLINE_ELEMENT_TYPES.has(node.type ?? "")
    if (isBlock) out.push("\n")
    for (const child of node.children) collectText(child, out)
    if (isBlock) out.push("\n")
  }
}

// Joins collected segments, collapsing the newline fences block boundaries add
// so each boundary reads as a single line break.
const joinText = (out: string[]): string =>
  out.join("").replace(/[ \t]*\n\s*/g, "\n").trim()

const nodesToPlainText = (nodes: LexicalNodeLike[] | undefined): string => {
  const out: string[] = []
  for (const node of nodes ?? []) collectText(node, out)
  return joinText(out)
}

/**
 * AST → plain text walker feeding `reading-time`. Reused by the reading-time
 * sites (via `renderLexical`'s `readTime`) so word counts stay consistent.
 * Top-level blocks are separated by a blank line, nested blocks (list items,
 * quote lines) and line breaks by a single newline.
 */
export function lexicalToPlainText(data: SerializedEditorState | null | undefined): string {
  const blocks: string[] = []
  for (const node of data?.root?.children ?? []) {
    const block = nodesToPlainText([node as LexicalNodeLike])
    if (block) blocks.push(block)
  }
  return blocks.join("\n\n")
}

// Node types that carry content even without any text (an image-only or
// divider-only body is still a body, as it was in Markdown).
const NON_TEXT_CONTENT_TYPES = new Set(["upload", "inlineImage", "block", "horizontalrule"])

const hasNonTextContent = (node: LexicalNodeLike | undefined): boolean =>
  !!node &&
  (NON_TEXT_CONTENT_TYPES.has(node.type ?? "") ||
    (node.children ?? []).some(hasNonTextContent))

/**
 * True when a richText value has no content: null/absent, or the editor was
 * cleared (Lexical stores an empty paragraph rather than null). The Lexical
 * equivalent of the old `!markdown?.trim()` checks.
 */
export function isLexicalEmpty(data: SerializedEditorState | null | undefined): boolean {
  const children = (data?.root?.children ?? []) as LexicalNodeLike[]
  return !children.some(hasNonTextContent) && lexicalToPlainText(data) === ""
}

// Internal links resolve to the doc's canonical detail route via the shared
// `detailPathFor` map (the Payload slug is NOT the URL path — e.g. `blog-posts`
// → `/blog/x`, `ttrpg-lore` → `/ttrpg/lore/x`). Requires the referenced doc to
// have been populated (render fetch depth ≥1); falls back to `#` otherwise.
const internalDocToHref: NonNullable<
  Parameters<typeof LinkHTMLConverterAsync>[0]["internalDocToHref"]
> = ({ linkNode }) => {
  const doc = linkNode.fields?.doc as
    | { relationTo?: string; value?: unknown }
    | undefined
  const relationTo = doc?.relationTo
  const value = doc?.value
  const slug =
    value && typeof value === "object" && "slug" in value
      ? String((value as { slug?: unknown }).slug ?? "")
      : undefined

  return relationTo && slug ? (detailPathFor(relationTo, slug) ?? "#") : "#"
}

/**
 * Builds the per-render converter map. Recreated for each `renderLexical` call
 * so the heading converter can close over this document's `headings`/`slugCounts`
 * and emit the same deterministic id sequence as `renderMarkdown`.
 */
export function buildLexicalConverters(ctx: {
  headings: Heading[]
  slugCounts: Map<string, number>
}): HTMLConvertersAsync {
  const { headings, slugCounts } = ctx

  return {
    ...defaultHTMLConvertersAsync,
    // Override the default link converter to resolve internal doc links.
    ...LinkHTMLConverterAsync({ internalDocToHref }),

    // Headings: stamp deterministic ids + collect the TOC, matching the hast
    // `addHeadingIds` pass `renderMarkdown` runs.
    heading: async ({ node, nodesToHTML, providedStyleTag }) => {
      const headingNode = node as unknown as LexicalNodeLike & { tag: string }
      const children = (await nodesToHTML({ nodes: node.children })).join("")
      const tag = ALLOWED_HEADING_TAGS.has(headingNode.tag) ? headingNode.tag : "h1"
      const text = nodesToPlainText(headingNode.children).trim()

      if (!text) {
        return `<${tag}${providedStyleTag}>${children}</${tag}>`
      }

      const id = createUniqueSlug(text, slugCounts)
      headings.push({ id, text, level: Number(tag.slice(1)) })

      return `<${tag}${providedStyleTag} id="${id}">${children}</${tag}>`
    },

    // Custom URL-image node → `<img src alt>`.
    inlineImage: ({ node }) => {
      const imageNode = node as unknown as { src?: string; alt?: string }
      const src = escapeHTML(imageNode.src ?? "")
      const alt = escapeHTML(imageNode.alt ?? "")
      return `<img src="${src}" alt="${alt}" />`
    },

    // BlocksFeature registers both a `block` and an `inlineBlock` node type; at
    // render time, block nodes are dispatched via `blocks[blockType]` /
    // `inlineBlocks[blockType]` (findConverterForNode), so these top-level keys
    // are never invoked — they exist only so the coverage assertion (keyed on
    // the enabled `block`/`inlineBlock` node types) is satisfied. We ship no
    // inline blocks, so `inlineBlock` renders nothing.
    block: () => "",
    inlineBlock: () => "",
    blocks: {
      // Multi-line code: emit the same highlighted markup as a ```lang fence.
      Code: async ({ node }) => {
        const fields = (node as unknown as LexicalNodeLike).fields ?? {}
        return highlightCodeToHtml({ code: fields.code ?? "", language: fields.language })
      },
    },
  } as HTMLConvertersAsync
}

/**
 * A concrete converter map instance used for the coverage assertion (which only
 * inspects keys) and re-exported as the "real" map from ./coverage.
 */
export const LEXICAL_CONVERTER_MAP = buildLexicalConverters({
  headings: [],
  slugCounts: new Map(),
})

export interface RenderLexicalOptions {
  /**
   * Optional resolver to populate upload/internal-link docs by id. Only needed
   * when `data` was fetched at depth 0; pages fetch their body at depth ≥1, so
   * Upload node values arrive as populated Media docs and this can be omitted.
   */
  populate?: Parameters<typeof convertLexicalToHTMLAsync>[0]["populate"]
}

/**
 * Renders a Lexical editor state to `{ html, headings, readTime }`.
 *
 * The caller must fetch `data` at **depth ≥1** (so Upload node values are
 * populated Media docs) or pass a `populate` fn — otherwise embedded uploads
 * render as empty strings.
 */
export async function renderLexical(
  data: SerializedEditorState,
  options: RenderLexicalOptions = {},
): Promise<{ html: string; headings: Heading[]; readTime: number }> {
  const { populate } = options
  const headings: Heading[] = []
  const slugCounts = new Map<string, number>()

  const html = await convertLexicalToHTMLAsync({
    data,
    converters: buildLexicalConverters({ headings, slugCounts }),
    disableContainer: true,
    populate,
  })

  const readTime = Math.ceil(readingTime(lexicalToPlainText(data)).minutes)

  return { html, headings, readTime }
}
