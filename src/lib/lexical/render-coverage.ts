import type { SanitizedConfig } from "payload"

import { assertConverterCoverage } from "./coverage"
import { buildEditorConfig } from "./editor"
import { buildLexicalConverters } from "./render"

/**
 * Boot-time check that the renderer's real converter map covers the shared
 * editor feature set. Run from Payload's `onInit` (payload.config.ts), so a
 * feature enabled without a matching HTML converter fails at boot instead of
 * silently dropping content from rendered pages.
 *
 * Kept out of ./render.ts so pages don't load the editor module, and out of
 * ./coverage.ts so that stays a pure map-vs-config checker.
 *
 * Note: `payload migrate` initializes with `disableOnInit`, so migrations skip
 * this check; CI is expected to cover that path.
 */
export async function assertRenderCoverage(config: SanitizedConfig): Promise<string[]> {
  const editorConfig = await buildEditorConfig(config)
  const converters = buildLexicalConverters({ headings: [], slugCounts: new Map() })

  return assertConverterCoverage({ converters, editorConfig })
}
