import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"

/**
 * Hand-authored Lexical fixtures exercising every enabled feature node, used by
 * render.test.ts. Built as plain serialized JSON (the shape persisted in jsonb)
 * so the render path is verified without a running editor or database.
 */

const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_CODE = 1 << 4

export const text = (value: string, format = 0) => ({
  type: "text",
  version: 1,
  text: value,
  format,
  detail: 0,
  mode: "normal",
  style: "",
})

const paragraph = (...children: unknown[]) => ({
  type: "paragraph",
  version: 1,
  children,
  direction: "ltr",
  format: "",
  indent: 0,
})

const heading = (tag: string, ...children: unknown[]) => ({
  type: "heading",
  tag,
  version: 1,
  children,
  direction: "ltr",
  format: "",
  indent: 0,
})

const listItem = (value: number, ...children: unknown[]) => ({
  type: "listitem",
  value,
  version: 1,
  children,
  direction: "ltr",
  format: "",
  indent: 0,
})

const root = (...children: unknown[]): SerializedEditorState =>
  ({
    root: {
      type: "root",
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      children,
    },
  }) as unknown as SerializedEditorState

export const CODE_SAMPLE =
  "const x: number = 1\nfunction greet(name: string) {\n  return `hi ${name}`\n}"

/** Equivalent Markdown fence for the CodeBlock fixture — used for parity. */
export const CODE_SAMPLE_MARKDOWN = "```ts\n" + CODE_SAMPLE + "\n```\n"

export const codeBlock = (language: string, code: string) => ({
  type: "block",
  version: 2,
  fields: { blockType: "Code", language, code },
})

export const inlineImage = (src: string, alt: string) => ({
  type: "inlineImage",
  version: 1,
  src,
  alt,
})

/** A pre-populated (depth ≥1) upload node — `value` is the resolved Media doc. */
export const uploadImage = (doc: {
  url: string
  alt: string
  width: number
  height: number
}) => ({
  type: "upload",
  version: 3,
  relationTo: "media",
  fields: {},
  value: { id: 1, mimeType: "image/png", sizes: {}, ...doc },
})

/** An upload node left unpopulated (depth 0) — `value` is a bare id. */
export const uploadImageUnpopulated = () => ({
  type: "upload",
  version: 3,
  relationTo: "media",
  fields: {},
  value: 1,
})

/** Two same-text headings, to exercise deterministic id dedup (section-2). */
export const headingsFixture = () =>
  root(heading("h2", text("Section")), heading("h2", text("Section")))

export const codeFixture = () => root(codeBlock("ts", CODE_SAMPLE))

export const inlineImageFixture = () =>
  root(paragraph(text("Before "), inlineImage("/x.png", "an image"), text(" after")))

export const uploadFixture = () =>
  root(uploadImage({ url: "/media/pic.png", alt: "uploaded", width: 800, height: 600 }))

export const uploadUnpopulatedFixture = () => root(uploadImageUnpopulated())

const internalLink = (relationTo: string, slug: string, label: string) =>
  paragraph({
    type: "link",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    fields: { linkType: "internal", doc: { relationTo, value: { slug } }, newTab: false },
    children: [text(label)],
  })

/**
 * Internal links across collections whose Payload slug differs from its URL
 * route (blog-posts → /blog, ttrpg-lore → /ttrpg/lore), plus an external link —
 * pins `internalDocToHref` to the canonical `detailPathFor` mapping.
 */
export const internalLinksFixture = () =>
  root(
    internalLink("blog-posts", "hello", "blog link"),
    internalLink("ttrpg-lore", "dragons", "lore link"),
    paragraph({
      type: "link",
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      fields: { linkType: "custom", url: "https://example.com", newTab: false },
      children: [text("external")],
    }),
  )

/** A full document exercising the whole feature set at once. */
export const fullFixture = () =>
  root(
    heading("h2", text("Section")),
    heading("h2", text("Section")),
    paragraph(
      text("Plain "),
      text("bold", IS_BOLD),
      text(" "),
      text("italic", IS_ITALIC),
      text(" "),
      text("strike", IS_STRIKETHROUGH),
      text(" "),
      text("code", IS_CODE),
    ),
    paragraph({
      type: "link",
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      fields: { linkType: "custom", url: "https://example.com", newTab: false },
      children: [text("external")],
    }),
    paragraph({
      type: "link",
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      fields: {
        linkType: "internal",
        doc: { relationTo: "blog-posts", value: { slug: "hello" } },
        newTab: false,
      },
      children: [text("internal")],
    }),
    {
      type: "list",
      listType: "bullet",
      tag: "ul",
      start: 1,
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      children: [listItem(1, text("one")), listItem(2, text("two"))],
    },
    { type: "quote", version: 1, direction: "ltr", format: "", indent: 0, children: [text("a quote")] },
    { type: "horizontalrule", version: 1 },
    codeBlock("ts", CODE_SAMPLE),
    paragraph(text("Before "), inlineImage("/x.png", "an image"), text(" after")),
    uploadImage({ url: "/media/pic.png", alt: "uploaded", width: 800, height: 600 }),
  )
