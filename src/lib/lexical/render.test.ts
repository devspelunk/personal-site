import {
  convertMarkdownToLexical,
  type SanitizedServerEditorConfig,
} from "@payloadcms/richtext-lexical"
import readingTime from "reading-time"
import { beforeAll, describe, expect, it } from "vitest"

import { assertConverterCoverage, getEnabledBlockSlugs } from "@/lib/lexical/coverage"
import {
  buildLexicalConverters,
  isLexicalEmpty,
  lexicalToPlainText,
  renderLexical,
} from "@/lib/lexical/render"
import { assertRenderCoverage } from "@/lib/lexical/render-coverage"

import {
  codeFixture,
  fullFixture,
  headingsFixture,
  inlineImageFixture,
  internalLinksFixture,
  text,
  uploadFixture,
  uploadUnpopulatedFixture,
} from "./render.fixtures"
import { getTestEditorConfig, getTestPayloadConfig } from "./test-editor-config"

let editorConfig: SanitizedServerEditorConfig

beforeAll(async () => {
  editorConfig = await getTestEditorConfig()
})

describe("converter coverage", () => {
  const converters = () =>
    buildLexicalConverters({ headings: [], slugCounts: new Map() }) as Record<string, unknown>

  it("registers a converter for every enabled feature node type and block slug", () => {
    const enabled = assertConverterCoverage({ converters: converters(), editorConfig })

    // Sanity: the feature set really does register the node types we handle.
    expect(enabled).toContain("block")
    expect(enabled).toContain("inlineImage")
    expect(enabled).toContain("upload")
    expect(getEnabledBlockSlugs(editorConfig).blocks).toEqual(["Code"])
  })

  it("passes for the real renderer at Payload boot (onInit path)", async () => {
    const enabled = await assertRenderCoverage(await getTestPayloadConfig())

    expect(enabled).toContain("inlineImage")
  })

  it("throws if the map is missing an enabled node type", () => {
    expect(() => assertConverterCoverage({ converters: {}, editorConfig })).toThrow(
      /coverage gap/i,
    )
  })

  it("throws if an enabled block slug has no `blocks` converter", () => {
    const { blocks: _blocks, ...withoutBlocks } = converters()
    void _blocks
    expect(() => assertConverterCoverage({ converters: withoutBlocks, editorConfig })).toThrow(
      /blocks\.Code/,
    )
  })

  it("does not accept a top-level `block` key in place of per-slug converters", () => {
    const map = { ...converters(), block: () => "", blocks: {} }
    expect(() => assertConverterCoverage({ converters: map, editorConfig })).toThrow(
      /blocks\.Code/,
    )
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

  it("highlights a code block with the shiki/vesper markup", async () => {
    const { html } = await renderLexical(codeFixture())

    expect(html).toContain("data-rehype-pretty-code-figure")
    expect(html).toContain('data-language="ts"')
    expect(html).toMatchInlineSnapshot(`
      "<figure data-rehype-pretty-code-figure=""><pre tabindex="0" data-language="ts" data-theme="vesper"><code data-language="ts" data-theme="vesper" style="display: grid;"><span data-line=""><span style="color:#A0A0A0">const</span><span style="color:#FFF"> x</span><span style="color:#A0A0A0">:</span><span style="color:#FFC799"> number</span><span style="color:#A0A0A0"> =</span><span style="color:#FFC799"> 1</span></span>
      <span data-line=""><span style="color:#A0A0A0">function</span><span style="color:#FFC799"> greet</span><span style="color:#FFF">(name</span><span style="color:#A0A0A0">:</span><span style="color:#FFC799"> string</span><span style="color:#FFF">) {</span></span>
      <span data-line=""><span style="color:#A0A0A0">  return</span><span style="color:#99FFE4"> \`hi \${</span><span style="color:#FFF">name</span><span style="color:#99FFE4">}\`</span></span>
      <span data-line=""><span style="color:#FFF">}</span></span></code></pre></figure>"
    `)
  })

  it("renders a full document to stable html, headings and read time", async () => {
    const { html, headings, readTime } = await renderLexical(fullFixture())

    // Whitespace is normalized so Payload's converter formatting (newlines and
    // indentation inside tags) doesn't churn the snapshot on upgrades; the
    // markup itself stays pinned.
    const normalizedHtml = html.replace(/\s+/g, " ").replace(/> </g, "><").trim()

    expect(headings.map((h) => `${h.level}:${h.id}`)).toEqual(["1:title", "2:section", "2:section-2"])
    expect(readTime).toBe(1)
    expect(normalizedHtml).toMatchInlineSnapshot(`"<h1 id="title">Title</h1><h2 id="section">Section</h2><h2 id="section-2">Section</h2><p>Plain <strong>bold</strong><em>italic</em><span style="text-decoration: line-through;">strike</span><code>code</code></p><p><a href="https://example.com">external</a></p><p><a href="/blog/hello">internal</a></p><ul class="list-bullet"><li class="" style="" value="1" >one</li><li class="" style="" value="2" >two</li></ul><ol class="list-number"><li class="" style="" value="1" >first</li><li class="" style="" value="2" >second</li></ol><blockquote>a quote</blockquote><hr /><figure data-rehype-pretty-code-figure=""><pre tabindex="0" data-language="ts" data-theme="vesper"><code data-language="ts" data-theme="vesper" style="display: grid;"><span data-line=""><span style="color:#A0A0A0">const</span><span style="color:#FFF"> x</span><span style="color:#A0A0A0">:</span><span style="color:#FFC799"> number</span><span style="color:#A0A0A0"> =</span><span style="color:#FFC799"> 1</span></span><span data-line=""><span style="color:#A0A0A0">function</span><span style="color:#FFC799"> greet</span><span style="color:#FFF">(name</span><span style="color:#A0A0A0">:</span><span style="color:#FFC799"> string</span><span style="color:#FFF">) {</span></span><span data-line=""><span style="color:#A0A0A0"> return</span><span style="color:#99FFE4"> \`hi \${</span><span style="color:#FFF">name</span><span style="color:#99FFE4">}\`</span></span><span data-line=""><span style="color:#FFF">}</span></span></code></pre></figure><p>Before <img src="/x.png" alt="an image" /> after</p><img alt="uploaded" height="600" src="/media/pic.png" width="800" />"`)
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

describe("lexicalToPlainText whitespace", () => {
  const fromMarkdown = (markdown: string) =>
    lexicalToPlainText(convertMarkdownToLexical({ editorConfig, markdown }))

  it("separates list items instead of running them together", () => {
    const plain = fromMarkdown("- Fire\n- Ice\n- Lightning")
    expect(plain).toBe("Fire\nIce\nLightning")
  })

  it("separates nested list items", () => {
    const plain = fromMarkdown("- Elements\n  - Fire\n  - Ice")
    expect(plain.split(/\s+/)).toEqual(["Elements", "Fire", "Ice"])
  })

  it("keeps linebreak and tab nodes as whitespace", () => {
    const doc = {
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [text("Roses"), { type: "linebreak" }, text("Violets"), { type: "tab" }, text("Blue")],
          },
        ],
      },
    } as never
    expect(lexicalToPlainText(doc)).toBe("Roses\nViolets\tBlue")
  })

  it("keeps words inside links joined to their sentence", () => {
    const doc = {
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [text("see "), { type: "link", children: [text("the docs")] }, text(" here")],
          },
        ],
      },
    } as never
    expect(lexicalToPlainText(doc)).toBe("see the docs here")
  })

  // Compared against the prose word count, not `readingTime(markdown)`, which
  // also counts Markdown syntax tokens (`#`, `-`, `>`, `1.`) as words.
  it("counts every prose word across lists, quotes, and paragraphs", () => {
    const markdown = [
      "# Spells",
      "",
      "Casters pick from these schools:",
      "",
      "- Evocation deals damage",
      "- Abjuration protects allies",
      "  - Wards and shields",
      "",
      "> The wise mage prepares twice.",
      "",
      "1. First step",
      "2. Second step",
    ].join("\n")

    const prose =
      "Spells Casters pick from these schools: Evocation deals damage Abjuration " +
      "protects allies Wards and shields The wise mage prepares twice. First step Second step"

    expect(fromMarkdown(markdown).split(/\s+/)).toEqual(prose.split(" "))
    expect(readingTime(fromMarkdown(markdown)).words).toBe(readingTime(prose).words)
  })
})

describe("isLexicalEmpty", () => {
  const paragraph = (...children: unknown[]) => ({ type: "paragraph", children })
  const doc = (...children: unknown[]) => ({ root: { type: "root", children } }) as never

  it("treats null, undefined, and an empty root as empty", () => {
    expect(isLexicalEmpty(null)).toBe(true)
    expect(isLexicalEmpty(undefined)).toBe(true)
    expect(isLexicalEmpty(doc())).toBe(true)
  })

  it("treats a cleared editor (empty or whitespace paragraphs) as empty", () => {
    expect(isLexicalEmpty(doc(paragraph()))).toBe(true)
    expect(isLexicalEmpty(doc(paragraph(text("   ")), paragraph({ type: "linebreak" })))).toBe(true)
  })

  it("treats text as content", () => {
    expect(isLexicalEmpty(doc(paragraph(text("hi"))))).toBe(false)
  })

  it("treats image-only and code-only bodies as content", () => {
    expect(isLexicalEmpty(doc({ type: "upload", value: { id: 1 } }))).toBe(false)
    expect(isLexicalEmpty(doc(paragraph({ type: "inlineImage", src: "/a.png", alt: "" })))).toBe(false)
    expect(isLexicalEmpty(codeFixture())).toBe(false)
  })

  it("treats converted Markdown as empty exactly when the source is blank", () => {
    for (const markdown of ["", "   \n\n  ", "Hello", "- item"]) {
      const lexical = convertMarkdownToLexical({ editorConfig, markdown })
      expect(isLexicalEmpty(lexical)).toBe(!markdown.trim())
    }
  })
})
