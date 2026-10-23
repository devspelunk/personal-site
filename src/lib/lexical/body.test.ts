import { describe, expect, it } from "vitest"

import { EXCERPT_LENGTH, bodyExcerpt, bodyReadTime, renderBody } from "./body"
import { fullFixture, headingsFixture, text } from "./render.fixtures"

const paragraph = (...children: unknown[]) => ({ type: "paragraph", children })
const doc = (...children: unknown[]) => ({ root: { type: "root", children } }) as never
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ")

describe("bodyReadTime", () => {
  it("is null for an empty body so nothing shows '0 min read'", () => {
    expect(bodyReadTime(null)).toBeNull()
    expect(bodyReadTime(undefined)).toBeNull()
    expect(bodyReadTime(doc(paragraph()))).toBeNull()
  })

  it("is at least one minute for a body with content but no words", () => {
    expect(bodyReadTime(doc({ type: "upload", value: { id: 1 } }))).toBe(1)
  })

  it("rounds up to whole minutes", () => {
    expect(bodyReadTime(doc(paragraph(text("one short line"))))).toBe(1)
    // reading-time assumes 200 words per minute.
    expect(bodyReadTime(doc(paragraph(text(words(450)))))).toBe(3)
  })
})

describe("bodyExcerpt", () => {
  it("prefers a stored summary with text", () => {
    expect(bodyExcerpt(fullFixture(), "  Stored summary.  ")).toBe("Stored summary.")
  })

  it("falls back to the body when the stored summary is blank or missing", () => {
    const body = doc(paragraph(text("From the body.")))

    expect(bodyExcerpt(body, "   ")).toBe("From the body.")
    expect(bodyExcerpt(body, null)).toBe("From the body.")
    expect(bodyExcerpt(body)).toBe("From the body.")
  })

  it("collapses block boundaries into single spaces", () => {
    expect(bodyExcerpt(doc(paragraph(text("First.")), paragraph(text("Second."))))).toBe(
      "First. Second.",
    )
  })

  it("cuts a long body on a word boundary and marks the cut", () => {
    const excerpt = bodyExcerpt(doc(paragraph(text(words(100)))))!

    expect(excerpt.length).toBeLessThanOrEqual(EXCERPT_LENGTH)
    expect(excerpt.endsWith("…")).toBe(true)
    expect(excerpt.slice(0, -1)).toMatch(/word\d+$/)
  })

  it("hard-cuts a single word longer than the limit", () => {
    const excerpt = bodyExcerpt(doc(paragraph(text("x".repeat(500)))))!

    expect(excerpt).toBe(`${"x".repeat(EXCERPT_LENGTH - 1)}…`)
  })

  it("is null when neither the summary nor the body has text", () => {
    expect(bodyExcerpt(null, null)).toBeNull()
    expect(bodyExcerpt(doc(paragraph()), "")).toBeNull()
  })
})

describe("renderBody", () => {
  it("returns html, headings, read time and excerpt from one call", async () => {
    const body = await renderBody(headingsFixture(), { excerpt: "Summary" })

    expect(body.html).toContain('id="section-2"')
    expect(body.headings.map((h) => h.id)).toEqual(["section", "section-2"])
    expect(body.readTime).toBe(1)
    expect(body.excerpt).toBe("Summary")
    expect(body.isEmpty).toBe(false)
  })

  it("renders an empty body as empty, with no read time or excerpt", async () => {
    const body = await renderBody(null)

    expect(body).toEqual({ html: "", headings: [], readTime: null, excerpt: null, isEmpty: true })
  })
})
