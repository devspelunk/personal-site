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
 * Editor module: the shared richText feature set and the Payload editor
 * adapter built from it. Used by payload.config.ts, migrations, and
 * scripts/import-resume.ts. Rendering lives in ./render.ts.
 */

/**
 * Code-fence languages offered by the premade `CodeBlock`. Keys are the stored
 * language ids (rendered as `language-<key>`, matching shiki/rehype-pretty-code
 * aliases); values are the admin labels.
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
 *  - Markdown import: `convertMarkdownToLexical` via `features.markdownTransformers`
 *    (the migration and scripts/import-resume.ts)
 *  - render: ./render.ts keeps a converter for every enabled node, checked by
 *    `assertRenderCoverage` at Payload boot
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
  // Body images: Media uploads. Render needs the body fetched at depth ≥1.
  UploadFeature({ collections: { media: { fields: [] } } }),
  // Multi-line code: premade CodeBlock block + hand-written converter.
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
 * reference collections), so callers pass it in — e.g. the Markdown import
 * migration awaits `@payload-config` and reads `.features.markdownTransformers`
 * off the result to feed `convertMarkdownToLexical`.
 */
export function buildEditorConfig(
  config: SanitizedConfig,
): Promise<SanitizedServerEditorConfig> {
  return editorConfigFactory.fromFeatures({ config, features: lexicalFeatures })
}
