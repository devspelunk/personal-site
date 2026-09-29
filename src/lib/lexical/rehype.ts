import type { Options as RehypePrettyCodeOptions } from "rehype-pretty-code"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeStringify from "rehype-stringify"
import { remark } from "remark"
import { visit } from "unist-util-visit"

/**
 * Shared render primitives for the two long-form content pipelines.
 *
 * `renderMarkdown` (src/lib/markdown.ts) and `renderLexical` (./render.ts) must
 * emit **identical** highlighted code and heading ids. Rather than duplicate the
 * `rehype-pretty-code`/`vesper` config and slug logic, both import it from here.
 *
 * NOTE on the tail split: the T2 plan sketched a single `applyRehypeTail(html)`
 * that re-parses an HTML string with `rehype-parse`. `rehype-parse` is not a
 * resolvable dependency in this repo (pnpm strict-links it as a transitive of
 * `rehype-pretty-code` only, and this ticket may not add deps), so the shared
 * pieces are factored as primitives instead: `renderMarkdown` keeps its single
 * remark→rehype pipeline (output byte-for-byte unchanged) and `renderLexical`
 * highlights each code block through {@link highlightCodeToHtml} — the *same*
 * `rehype-pretty-code` invocation on an equivalent code node, so the markup
 * matches exactly.
 */

export interface Heading {
  id: string
  text: string
  level: number
}

interface HtmlElementNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HtmlElementNode[]
  value?: string
}

/**
 * The single `rehype-pretty-code` config both pipelines highlight with. A
 * cohesive low-chroma dark theme (warm greys + amber) that sits with the
 * acid-on-dark palette; the code-block surface is themed via globals.css.
 */
export const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: "vesper",
  keepBackground: false,
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

/**
 * Deterministic heading-id generator. Shared so `renderMarkdown` (hast visit)
 * and `renderLexical` (converter walk) produce the same `section`, `section-2`,
 * … dedup sequence for a given document.
 */
export const createUniqueSlug = (text: string, slugCounts: Map<string, number>) => {
  const baseSlug = slugify(text) || "section"
  const nextCount = (slugCounts.get(baseSlug) ?? 0) + 1
  slugCounts.set(baseSlug, nextCount)

  return nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`
}

const getHtmlNodeText = (node: HtmlElementNode): string => {
  if (node.type === "text" && typeof node.value === "string") {
    return node.value
  }

  if (Array.isArray(node.children)) {
    return node.children.map(getHtmlNodeText).join("")
  }

  return ""
}

/**
 * rehype plugin factory that stamps deterministic ids onto `h1`–`h6` elements
 * and records them (for the table of contents). Used by `renderMarkdown`; the
 * Lexical path reuses {@link createUniqueSlug} directly in its heading converter
 * so the two id sequences stay aligned.
 */
export const createHeadingIdsPlugin = (
  headings: Heading[],
  slugCounts: Map<string, number>,
) => {
  return () => (tree: HtmlElementNode) => {
    visit(tree, "element", (node) => {
      const headingNode = node as HtmlElementNode
      const tagName = headingNode.tagName ?? ""

      if (!/^h[1-6]$/.test(tagName)) {
        return
      }

      const text = getHtmlNodeText(headingNode).trim()

      if (!text) {
        return
      }

      const id = createUniqueSlug(text, slugCounts)
      const level = Number(tagName.slice(1))
      headingNode.properties = { ...(headingNode.properties ?? {}), id }

      headings.push({ id, text, level })
    })
  }
}

// A hast processor (no markdown parse step is ever invoked): we feed it a
// hand-built code tree via `.run()` and compile with `rehype-stringify`. This
// yields the exact same output `renderMarkdown` gets from a ```lang fence.
const codeHighlightProcessor = remark()
  .use(rehypePrettyCode, rehypePrettyCodeOptions)
  .use(rehypeStringify)

/**
 * Highlights a single code block to the same HTML `renderMarkdown` produces for
 * an equivalent ` ```<language> ` fence. Builds the minimal hast that
 * `mdast-util-to-hast` would emit for a fenced code block (`<pre><code
 * class="language-<lang>">…\n</code></pre>`) and runs it through the shared
 * `rehype-pretty-code` config — guaranteeing byte-identical highlighting.
 */
export async function highlightCodeToHtml(args: {
  code: string
  language?: string | null
}): Promise<string> {
  const { code, language } = args
  // Mirror `mdast-util-to-hast`'s code handler exactly: className only when a
  // language is present, and text is `value ? value + "\n" : ""` (empty code
  // yields an empty text node, not a lone "\n").
  const properties = language ? { className: [`language-${language}`] } : {}
  const value = code ? `${code.replace(/\n$/, "")}\n` : ""

  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "pre",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "code",
            properties,
            children: [{ type: "text", value }],
          },
        ],
      },
    ],
  }

  const transformed = await codeHighlightProcessor.run(
    tree as Parameters<typeof codeHighlightProcessor.run>[0],
  )

  return codeHighlightProcessor.stringify(
    transformed as Parameters<typeof codeHighlightProcessor.stringify>[0],
  )
}
