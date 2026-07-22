import { postgresAdapter } from "@payloadcms/db-postgres"
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
} from "@payloadcms/richtext-lexical"
import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical"
import { buildConfig } from "payload"
import sharp from "sharp"
import { beforeAll, describe, expect, it } from "vitest"

import { Media } from "@/collections/Media"
import { assertConverterCoverage, buildEditorConfig, getEnabledNodeTypes } from "@/lib/lexical"

// A minimal sanitized Payload config is enough to sanitize the shared editor
// config: only the `media` collection is referenced (by the Upload feature).
// buildConfig sanitizes but never connects to the DB.
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

describe("shared lexical editor config", () => {
  it("exposes markdown transformers on the sanitized config", () => {
    const { markdownTransformers } = editorConfig.features

    expect(Array.isArray(markdownTransformers)).toBe(true)
    expect(markdownTransformers.length).toBeGreaterThan(0)
  })

  it("registers the custom inline-image node", () => {
    expect(getEnabledNodeTypes(editorConfig)).toContain("inlineImage")
  })
})

describe("coverage assertion scaffold", () => {
  it("throws when an enabled node type has no converter", () => {
    expect(() =>
      assertConverterCoverage({ converters: {}, editorConfig }),
    ).toThrow(/coverage gap/i)
  })

  it("passes when every enabled node type has a converter key", () => {
    const converters = Object.fromEntries(
      getEnabledNodeTypes(editorConfig).map((type) => [type, () => ""]),
    )

    expect(() => assertConverterCoverage({ converters, editorConfig })).not.toThrow()
  })
})

describe("inline-image markdown round-trip", () => {
  it("round-trips ![alt](/x.png) through the markdown transformers", () => {
    const markdown = "![alt](/x.png)"

    const state = convertMarkdownToLexical({ editorConfig, markdown })

    // The `![alt](url)` text must have been converted into an inlineImage node,
    // not left as a literal text node.
    expect(JSON.stringify(state)).toContain('"type":"inlineImage"')

    const roundTripped = convertLexicalToMarkdown({ data: state, editorConfig })

    expect(roundTripped.trim()).toBe(markdown)
  })
})
