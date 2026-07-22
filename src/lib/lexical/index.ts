import type { SanitizedConfig } from "payload"

import {
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  CodeBlock,
  editorConfigFactory,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  lexicalEditor,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnorderedListFeature,
  UploadFeature,
} from "@payloadcms/richtext-lexical"
import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical"

import { InlineImageFeature } from "./inline-image/server"

/**
 * Code-fence languages offered by the premade `CodeBlock`. The content audit
 * found no code in the corpus, so this list is seeded deliberately for a dev
 * blog. Keys are the stored language ids (rendered as `language-<key>` in T2,
 * matching shiki/rehype-pretty-code aliases); values are the admin labels.
 */
export const CODE_LANGUAGES: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  jsx: "JSX",
  bash: "Bash",
  json: "JSON",
  sql: "SQL",
  py: "Python",
  go: "Go",
  css: "CSS",
  html: "HTML",
  md: "Markdown",
}

/**
 * The single, deliberately-enumerated feature set for long-form content. Built
 * explicitly (not derived from `defaultFeatures`) so the enabled node set is
 * deterministic and the coverage invariant is meaningful. Consumed three ways:
 *  - authoring: `lexicalEditor({ features: lexicalFeatures })` (see payload.config)
 *  - backfill (T3): `convertMarkdownToLexical` via `features.markdownTransformers`
 *  - render (T2): the hand-maintained converter map keyed off enabled nodes
 */
export const lexicalFeatures = [
  ParagraphFeature(),
  HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
  UnorderedListFeature(),
  OrderedListFeature(),
  LinkFeature({}),
  BoldFeature(),
  ItalicFeature(),
  StrikethroughFeature(),
  InlineCodeFeature(),
  BlockquoteFeature(),
  HorizontalRuleFeature(),
  InlineToolbarFeature(),
  FixedToolbarFeature(),
  // Body images: Media uploads (go-forward). Render needs depth ≥1 (T2).
  UploadFeature({ collections: { media: { fields: [] } } }),
  // Multi-line code: premade CodeBlock block + hand-written converter (T2).
  BlocksFeature({
    blocks: [CodeBlock({ defaultLanguage: "ts", languages: CODE_LANGUAGES })],
  }),
  // URL images: custom inline-image node `{ src, alt }` ↔ `![alt](url)`.
  InlineImageFeature(),
]

/**
 * The shared Payload richText editor adapter. Wired as the default `editor` in
 * payload.config.ts, replacing the bare `lexicalEditor()`.
 */
export const richTextEditor = lexicalEditor({ features: lexicalFeatures })

/**
 * Resolves the **sanitized** server editor config for the shared feature set.
 *
 * Sanitization requires the full `SanitizedConfig` (the Upload/Blocks features
 * reference collections), so callers pass it in — e.g. T3's migration/backfill
 * awaits `@payload-config` and reads `.features.markdownTransformers` off the
 * result to feed `convertMarkdownToLexical`.
 */
export function buildEditorConfig(
  config: SanitizedConfig,
): Promise<SanitizedServerEditorConfig> {
  return editorConfigFactory.fromFeatures({ config, features: lexicalFeatures })
}

export {
  assertConverterCoverage,
  getEnabledNodeTypes,
  LEXICAL_CONVERTER_MAP,
  type LexicalConverterMap,
} from "./coverage"
export { InlineImageFeature } from "./inline-image/server"
export {
  INSERT_INLINE_IMAGE_COMMAND,
  type InlineImagePayload,
  type SerializedInlineImageNode,
} from "./inline-image/shared"
