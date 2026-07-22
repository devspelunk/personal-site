import { postgresAdapter } from "@payloadcms/db-postgres"
import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical"
import { buildConfig } from "payload"
import sharp from "sharp"
import { beforeAll, describe, expect, it } from "vitest"

import { Media } from "@/collections/Media"
import { assertConverterCoverage, buildEditorConfig, getEnabledNodeTypes } from "@/lib/lexical"
import { LEXICAL_CONVERTER_MAP } from "@/lib/lexical/render"
import { renderLexical, lexicalToPlainText } from "@/lib/lexical/render"
import { renderMarkdown } from "@/lib/markdown"

import {
  codeFixture,
  CODE_SAMPLE_MARKDOWN,
  fullFixture,
  headingsFixture,
  inlineImageFixture,
  internalLinksFixture,
  text,
  uploadFixture,
  uploadUnpopulatedFixture,
} from "./render.fixtures"
import {
  SNAPSHOT_HEADINGS,
  SNAPSHOT_HTML,
  SNAPSHOT_MARKDOWN,
  SNAPSHOT_READ_TIME,
} from "./render.snapshot"

// Mirrors inline-image.test.ts: buildConfig sanitizes the shared editor config
// (referencing only the `media` collection) without ever connecting to the DB.
async function getSharedEditorConfig(): Promise<SanitizedServerEditorConfig> {
  const config = await buildConfig({
    collections: [Media],
    db: postgresAdapter({
      pool: { connectionString: "postgres://localhost:5432/does-not-connect" },
    }),
    secret: "test-secret",
    sharp,
  })

  return buildEditorConfig(config)
}

let editorConfig: SanitizedServerEditorConfig

beforeAll(async () => {
  editorConfig = await getSharedEditorConfig()
})

describe("converter coverage", () => {
  it("registers a converter for every enabled feature node type", () => {
    const enabled = assertConverterCoverage({
      converters: LEXICAL_CONVERTER_MAP,
      editorConfig,
    })

    // Sanity: the feature set really does register the node types we handle.
    expect(enabled).toContain("block")
    expect(enabled).toContain("inlineImage")
    expect(enabled).toContain("upload")
  })

  it("provides a top-level `block` key (BlocksFeature registers one `block` node)", () => {
    expect("block" in LEXICAL_CONVERTER_MAP).toBe(true)
    // And the real render dispatch key for the CodeBlock.
    expect((LEXICAL_CONVERTER_MAP as { blocks?: Record<string, unknown> }).blocks).toHaveProperty(
      "Code",
    )
  })

  it("throws if the map is missing an enabled node type", () => {
    expect(() => assertConverterCoverage({ converters: {}, editorConfig })).toThrow(
      /coverage gap/i,
    )
  })
})

describe("renderMarkdown output is unchanged after the tail refactor", () => {
  it("matches the captured pre-refactor snapshot", async () => {
    const out = await renderMarkdown(SNAPSHOT_MARKDOWN)

    expect(out.html).toBe(SNAPSHOT_HTML)
    expect(out.headings).toEqual(SNAPSHOT_HEADINGS)
    expect(out.readTime).toBe(SNAPSHOT_READ_TIME)
  })
})

describe("renderLexical", () => {
  it("stamps deterministic heading ids and collects the TOC", async () => {
    const { html, headings } = await renderLexical(headingsFixture())

    expect(html).toContain('<h2 id="section">Section</h2>')
    expect(html).toContain('<h2 id="section-2">Section</h2>')
    expect(headings).toEqual([
      { id: "section", text: "Section", level: 2 },
      { id: "section-2", text: "Section", level: 2 },
    ])
  })

  it("highlights code identically to renderMarkdown for an equivalent fence", async () => {
    const { html } = await renderLexical(codeFixture())
    const md = await renderMarkdown(CODE_SAMPLE_MARKDOWN)

    // Highest-risk assertion: byte-identical shiki/vesper markup.
    expect(html.trim()).toBe(md.html.trim())
    expect(html).toContain('data-rehype-pretty-code-figure')
    expect(html).toContain('data-language="ts"')
  })

  it("renders the custom inline-image node as <img src alt>", async () => {
    const { html } = await renderLexical(inlineImageFixture())

    expect(html).toContain('<img src="/x.png" alt="an image" />')
  })

  it("renders an Upload/Media node as an <img> when populated (depth ≥1)", async () => {
    const { html } = await renderLexical(uploadFixture())

    expect(html).toContain("<img")
    expect(html).toContain('src="/media/pic.png"')
    expect(html).toContain('alt="uploaded"')
  })

  it("drops an Upload node when unpopulated (depth 0, no populate fn)", async () => {
    const { html } = await renderLexical(uploadUnpopulatedFixture())

    // Documents the depth ≥1 requirement: at depth 0 (no populate fn) the upload
    // silently vanishes.
    expect(html).not.toContain("<img")
  })

  it("resolves internal links to their canonical routes (Payload slug ≠ URL path)", async () => {
    const { html } = await renderLexical(internalLinksFixture())

    // blog-posts → /blog, ttrpg-lore → /ttrpg/lore (NOT /blog-posts, /ttrpg-lore).
    expect(html).toContain('href="/blog/hello"')
    expect(html).toContain('href="/ttrpg/lore/dragons"')
    expect(html).not.toContain('href="/blog-posts/')
    expect(html).not.toContain('href="/ttrpg-lore/')
    // External links pass through verbatim.
    expect(html).toContain('href="https://example.com"')
  })

  it("falls back to # for internal links to collections without a detail route", async () => {
    const { html } = await renderLexical(
      {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [
                {
                  type: "link",
                  fields: {
                    linkType: "internal",
                    doc: { relationTo: "media", value: { slug: "x" } },
                    newTab: false,
                  },
                  children: [text("no route")],
                },
              ],
            },
          ],
        },
      } as never,
    )

    expect(html).toContain('href="#"')
  })

  it("renders inline formatting (bold/italic/strikethrough/inline-code)", async () => {
    const { html } = await renderLexical(fullFixture())

    expect(html).toContain("<strong>bold</strong>")
    expect(html).toContain("<em>italic</em>")
    expect(html).toContain("line-through")
    expect(html).toContain("<code>code</code>")
  })

  it("computes a sane reading time", async () => {
    const { readTime } = await renderLexical(fullFixture())

    expect(readTime).toBeGreaterThanOrEqual(1)
    expect(Number.isFinite(readTime)).toBe(true)
  })
})

describe("lexicalToPlainText", () => {
  it("walks text, inline-image alt, and code into plain text", () => {
    const plain = lexicalToPlainText(fullFixture())

    expect(plain).toContain("Section")
    expect(plain).toContain("bold")
    expect(plain).toContain("an image")
    expect(plain).toContain("function greet")
  })

  it("returns an empty string for empty content", () => {
    const empty = { root: { type: "root", children: [] } } as never
    expect(lexicalToPlainText(empty)).toBe("")
  })

  it("does not treat a lone unformatted paragraph as containing markup", () => {
    const doc = {
      root: { type: "root", children: [{ type: "paragraph", children: [text("hi")] }] },
    } as never
    expect(lexicalToPlainText(doc)).toBe("hi")
  })
})
