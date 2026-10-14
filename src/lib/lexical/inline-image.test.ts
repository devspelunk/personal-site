import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
} from "@payloadcms/richtext-lexical"
import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical"
import { beforeAll, describe, expect, it } from "vitest"

import {
  assertConverterCoverage,
  getEnabledBlockSlugs,
  getEnabledNodeTypes,
} from "@/lib/lexical/coverage"

import { getTestEditorConfig } from "./test-editor-config"

let editorConfig: SanitizedServerEditorConfig

beforeAll(async () => {
  editorConfig = await getTestEditorConfig()
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

  it("passes when every enabled node type and block slug has a converter", () => {
    const converters = {
      ...Object.fromEntries(getEnabledNodeTypes(editorConfig).map((type) => [type, () => ""])),
      blocks: Object.fromEntries(
        getEnabledBlockSlugs(editorConfig).blocks.map((slug) => [slug, () => ""]),
      ),
    }

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
